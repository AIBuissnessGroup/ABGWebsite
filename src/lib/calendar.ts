/**
 * Google Calendar Integration
 * Creates calendar events for coffee chats and interviews
 */

import { google, calendar_v3 } from 'googleapis';

let cachedCalendarClient: calendar_v3.Calendar | null = null;

async function getCalendarClient(): Promise<calendar_v3.Calendar | null> {
  if (cachedCalendarClient) {
    return cachedCalendarClient;
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Google Calendar API credentials not configured');
    console.error('   Using same credentials as Gmail API');
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Verify the token works
    const { token } = await oauth2Client.getAccessToken();
    if (!token) {
      throw new Error('Failed to obtain access token');
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    cachedCalendarClient = calendar;
    console.log('✅ Google Calendar API client initialized');
    return calendar;
  } catch (error: any) {
    console.error('❌ Error creating Google Calendar API client:', error.message);
    cachedCalendarClient = null;
    return null;
  }
}

export interface CalendarEventDetails {
  summary: string;           // Event title
  description?: string;      // Event description
  location?: string;         // Physical location or virtual meeting URL
  startTime: string;         // ISO date string
  endTime: string;           // ISO date string
  attendees: {
    email: string;
    displayName?: string;
  }[];
  meetingUrl?: string;       // Optional video conference link
}

export interface CalendarEventResult {
  success: boolean;
  eventId?: string;
  htmlLink?: string;
  error?: string;
}

/**
 * Create a Google Calendar event with attendees
 * This will send invites to all attendees
 */
export async function createCalendarEvent(
  details: CalendarEventDetails
): Promise<CalendarEventResult> {
  try {
    const calendar = await getCalendarClient();
    
    if (!calendar) {
      console.warn('Calendar client not available, skipping event creation');
      return { 
        success: false, 
        error: 'Calendar API not configured' 
      };
    }

    const event: calendar_v3.Schema$Event = {
      summary: details.summary,
      description: details.description,
      location: details.location,
      start: {
        dateTime: details.startTime,
        timeZone: 'America/Detroit', // Michigan timezone
      },
      end: {
        dateTime: details.endTime,
        timeZone: 'America/Detroit',
      },
      attendees: details.attendees.map(a => ({
        email: a.email,
        displayName: a.displayName,
      })),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 },       // 30 mins before
        ],
      },
    };

    // Add conference data if there's a meeting URL
    if (details.meetingUrl) {
      event.description = `${details.description || ''}\n\nJoin meeting: ${details.meetingUrl}`.trim();
    }

    const response = await calendar.events.insert({
      calendarId: 'primary', // Use the authenticated account's primary calendar
      requestBody: event,
      sendUpdates: 'all', // Send email invites to all attendees
      conferenceDataVersion: 0, // Don't auto-create a Google Meet conference
    });

    console.log('✅ Calendar event created:', response.data.id);
    
    return {
      success: true,
      eventId: response.data.id || undefined,
      htmlLink: response.data.htmlLink || undefined,
    };
  } catch (error: any) {
    console.error('❌ Error creating calendar event:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a Google Calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const calendar = await getCalendarClient();
    
    if (!calendar) {
      console.warn('Calendar client not available, skipping event deletion');
      return false;
    }

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all', // Notify attendees of cancellation
    });

    console.log('✅ Calendar event deleted:', eventId);
    return true;
  } catch (error: any) {
    console.error('❌ Error deleting calendar event:', error.message);
    return false;
  }
}

/**
 * Update a Google Calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<CalendarEventDetails>
): Promise<CalendarEventResult> {
  try {
    const calendar = await getCalendarClient();
    
    if (!calendar) {
      console.warn('Calendar client not available, skipping event update');
      return { success: false, error: 'Calendar API not configured' };
    }

    const event: calendar_v3.Schema$Event = {};
    
    if (updates.summary) event.summary = updates.summary;
    if (updates.description) event.description = updates.description;
    if (updates.location) event.location = updates.location;
    if (updates.startTime) {
      event.start = { dateTime: updates.startTime, timeZone: 'America/Detroit' };
    }
    if (updates.endTime) {
      event.end = { dateTime: updates.endTime, timeZone: 'America/Detroit' };
    }
    if (updates.attendees) {
      event.attendees = updates.attendees.map(a => ({
        email: a.email,
        displayName: a.displayName,
      }));
    }

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: event,
      sendUpdates: 'all',
    });

    console.log('✅ Calendar event updated:', eventId);
    
    return {
      success: true,
      eventId: response.data.id || undefined,
      htmlLink: response.data.htmlLink || undefined,
    };
  } catch (error: any) {
    console.error('❌ Error updating calendar event:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
