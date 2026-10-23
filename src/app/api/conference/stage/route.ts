import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { applyStageAction, canControlStage, getStageState, StageAction } from '@/lib/conference-stage';

export const dynamic = 'force-dynamic';

// Public read: the live stage screens poll this. serverNow lets screens correct for clock differences.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const [state, canControl] = await Promise.all([getStageState(), session ? canControlStage(session) : Promise.resolve(false)]);
    return NextResponse.json({ ...state, serverNow: Date.now(), canControl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error reading stage state:', error);
    return NextResponse.json({ error: 'Failed to read stage state' }, { status: 500 });
  }
}

// Stage controllers only: switch slides, run the timer, toggle the Up next bar
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await canControlStage(session))) {
      return NextResponse.json({ error: 'Not allowed to control the stage' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    let action: StageAction;
    if (body.action === 'show' && Array.isArray(body.sessionIds)) {
      action = { action: 'show', sessionIds: body.sessionIds.filter((x: unknown) => typeof x === 'string') };
    } else if (body.action === 'timer' && ['pause', 'resume', 'clear'].includes(body.op)) {
      action = { action: 'timer', op: body.op };
    } else if (body.action === 'timer' && (body.op === 'start' || body.op === 'adjust') && Number.isFinite(body.ms)) {
      action = { action: 'timer', op: body.op, ms: Number(body.ms) };
    } else if (body.action === 'upnext' && typeof body.show === 'boolean') {
      action = { action: 'upnext', show: body.show };
    } else {
      return NextResponse.json({ error: 'Invalid stage action' }, { status: 400 });
    }

    const state = await applyStageAction(action, session?.user?.email || 'admin');
    return NextResponse.json({ ...state, serverNow: Date.now(), canControl: true });
  } catch (error) {
    console.error('Error updating stage state:', error);
    const message = error instanceof Error && error.message === 'Unknown session' ? 'Unknown session' : 'Failed to update stage';
    return NextResponse.json({ error: message }, { status: message === 'Unknown session' ? 400 : 500 });
  }
}
