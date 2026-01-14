/**
 * Recruitment Applications API
 * GET - List applications for a cycle with enriched data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { 
  getApplicationsByCycle, 
  getReviewSummary,
  getBookingsByApplication,
  withConnection,
  COLLECTIONS,
} from '@/lib/recruitment/db';
import type { ApplicationStage, ApplicationTrack, ApplicantListItem } from '@/types/recruitment';

// CORS helper
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycleId');
    const stage = searchParams.get('stage') as ApplicationStage | null;
    const stages = searchParams.get('stages'); // Comma-separated list of stages
    const track = searchParams.get('track') as ApplicationTrack | null;

    if (!cycleId) {
      return corsResponse(
        NextResponse.json({ error: 'cycleId is required' }, { status: 400 })
      );
    }

    // Parse stages - support both single 'stage' and comma-separated 'stages'
    let stageFilter: ApplicationStage | ApplicationStage[] | undefined;
    if (stages) {
      stageFilter = stages.split(',') as ApplicationStage[];
    } else if (stage) {
      stageFilter = stage;
    }

    // Get applications
    const applications = await getApplicationsByCycle(cycleId, {
      stage: stageFilter,
      track: track || undefined,
    });

    // Enrich with review and event data
    const enrichedApplications: ApplicantListItem[] = await Promise.all(
      applications.map(async (app) => {
        const appId = app._id!;
        const reviewSummary = await getReviewSummary(appId);
        const bookings = await getBookingsByApplication(appId);
        
        // Get event attendance count
        const eventsAttended = await withConnection(async (db) => {
          return db.collection(COLLECTIONS.RSVPS).countDocuments({
            cycleId: cycleId,
            userId: app.userId,
            attendedAt: { $exists: true },
          });
        });

        // Check for coffee chat booking
        const hasCoffeeChat = bookings.some(b => b.slotKind === 'coffee_chat' && b.status !== 'cancelled');

        // Check for interview booking
        const hasInterview = bookings.some(b => 
          (b.slotKind === 'interview_round1' || b.slotKind === 'interview_round2') && 
          b.status !== 'cancelled'
        );

        // Get user info - try multiple strategies
        let userName = 'Unknown';
        let userEmail = 'unknown@umich.edu';
        
        // Strategy 1: Check bookings for this application (they store applicantEmail)
        const bookingWithEmail = bookings.find(b => b.applicantEmail);
        if (bookingWithEmail?.applicantEmail) {
          userEmail = bookingWithEmail.applicantEmail;
          userName = bookingWithEmail.applicantName || userEmail.split('@')[0];
        }
        
        // Strategy 2: Look up user in users collection by the Google sub ID
        if (userEmail === 'unknown@umich.edu') {
          const userDoc = await withConnection(async (db) => {
            // First try: check if userId looks like an email
            if (app.userId?.includes('@')) {
              return db.collection('users').findOne({ email: app.userId });
            }
            
            // Second try: search through NextAuth accounts collection
            const account = await db.collection('accounts').findOne({ providerAccountId: app.userId });
            if (account?.userId) {
              const { ObjectId } = await import('mongodb');
              try {
                return db.collection('users').findOne({ _id: new ObjectId(account.userId) });
              } catch {
                return db.collection('users').findOne({ _id: account.userId });
              }
            }
            
            return null;
          });
          
          if (userDoc) {
            userName = userDoc.name || userDoc.email?.split('@')[0] || 'Unknown';
            userEmail = userDoc.email || 'unknown@umich.edu';
          }
        }
        
        // Strategy 3: Fallback to answers - check common field names
        if (userEmail === 'unknown@umich.edu') {
          userName = (app.answers?.name as string) || 
                     (app.answers?.fullName as string) ||
                     (app.answers?.full_name as string) ||
                     (app.answers?.applicant_name as string) ||
                     (app.answers?.first_name as string) ||
                     'Unknown';
          userEmail = (app.answers?.email as string) || 
                      (app.answers?.applicant_email as string) ||
                      'unknown@umich.edu';
        }

        // Get headshot from files
        let headshot: string | undefined;
        if (app.files) {
          // Strategy 1: Look for exact field names
          headshot = app.files.headshot || app.files.photo || app.files.profile_photo || app.files.h;
          
          // Strategy 2: Search for keys containing headshot/photo/picture
          if (!headshot) {
            const fileKeys = Object.keys(app.files);
            const headshotKey = fileKeys.find(k => 
              k.toLowerCase().includes('headshot') || 
              k.toLowerCase().includes('photo') || 
              k.toLowerCase().includes('picture') ||
              k.toLowerCase().includes('profile')
            );
            if (headshotKey) {
              headshot = app.files[headshotKey];
            }
          }
          
          // Strategy 3: Look up question config to find file field with fileKind='headshot'
          if (!headshot) {
            const questionSet = await withConnection(async (db) => {
              return db.collection(COLLECTIONS.QUESTIONS).findOne({ cycleId, track: app.track });
            });
            if (questionSet?.fields) {
              const headshotField = questionSet.fields.find((f: any) => f.type === 'file' && f.fileKind === 'headshot');
              if (headshotField && app.files[headshotField.key]) {
                headshot = app.files[headshotField.key];
              }
            }
          }
        }

        return {
          _id: appId,
          name: userName,
          email: userEmail,
          track: app.track,
          stage: app.stage,
          submittedAt: app.submittedAt,
          reviewCount: reviewSummary?.reviewCount || 0,
          averageScore: reviewSummary?.avgScore,
          eventsAttended,
          hasCoffeeChat,
          hasInterview,
          headshot,
        };
      })
    );

    return corsResponse(NextResponse.json(enrichedApplications));
  } catch (error) {
    console.error('Error fetching applications:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    );
  }
}
