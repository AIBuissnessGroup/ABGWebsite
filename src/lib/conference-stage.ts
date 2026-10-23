import type { Session } from 'next-auth';
import { getDb } from './mongodb';
import { isAdmin } from './roles';
import { getConferenceData } from './site-content/conference';
import { CONFERENCE_LINEUP } from './conference-lineup';

// Live stage state, set from the /conference/control remote and read by the live stage screens
export interface StageTimer {
  status: 'idle' | 'running' | 'paused';
  endsAt?: number; // running: when it reaches zero
  remainingMs?: number; // paused: time left
}

export interface StageState {
  sessionIds: string[]; // what's on screen (two ids when concurrent sessions share a slide)
  timer: StageTimer;
  showUpNext: boolean;
  updatedAt: number;
  updatedBy?: string;
}

const STAGE_DOC_ID = 'michigan-ai-conference-2026-stage';

export const DEFAULT_STAGE_STATE: StageState = {
  sessionIds: [CONFERENCE_LINEUP[0].id],
  timer: { status: 'idle' },
  showUpNext: true,
  updatedAt: 0,
};

export async function getStageState(): Promise<StageState> {
  const db = await getDb();
  const doc = await db.collection('ConferenceStage').findOne({ id: STAGE_DOC_ID });
  if (!doc) return DEFAULT_STAGE_STATE;
  return {
    sessionIds: doc.sessionIds || DEFAULT_STAGE_STATE.sessionIds,
    timer: doc.timer || DEFAULT_STAGE_STATE.timer,
    showUpNext: doc.showUpNext ?? true,
    updatedAt: doc.updatedAt || 0,
    updatedBy: doc.updatedBy,
  };
}

// Admins on the stage controller list (or any admin while the list is empty)
export async function canControlStage(session: Session | null): Promise<boolean> {
  const email = session?.user?.email?.toLowerCase();
  if (!email || !isAdmin(session?.user?.roles || [])) return false;
  const controllers = (await getConferenceData()).stageControllers || [];
  return controllers.length === 0 || controllers.some((c) => c.email.toLowerCase() === email);
}

export type StageAction =
  | { action: 'show'; sessionIds: string[] }
  | { action: 'timer'; op: 'start'; ms: number }
  | { action: 'timer'; op: 'pause' | 'resume' | 'clear' }
  | { action: 'timer'; op: 'adjust'; ms: number }
  | { action: 'upnext'; show: boolean };

const MAX_TIMER_MS = 12 * 60 * 60 * 1000;

export function nextTimer(timer: StageTimer, action: Extract<StageAction, { action: 'timer' }>, now: number): StageTimer {
  switch (action.op) {
    case 'start':
      return { status: 'running', endsAt: now + Math.min(Math.max(action.ms, 0), MAX_TIMER_MS) };
    case 'pause':
      return timer.status === 'running' ? { status: 'paused', remainingMs: Math.max(0, (timer.endsAt || now) - now) } : timer;
    case 'resume':
      return timer.status === 'paused' ? { status: 'running', endsAt: now + (timer.remainingMs || 0) } : timer;
    case 'adjust':
      if (timer.status === 'running') return { status: 'running', endsAt: Math.max(now, (timer.endsAt || now) + action.ms) };
      if (timer.status === 'paused') return { status: 'paused', remainingMs: Math.max(0, (timer.remainingMs || 0) + action.ms) };
      return timer;
    case 'clear':
      return { status: 'idle' };
  }
}

// Validates and applies a remote action, returning the new state
export async function applyStageAction(action: StageAction, by: string): Promise<StageState> {
  const current = await getStageState();
  const now = Date.now();
  const next: StageState = { ...current, updatedAt: now, updatedBy: by };

  if (action.action === 'show') {
    const valid = action.sessionIds.filter((id) => CONFERENCE_LINEUP.some((s) => s.id === id)).slice(0, 2);
    if (valid.length === 0) throw new Error('Unknown session');
    next.sessionIds = valid;
  } else if (action.action === 'timer') {
    next.timer = nextTimer(current.timer, action, now);
  } else if (action.action === 'upnext') {
    next.showUpNext = action.show;
  }

  const db = await getDb();
  await db.collection('ConferenceStage').updateOne({ id: STAGE_DOC_ID }, { $set: { id: STAGE_DOC_ID, ...next } }, { upsert: true });
  return next;
}
