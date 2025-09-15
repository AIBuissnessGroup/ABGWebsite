import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await request.json();
    const { applicantName, applicantEmail, applicantPhone, responses } = data;

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    let ipAddress = 'unknown';
    if (cfConnectingIp) {
      ipAddress = cfConnectingIp;
    } else if (realIp) {
      ipAddress = realIp;
    } else if (forwarded) {
      ipAddress = forwarded.split(',')[0].trim();
    } else {
      // Fallback to remote address (might be ::1 for localhost)
      const remoteAddress = request.headers.get('x-forwarded-for') || 
                           request.headers.get('x-real-ip') || 
                           'unknown';
      ipAddress = remoteAddress;
    }
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await client.connect();
    const db = client.db();

    // Find the form
    const form = await db.collection('Form').findOne({ slug });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.isActive) {
      return NextResponse.json({ error: 'This form is no longer accepting submissions' }, { status: 403 });
    }

    if (form.deadline && new Date() > form.deadline) {
      return NextResponse.json({ error: 'The submission deadline has passed' }, { status: 403 });
    }

    // Get form questions (they're embedded in the form document)
    const questions = form.questions || [];

    // Check authentication requirement
    if (form.requireAuth) {
      const session = await getServerSession();
      
      if (!session?.user?.email) {
        return NextResponse.json({ 
          error: 'Authentication required. Please sign in with your UMich Google account.' 
        }, { status: 401 });
      }

      if (!session.user.email.endsWith('@umich.edu')) {
        return NextResponse.json({ 
          error: 'This form requires a University of Michigan email address.' 
        }, { status: 403 });
      }

      // Override applicant email with authenticated email for security
      const authenticatedEmail = session.user.email;
      const authenticatedName = session.user.name || applicantName;
      
      // Use authenticated data
      data.applicantEmail = authenticatedEmail;
      data.applicantName = authenticatedName;
    }

    // Attendance geo-fence check (if enabled)
    if (form.isAttendanceForm && form.attendanceLatitude && form.attendanceLongitude && form.attendanceRadiusMeters) {
      const toRad = (v: number) => (v * Math.PI) / 180;
      const getDistanceMeters = (latA: number, lonA: number, latB: number, lonB: number) => {
        const R = 6371000;
        const dLat = toRad(latA - latB);
        const dLon = toRad(lonA - lonB);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(toRad(latB)) * Math.cos(toRad(latA));
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      const { latitude, longitude } = data || {};

      let verified = false;
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        const distance = getDistanceMeters(latitude, longitude, form.attendanceLatitude, form.attendanceLongitude);
        verified = distance <= form.attendanceRadiusMeters;
      }

      if (!verified) {
        // Fallback: approximate IP geolocation (coarse). Only attempt if we have a plausible client IP.
        try {
          const fwd = forwarded || request.headers.get('x-forwarded-for');
          const ip = fwd ? fwd.split(',')[0].trim() : null;
          if (ip && ip !== '127.0.0.1' && ip !== '::1') {
            // Try ipapi.co (no key, rate limited). Alternative: ip-api.com/json
            const ipRes = await fetch(`https://ipapi.co/${ip}/json/`, { cache: 'no-store' });
            if (ipRes.ok) {
              const ipJson: any = await ipRes.json();
              const ipLat = ipJson.latitude ?? ipJson.lat;
              const ipLon = ipJson.longitude ?? ipJson.lon;
              if (typeof ipLat === 'number' && typeof ipLon === 'number') {
                const distance = getDistanceMeters(ipLat, ipLon, form.attendanceLatitude, form.attendanceLongitude);
                // Note: IP geolocation is coarse; you may want to use a larger radius or separate fallback threshold
                if (distance <= form.attendanceRadiusMeters) {
                  verified = true;
                }
              }
            }
          }
        } catch (e) {
          // ignore fallback errors
        }
      }

      if (!verified) {
        return NextResponse.json({ error: 'Location required to submit attendance form. Please enable location services.' }, { status: 400 });
      }
    }

    // Check if multiple submissions are allowed
    if (!form.allowMultiple) {
      const existingApplication = await db.collection('Application').findOne({
        formId: form.id,
        applicantEmail: data.applicantEmail || applicantEmail
      });

      if (existingApplication) {
        return NextResponse.json({ 
          error: 'You have already submitted an application for this form' 
        }, { status: 400 });
      }
    }

    // Check max submissions limit
    if (form.maxSubmissions) {
      const submissionCount = await db.collection('Application').countDocuments({
        formId: form.id
      });

      if (submissionCount >= form.maxSubmissions) {
        return NextResponse.json({ 
          error: 'This form has reached its maximum number of submissions' 
        }, { status: 403 });
      }
    }

    // Validate required fields
    const requiredQuestions = questions.filter((q: any) => q.required);
    for (const question of requiredQuestions) {
      const response = responses.find((r: any) => r.questionId === question.id);
      if (!response || !response.value) {
        return NextResponse.json({ 
          error: `Please answer the required question: ${question.title}` 
        }, { status: 400 });
      }
    }

    // Create application with responses
    const applicationData = {
      formId: form.id,
      applicantName: data.applicantName || applicantName,
      applicantEmail: data.applicantEmail || applicantEmail,
      applicantPhone,
      ipAddress,
      userAgent,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: responses.map((response: any) => {
        const question = questions.find((q: any) => q.id === response.questionId);
        if (!question) return null;

        // Skip empty responses
        if (response.value === null || response.value === undefined || response.value === '') {
          return null;
        }

        const responseData: any = {
          questionId: response.questionId
        };

        // Store response based on question type
        switch (question.type) {
          case 'TEXT':
          case 'TEXTAREA':
          case 'EMAIL':
          case 'PHONE':
          case 'URL':
            responseData.textValue = response.value;
            break;
          case 'NUMBER':
            responseData.numberValue = parseFloat(response.value);
            break;
          case 'DATE':
            responseData.dateValue = new Date(response.value);
            break;
          case 'BOOLEAN':
            responseData.booleanValue = response.value === 'true' || response.value === true;
            break;
          case 'SELECT':
          case 'RADIO':
            responseData.textValue = response.value;
            break;
          case 'CHECKBOX':
            responseData.selectedOptions = Array.isArray(response.value) 
              ? JSON.stringify(response.value) 
              : JSON.stringify([response.value]);
            break;
          case 'FILE':
            if (typeof response.value === 'object' && response.value.fileData) {
              responseData.fileName = response.value.fileName;
              responseData.fileSize = response.value.fileSize;
              responseData.fileType = response.value.fileType;
              responseData.fileData = response.value.fileData;
            } else {
              // Fallback for old format (just filename)
              responseData.fileUrl = response.value;
            }
            break;
          default:
            responseData.textValue = response.value;
        }

        return responseData;
      }).filter(Boolean)
    };

    const result = await db.collection('Application').insertOne(applicationData);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully!',
      applicationId: result.insertedId.toString()
    });

  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await client.close();
  }
} 