/**
 * Phase Rankings API
 * GET - Get rankings for a specific phase
 * POST - Generate a fresh ranking (live) or get the finalized one
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, MongoClientOptions } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { 
  generatePhaseRanking,
  getLatestPhaseRanking,
  getFinalizedPhaseRanking,
  getPhaseConfig,
  getPhaseCompleteness,
} from '@/lib/recruitment/db';
import type { ReviewPhase, ApplicationTrack } from '@/types/recruitment';

// MongoDB connection options
const connectionString = process.env.DATABASE_URL || '';
const hasTlsInConnectionString = /[?&](tls|ssl)=/.test(connectionString);
const isProduction = process.env.NODE_ENV === 'production';

const mongoOptions: MongoClientOptions = hasTlsInConnectionString
  ? (isProduction 
      ? { tlsCAFile: '/app/global-bundle.pem' }
      : { tlsAllowInvalidCertificates: true })
  : {
      tls: isProduction,
      tlsCAFile: isProduction ? '/app/global-bundle.pem' : undefined,
    };

// Helper to get all admin emails from the database
async function getAllAdminEmails(): Promise<string[]> {
  const client = new MongoClient(process.env.DATABASE_URL!, mongoOptions);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Get all users with ADMIN role
    const adminUsers = await db.collection('users').find({
      roles: { $in: ['ADMIN', 'PRESIDENT', 'VP_INTERNAL', 'VP_EXTERNAL', 'VP_TECH', 'VP_MARKETING', 'VP_FINANCE'] }
    }).toArray();
    
    return adminUsers.map(u => u.email).filter(Boolean);
  } finally {
    await client.close();
  }
}

// CORS helper
function corsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    const phase = searchParams.get('phase') as ReviewPhase | null;
    const track = searchParams.get('track') as ApplicationTrack | null;
    const mode = searchParams.get('mode') || 'live'; // 'live', 'finalized', or 'counts'

    if (!cycleId) {
      return corsResponse(
        NextResponse.json({ error: 'cycleId is required' }, { status: 400 })
      );
    }

    // If mode is 'counts', return applicant counts for all phases (based on application stage)
    if (mode === 'counts') {
      const client = new MongoClient(process.env.DATABASE_URL!, mongoOptions);
      try {
        await client.connect();
        const applicationsCollection = client.db().collection('recruitment_applications');
        
        // Build match filter including optional track filter
        const matchFilter: Record<string, unknown> = { cycleId };
        if (track) {
          matchFilter.$or = [{ track }, { track: 'both' }];
        }
        
        // Count applications by stage, then map to phases
        const stageCounts = await applicationsCollection.aggregate([
          { $match: matchFilter },
          { $group: { _id: '$stage', count: { $sum: 1 } } }
        ]).toArray();
        
        const stageMap = stageCounts.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {} as Record<string, number>);
        
        // Map stages to phases
        const phaseCounts = {
          application: (stageMap['submitted'] || 0) + (stageMap['under_review'] || 0),
          interview_round1: stageMap['interview_round1'] || 0,
          interview_round2: stageMap['interview_round2'] || 0,
        };
        
        return corsResponse(NextResponse.json({ phaseCounts }));
      } finally {
        await client.close();
      }
    }

    if (!phase) {
      return corsResponse(
        NextResponse.json({ error: 'phase is required for this mode' }, { status: 400 })
      );
    }

    // Validate phase
    const validPhases: ReviewPhase[] = ['application', 'interview_round1', 'interview_round2'];
    if (!validPhases.includes(phase)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
      );
    }

    // Get phase config and completeness (with optional track)
    const phaseConfig = await getPhaseConfig(cycleId, phase, track || undefined);
    const completeness = await getPhaseCompleteness(cycleId, phase, track || undefined);

    // Get ranking based on mode
    let ranking;
    if (mode === 'finalized') {
      ranking = await getFinalizedPhaseRanking(cycleId, phase);
      if (!ranking) {
        return corsResponse(NextResponse.json({
          error: 'Phase has not been finalized yet',
          phaseConfig,
          completeness,
        }, { status: 404 }));
      }
    } else {
      // Generate live ranking (with optional track)
      ranking = await generatePhaseRanking(cycleId, phase, track || undefined);
    }

    // Calculate which admins haven't completed their reviews
    const allAdminEmails = await getAllAdminEmails();
    const incompleteAdmins: { email: string; reviewed: number; total: number }[] = [];
    
    for (const adminEmail of allAdminEmails) {
      const reviewerStats = completeness.reviewerCompletion.find(r => r.email === adminEmail);
      const reviewed = reviewerStats?.reviewed || 0;
      const total = completeness.totalApplicants;
      
      if (reviewed < total) {
        incompleteAdmins.push({
          email: adminEmail,
          reviewed,
          total,
        });
      }
    }
    
    // Sort by how many they've reviewed (most first)
    incompleteAdmins.sort((a, b) => b.reviewed - a.reviewed);

    return corsResponse(NextResponse.json({
      ranking,
      phaseConfig,
      completeness,
      isFinalized: phaseConfig?.status === 'finalized',
      incompleteAdmins,
      totalAdmins: allAdminEmails.length,
    }));
  } catch (error) {
    console.error('Error fetching phase rankings:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const { cycleId, phase } = await request.json();

    if (!cycleId || !phase) {
      return corsResponse(
        NextResponse.json({ error: 'cycleId and phase are required' }, { status: 400 })
      );
    }

    // Validate phase
    const validPhases: ReviewPhase[] = ['application', 'interview_round1', 'interview_round2'];
    if (!validPhases.includes(phase)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
      );
    }

    // Generate fresh ranking
    const ranking = await generatePhaseRanking(cycleId, phase);
    const phaseConfig = await getPhaseConfig(cycleId, phase);
    const completeness = await getPhaseCompleteness(cycleId, phase);

    return corsResponse(NextResponse.json({
      ranking,
      phaseConfig,
      completeness,
      isFinalized: phaseConfig?.status === 'finalized',
    }));
  } catch (error) {
    console.error('Error generating phase ranking:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to generate ranking' }, { status: 500 })
    );
  }
}
