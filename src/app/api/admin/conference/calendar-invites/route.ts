import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/roles';
import { getDb } from '@/lib/mongodb';
import { ConferenceTicket } from '@/types/conference-ticket';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export const CONFERENCE_CALENDAR_SESSIONS = [
  {
    id: 'arrival',
    summary: 'Registration & Arrival - Michigan AI Business Conference 2026',
    location: 'Stewart Lobby, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      'Arrival, registration, coffee cart (courtesy of Rambler), and red carpet photos!\n\nPlease have your digital ticket confirmation or QR code ready upon arrival at the Stewart Lobby registration table.\n\nMichigan AI Business Conference 2026\nHosted by University of Michigan AI Business Group (ABG)\nWebsite: https://abgumich.org/conference',
    startTime: '2026-10-23T10:30:00-04:00',
    endTime: '2026-10-23T11:00:00-04:00',
  },
  {
    id: 'opening',
    summary: 'Opening Remarks - Michigan AI Business Conference 2026',
    location: 'Blau Colloquium (5th Floor), Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      'Welcome and opening remarks given by ABG President Julia Lotz.\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference',
    startTime: '2026-10-23T11:00:00-04:00',
    endTime: '2026-10-23T11:15:00-04:00',
  },
  {
    id: 'banks-and-funds',
    summary: "AI Inside the World's Biggest Banks and Funds - Michigan AI Business Conference 2026",
    location: 'Blau Colloquium (5th Floor), Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      "Panel: AI Inside the World's Biggest Banks and Funds\n\nFeatured Speakers:\n• Julia Lynn (VP, Applied AI/ML Lead at JPMorgan)\n• Nikhil Pajankar (Senior Product Manager, Risk Analytics at Citi)\n• Kaylee Weil (AI Reverse Mentor & Chief People Org Analyst at Bank of America)\n\nAI is reshaping finance — from trading and risk management to fraud detection and customer experience. Hear from industry experts on where the technology is headed.\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference",
    startTime: '2026-10-23T11:15:00-04:00',
    endTime: '2026-10-23T12:15:00-04:00',
  },
  {
    id: 'lunch-and-learn',
    summary: 'Lunch & Learn Sessions - Michigan AI Business Conference 2026',
    location: 'Rooms R2220 & R2230, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      'Catered lunch & learn breakout sessions:\n\n• Room R2220: Bitcoin 101 with Josh Spiewak (Managing Partner & COO at NorthStar Advisory Group) & Sloan Spiewak (ABG Portfolio Manager)\n• Room R2230: Building Your Professional Brand with Jacob Walker (Incoming Full-Time Analyst at BNY)\n\nEnjoy a catered lunch and join the discussion in either room!\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference',
    startTime: '2026-10-23T12:15:00-04:00',
    endTime: '2026-10-23T13:15:00-04:00',
  },
  {
    id: 'microsoft-keynote',
    summary: "Keynote: Engineering the Future: AI at Microsoft's Core - Michigan AI Business Conference 2026",
    location: 'Robertson Auditorium, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      "Featured Keynote: Engineering the Future: AI at Microsoft's Core\n\nSpeaker:\n• Jennifer Marsman (Principal Engineer in AI, Office of the CTO at Microsoft)\nModerator:\n• Michael Speigl (Professor, Ross School of Business)\n\nA deep dive into AI in the world of technology from Jennifer Marsman.\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference",
    startTime: '2026-10-23T13:15:00-04:00',
    endTime: '2026-10-23T14:15:00-04:00',
  },
  {
    id: 'pitch-to-portfolio',
    summary: 'From Pitch to Portfolio: Building and Funding the AI Wave - Michigan AI Business Conference 2026',
    location: 'Robertson Auditorium, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      'Panel: From Pitch to Portfolio: Building and Funding the AI Wave\n\nFeatured Speakers:\n• Lindsey Kilbride (Principal at Detroit Venture Partners)\n• Doug Neal (Co-Founder & Managing Director at eLab Ventures)\n• Belvin Liles (Principal at ID Ventures)\n• Evan Kramer (CEO at Traliant)\nModerator:\n• Anthony Walker (Former President, AI Business Group)\n\nExplore how venture capital and startup building are evolving alongside AI.\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference',
    startTime: '2026-10-23T15:45:00-04:00',
    endTime: '2026-10-23T16:30:00-04:00',
  },
  {
    id: 'closing',
    summary: 'Closing Remarks & Networking - Michigan AI Business Conference 2026',
    location: 'Robertson Auditorium & Lobby, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
    description:
      'Closing reflections, wrap-up remarks, and high-impact networking with speakers, attendees, and sponsors.\n\nMichigan AI Business Conference 2026\nWebsite: https://abgumich.org/conference',
    startTime: '2026-10-23T16:30:00-04:00',
    endTime: '2026-10-23T17:00:00-04:00',
  },
];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.roles || [])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = await getDb();
    const tickets = await db
      .collection<ConferenceTicket>('ConferenceTickets')
      .find({ status: 'confirmed' })
      .toArray();

    const attendeeMap = new Map<string, { email: string; displayName: string; tier: string }>();
    for (const t of tickets) {
      const email = (t.attendeeEmail || '').trim().toLowerCase();
      if (email && email.includes('@') && email.length > 3) {
        if (!attendeeMap.has(email)) {
          attendeeMap.set(email, {
            email,
            displayName: t.attendeeName ? t.attendeeName.trim() : email,
            tier: t.tier || 'General Admission',
          });
        }
      }
    }

    const attendees = Array.from(attendeeMap.values());

    return NextResponse.json({
      success: true,
      ticketCount: tickets.length,
      attendeeCount: attendees.length,
      attendees,
      sessions: CONFERENCE_CALENDAR_SESSIONS,
    });
  } catch (error: any) {
    console.error('Error fetching calendar invite preview:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch preview' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.roles || [])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean(body.dryRun);
    const paidOnly = Boolean(body.paidOnly);

    const db = await getDb();
    const query: any = { status: 'confirmed' };
    if (paidOnly) {
      query.tier = { $ne: 'Complimentary' };
    }

    const tickets = await db.collection<ConferenceTicket>('ConferenceTickets').find(query).toArray();

    // Deduplicate valid attendee emails
    const attendeeMap = new Map<string, { email: string; displayName: string; tier: string }>();
    for (const t of tickets) {
      const email = (t.attendeeEmail || '').trim().toLowerCase();
      if (email && email.includes('@') && email.length > 3) {
        if (!attendeeMap.has(email)) {
          attendeeMap.set(email, {
            email,
            displayName: t.attendeeName ? t.attendeeName.trim() : email,
            tier: t.tier || 'General Admission',
          });
        }
      }
    }

    const attendees = Array.from(attendeeMap.values());
    if (attendees.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No confirmed ticket holders with email addresses were found.',
      }, { status: 400 });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        attendeeCount: attendees.length,
        attendees,
        eventsCount: CONFERENCE_CALENDAR_SESSIONS.length,
        message: `Dry run successful. ${attendees.length} ticket holders ready to receive invites across 7 sessions.`,
      });
    }

    // Google Calendar API Client
    const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar API credentials not configured in environment (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN).',
      }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const attendeeList = attendees.map((a) => ({
      email: a.email,
      displayName: a.displayName,
    }));

    const createdEvents: Array<{ title: string; id: string; htmlLink?: string }> = [];
    const errors: Array<{ title: string; error: string }> = [];

    for (let i = 0; i < CONFERENCE_CALENDAR_SESSIONS.length; i++) {
      const ev = CONFERENCE_CALENDAR_SESSIONS[i];

      const eventPayload = {
        summary: ev.summary,
        location: ev.location,
        description: ev.description,
        start: {
          dateTime: ev.startTime,
          timeZone: 'America/Detroit',
        },
        end: {
          dateTime: ev.endTime,
          timeZone: 'America/Detroit',
        },
        attendees: attendeeList,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      };

      try {
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventPayload,
          sendUpdates: 'all', // Sends calendar email invites to all attendees
          conferenceDataVersion: 0,
        });

        createdEvents.push({
          title: ev.summary,
          id: response.data.id || '',
          htmlLink: response.data.htmlLink || undefined,
        });

        // Delay to avoid Google API rate limits
        await new Promise((r) => setTimeout(r, 400));
      } catch (err: any) {
        console.error(`Failed to insert calendar event "${ev.summary}":`, err.message);
        errors.push({
          title: ev.summary,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: createdEvents.length > 0,
      attendeeCount: attendees.length,
      createdCount: createdEvents.length,
      totalSessions: CONFERENCE_CALENDAR_SESSIONS.length,
      createdEvents,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error generating calendar invites:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}
