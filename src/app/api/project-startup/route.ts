import { NextRequest, NextResponse } from 'next/server';
import { generateStartupPlan, getInterviewHelp, ingestText } from '@/lib/projectStartup';

type ApiResponse =
  | { ok: true; data: any }
  | { ok: false; error: string };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    const payload = body.payload || {};

    if (!action) {
      return NextResponse.json({ ok: false, error: 'Missing action' }, { status: 400 });
    }

    if (action === 'generate') {
      const idea = payload.idea;
      const stage = payload.stage;
      if (!idea) {
        return NextResponse.json({ ok: false, error: 'Missing idea' }, { status: 400 });
      }
      const result = await generateStartupPlan(idea, { stage, format: payload.format || 'text' });
      return NextResponse.json({ ok: true, data: result }, { status: 200 });
    }

    if (action === 'interview') {
      const role = payload.role || 'software engineer';
      const level = payload.level || 'junior';
      const result = await getInterviewHelp(role, { level });
      return NextResponse.json({ ok: true, data: result }, { status: 200 });
    }

    if (action === 'read') {
      const text = payload.text;
      if (!text) {
        return NextResponse.json({ ok: false, error: 'Missing text to read' }, { status: 400 });
      }
      const result = await ingestText(text);
      return NextResponse.json({ ok: true, data: result }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('project-startup api error', err);
    return NextResponse.json({ ok: false, error: err.message || String(err) }, { status: 500 });
  }
}
