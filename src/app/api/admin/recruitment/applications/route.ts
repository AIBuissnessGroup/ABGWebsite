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

        // Get user info from application answers (name and email are mandatory fields)
        let userName = 'Unknown';
        let userEmail = 'unknown@umich.edu';
        
        // Primary: Get name and email from application answers
        if (app.answers) {
          // Look for email in answers
          const emailKey = Object.keys(app.answers).find(k => 
            k === 'email' || k === 'applicant_email' || k.toLowerCase() === 'email'
          );
          if (emailKey && app.answers[emailKey]) {
            userEmail = app.answers[emailKey] as string;
          }
          
          // Look for name in answers
          const nameKey = Object.keys(app.answers).find(k => 
            k === 'name' || k === 'full_name' || k === 'fullName' || 
            k === 'applicant_name' || k.toLowerCase() === 'name'
          );
          if (nameKey && app.answers[nameKey]) {
            userName = app.answers[nameKey] as string;
          }
        }
        
        // Fallback: Check for userEmail/userName stored on application
        if (userEmail === 'unknown@umich.edu' && app.userEmail) {
          userEmail = app.userEmail;
        }
        if (userName === 'Unknown' && app.userName) {
          userName = app.userName;
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
