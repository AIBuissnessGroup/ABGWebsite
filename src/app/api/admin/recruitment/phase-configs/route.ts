/**
 * Phase Configuration API
 * GET - Get phase configs for a cycle
 * POST - Initialize or update phase configs
 * PUT - Update a specific phase config
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, MongoClientOptions } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { 
  getPhaseConfigsByCycle,
  getPhaseConfig,
  upsertPhaseConfig,
  initializePhaseConfigs,
  finalizePhase,
  unlockPhase,
  revertPhase,
  getPhaseCompleteness,
} from '@/lib/recruitment/db';
import { logAuditEvent } from '@/lib/audit';
import type { ReviewPhase, PhaseConfig, ScoringCategory, ApplicationTrack } from '@/types/recruitment';

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
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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

    if (!cycleId) {
      return corsResponse(
        NextResponse.json({ error: 'cycleId is required' }, { status: 400 })
      );
    }

    if (phase) {
      // Get specific phase config (optionally for specific track)
      const config = await getPhaseConfig(cycleId, phase, track || undefined);
      if (!config) {
        return corsResponse(
          NextResponse.json({ error: 'Phase config not found' }, { status: 404 })
        );
      }
      return corsResponse(NextResponse.json(config));
    } else {
      // Get all phase configs for cycle (optionally filtered by track)
      const configs = await getPhaseConfigsByCycle(cycleId, track || undefined);
      return corsResponse(NextResponse.json(configs));
    }
  } catch (error) {
    console.error('Error fetching phase configs:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to fetch phase configs' }, { status: 500 })
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

    const { cycleId, action } = await request.json();

    if (!cycleId) {
      return corsResponse(
        NextResponse.json({ error: 'cycleId is required' }, { status: 400 })
      );
    }

    if (action === 'initialize') {
      // Initialize default phase configs for cycle
      await initializePhaseConfigs(cycleId);
      const configs = await getPhaseConfigsByCycle(cycleId);
      
      await logAuditEvent(
        session.user.id || session.user.email,
        session.user.email,
        'content.created',
        'RecruitmentPhaseConfigs',
        {
          targetId: cycleId,
          meta: { action: 'initialize' },
        }
      );
      
      return corsResponse(NextResponse.json(configs, { status: 201 }));
    }

    return corsResponse(
      NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    );
  } catch (error) {
    console.error('Error initializing phase configs:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to initialize phase configs' }, { status: 500 })
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return corsResponse(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    if (!isAdmin(session.user)) {
      return corsResponse(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }

    const data = await request.json();
    const { cycleId, phase, track, action } = data;

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

    // Validate track if provided
    const validTracks: ApplicationTrack[] = ['business', 'engineering', 'ai_investment_fund', 'ai_energy_efficiency', 'both'];
    if (track && !validTracks.includes(track)) {
      return corsResponse(
        NextResponse.json({ error: 'Invalid track' }, { status: 400 })
      );
    }

    // Handle specific actions
    if (action === 'finalize') {
      const existingConfig = await getPhaseConfig(cycleId, phase);
      if (existingConfig?.status === 'finalized') {
        return corsResponse(
          NextResponse.json({ error: 'Phase is already finalized' }, { status: 400 })
        );
      }
      
      // Validate all admins have reviewed all applicants before allowing finalization
      const completeness = await getPhaseCompleteness(cycleId, phase);
      const allAdminEmails = await getAllAdminEmails();
      
      // Check each admin has reviewed every applicant
      const incompleteAdmins: { email: string; reviewed: number; total: number }[] = [];
      
      for (const adminEmailToCheck of allAdminEmails) {
        const reviewerStats = completeness.reviewerCompletion.find(r => r.email === adminEmailToCheck);
        const reviewed = reviewerStats?.reviewed || 0;
        const total = completeness.totalApplicants;
        
        if (reviewed < total) {
          incompleteAdmins.push({
            email: adminEmailToCheck,
            reviewed,
            total,
          });
        }
      }
      
      if (incompleteAdmins.length > 0) {
        return corsResponse(
          NextResponse.json({ 
            error: 'Cannot finalize: Not all admins have reviewed all applicants',
            incompleteAdmins,
            message: `${incompleteAdmins.length} admin(s) have not completed their reviews. All ${allAdminEmails.length} admins must review all ${completeness.totalApplicants} applicants before finalizing.`,
          }, { status: 400 })
        );
      }
      
      await finalizePhase(cycleId, phase, session.user.email);
      const updatedConfig = await getPhaseConfig(cycleId, phase);
      
      await logAuditEvent(
        session.user.id || session.user.email,
        session.user.email,
        'content.updated',
        'RecruitmentPhaseConfig',
        {
          targetId: `${cycleId}_${phase}`,
          meta: { action: 'finalize', phase },
        }
      );
      
      return corsResponse(NextResponse.json(updatedConfig));
    }

    if (action === 'unlock') {
      const existingConfig = await getPhaseConfig(cycleId, phase);
      if (existingConfig?.status !== 'finalized') {
        return corsResponse(
          NextResponse.json({ error: 'Phase is not finalized' }, { status: 400 })
        );
      }
      
      await unlockPhase(cycleId, phase, session.user.email);
      const updatedConfig = await getPhaseConfig(cycleId, phase);
      
      await logAuditEvent(
        session.user.id || session.user.email,
        session.user.email,
        'content.updated',
        'RecruitmentPhaseConfig',
        {
          targetId: `${cycleId}_${phase}`,
          meta: { action: 'unlock', phase },
        }
      );
      
      return corsResponse(NextResponse.json(updatedConfig));
    }

    if (action === 'revert') {
      const existingConfig = await getPhaseConfig(cycleId, phase);
      // Allow revert if phase is finalized OR if cutoff was applied
      if (existingConfig?.status !== 'finalized' && !existingConfig?.cutoffAppliedAt) {
        return corsResponse(
          NextResponse.json({ error: 'Phase must be finalized or have cutoff applied to revert' }, { status: 400 })
        );
      }
      
      // Revert applicants to previous stage and unlock
      const result = await revertPhase(cycleId, phase, session.user.email);
      await unlockPhase(cycleId, phase, session.user.email);
      const updatedConfig = await getPhaseConfig(cycleId, phase);
      
      await logAuditEvent(
        session.user.id || session.user.email,
        session.user.email,
        'content.updated',
        'RecruitmentPhaseConfig',
        {
          targetId: `${cycleId}_${phase}`,
          meta: { action: 'revert', phase, revertedCount: result.reverted },
        }
      );
      
      return corsResponse(NextResponse.json({ 
        ...updatedConfig, 
        revertedCount: result.reverted,
        message: `Reverted ${result.reverted} applicants to previous stage` 
      }));
    }

    if (action === 'start') {
      const configData: Partial<PhaseConfig> = {
        cycleId,
        phase,
        status: 'in_progress',
      };
      
      await upsertPhaseConfig(configData as Omit<PhaseConfig, '_id'>);
      const updatedConfig = await getPhaseConfig(cycleId, phase);
      
      await logAuditEvent(
        session.user.id || session.user.email,
        session.user.email,
        'content.updated',
        'RecruitmentPhaseConfig',
        {
          targetId: `${cycleId}_${phase}`,
          meta: { action: 'start', phase },
        }
      );
      
      return corsResponse(NextResponse.json(updatedConfig));
    }

    // Update config fields
    const existingConfig = await getPhaseConfig(cycleId, phase, track || undefined);
    if (existingConfig?.status === 'finalized') {
      return corsResponse(
        NextResponse.json({ error: 'Cannot modify finalized phase config' }, { status: 400 })
      );
    }

    const allowedFields = ['scoringCategories', 'minReviewersRequired', 'referralWeights', 'interviewQuestions', 'useZScoreNormalization', 'status'];
    const updateData: Partial<PhaseConfig> = { cycleId, phase };
    
    // Include track if provided (for track-specific configs)
    if (track) {
      updateData.track = track;
    }
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        (updateData as any)[field] = data[field];
      }
    }

    await upsertPhaseConfig(updateData as Omit<PhaseConfig, '_id'>);
    const updatedConfig = await getPhaseConfig(cycleId, phase, track || undefined);

    await logAuditEvent(
      session.user.id || session.user.email,
      session.user.email,
      'content.updated',
      'RecruitmentPhaseConfig',
      {
        targetId: `${cycleId}_${phase}${track ? `_${track}` : ''}`,
        meta: { updatedFields: Object.keys(updateData), track },
      }
    );

    return corsResponse(NextResponse.json(updatedConfig));
  } catch (error) {
    console.error('Error updating phase config:', error);
    return corsResponse(
      NextResponse.json({ error: 'Failed to update phase config' }, { status: 500 })
    );
  }
}
