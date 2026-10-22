import QRCode from 'qrcode';
import { sendEmail } from './email';
import { ConferenceTicket } from '@/types/conference-ticket';
import { escapeHtml } from './conference-security';
import { getGoogleCalendarUrl } from './conference-calendar';
import { CONFERENCE_LINEUP } from './conference-lineup';
import { buildConferenceTicketPdf } from './conference-ticket-pdf';

export { getGoogleCalendarUrl };

// Conference page palette
const NAVY = '#00274c';
const DEEP = '#001e3b';
const DARKEST = '#00172e';
const MAIZE = '#FFCB05';
// Condensed display face like the conference page headlines; Apple Mail loads it, others fall back
const DISPLAY = "'Saira Extra Condensed', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
const BODY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// "From *Pitch* to *Portfolio*" -> HTML with the starred words in maize
function headlineHtml(lines: string[]) {
  return escapeHtml(lines.join(' ')).replace(/\*([^*]+)\*/g, `<span style="color: ${MAIZE};">$1</span>`);
}

function agendaRows() {
  return CONFERENCE_LINEUP.map((s) => {
    const featured = s.speakers.length > 0;
    const speakers = s.speakers.map((sp) => escapeHtml(sp.name)).join(', ');
    return `
      <tr>
        <td valign="top" style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08); width: 84px; font-family: ${DISPLAY}; font-weight: 800; font-size: 17px; color: ${MAIZE}; white-space: nowrap;">
          ${escapeHtml(s.start)}
        </td>
        <td valign="top" style="padding: 12px 0 12px 12px; border-bottom: 1px solid rgba(255,255,255,0.08);">
          ${
            s.label
              ? `<span style="display: inline-block; background-color: ${MAIZE}; color: ${NAVY}; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; margin-bottom: 4px;">${escapeHtml(s.label)}</span><br />`
              : ''
          }
          <span style="font-family: ${DISPLAY}; font-weight: 800; font-size: ${featured ? 19 : 16}px; line-height: 1.1; text-transform: uppercase; color: ${featured ? '#ffffff' : 'rgba(255,255,255,0.85)'};">
            ${featured ? headlineHtml(s.headline) : escapeHtml(s.headline.join(' ').replace(/\*/g, ''))}
          </span>
          <div style="margin-top: 3px; font-size: 12px; color: rgba(255,255,255,0.55);">
            ${escapeHtml(s.room)}${speakers ? ` &middot; ${speakers}` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');
}

/**
 * Builds the confirmation email (HTML + plain text), styled like the conference page
 */
export function buildConferenceTicketEmail(ticket: ConferenceTicket, siteUrl: string): { html: string; text: string } {
  const googleCalendarUrl = getGoogleCalendarUrl();
  const passUrl = `${siteUrl}/conference/success?ticket_id=${encodeURIComponent(ticket.id)}`;
  const conferenceUrl = `${siteUrl}/conference`;
  // Hosted image: Gmail strips inline data: images, so the QR loads from the site
  const qrImageUrl = `${siteUrl}/api/conference/qr?t=${encodeURIComponent(ticket.checkInToken)}`;
  const logoUrl = `${siteUrl}/conference/logos/abg.png`;

  // SECURITY: HTML escape all user-controlled values to prevent injection in webmail clients
  const safeName = escapeHtml(ticket.attendeeName);
  const safeFirstName = escapeHtml((ticket.attendeeName || '').trim().split(/\s+/)[0] || 'there');
  const safeEmail = escapeHtml(ticket.attendeeEmail);
  const safeTier = escapeHtml(ticket.tier);
  const safeCode = escapeHtml(ticket.ticketCode);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Your Pass: Michigan AI Business Conference 2026</title>
  <link href="https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@800&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: ${DARKEST}; font-family: ${BODY}; color: #ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${DARKEST}; padding: 28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${NAVY}; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12);">

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #ffffff; border-radius: 6px; padding: 6px 10px;">
                    <img src="${logoUrl}" alt="AI Business Group" height="24" style="display: block; height: 24px; width: auto;" />
                  </td>
                  <td style="padding-left: 12px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #ffffff; line-height: 1.4;">
                    Michigan AI Business Conference<br />
                    <span style="color: rgba(255,255,255,0.55);">Hosted by AI Business Group</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding: 24px 32px 0 32px;">
              <span style="display: inline-block; background-color: ${MAIZE}; color: ${NAVY}; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 4px 10px; border-radius: 4px;">
                Official Admission Pass
              </span>
              <h1 style="margin: 14px 0 0 0; font-family: ${DISPLAY}; font-weight: 800; font-size: 44px; line-height: 0.95; text-transform: uppercase; color: #ffffff;">
                You&rsquo;re in, <span style="color: ${MAIZE};">${safeFirstName}!</span>
              </h1>
              <div style="width: 64px; height: 4px; background-color: ${MAIZE}; margin: 16px 0;"></div>
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.82);">
                Your pass for the Michigan AI Business Conference is confirmed. Show the QR code below at check-in on Friday. Your pass is also attached as a PDF.
              </p>
            </td>
          </tr>

          <!-- Pass -->
          <tr>
            <td style="padding: 26px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${DEEP}; border-radius: 16px; border: 2px solid ${MAIZE}; overflow: hidden;">
                <tr>
                  <td style="padding: 18px 22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="top">
                          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.5);">Attendee</div>
                          <div style="font-family: ${DISPLAY}; font-weight: 800; font-size: 26px; line-height: 1.05; text-transform: uppercase; color: #ffffff; margin-top: 2px;">${safeName}</div>
                          <div style="font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 2px;">${safeEmail}</div>
                        </td>
                        <td valign="top" align="right">
                          <span style="display: inline-block; background-color: rgba(16,185,129,0.15); border: 1px solid rgba(52,211,153,0.6); color: #6ee7b7; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 1px;">CONFIRMED</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="background-color: #ffffff; padding: 24px;">
                    <img src="${qrImageUrl}" alt="Check-in QR code for ${safeCode}" width="210" height="210" style="display: block; margin: 0 auto; width: 210px; height: 210px;" />
                    <div style="margin-top: 12px; font-family: monospace; font-size: 16px; font-weight: 700; letter-spacing: 3px; color: ${NAVY};">${safeCode}</div>
                    <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">Show this at check-in &middot; Stewart Lobby</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 22px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; color: rgba(255,255,255,0.85);">
                      <tr>
                        <td>
                          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.5);">Pass type</div>
                          <div style="font-weight: 700; margin-top: 2px;">${safeTier}</div>
                        </td>
                        <td align="right">
                          <div style="font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.5);">Date</div>
                          <div style="font-weight: 700; margin-top: 2px;">Friday, Oct 23, 2026</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Buttons -->
          <tr>
            <td align="center" style="padding: 24px 32px 0 32px;">
              <a href="${passUrl}" target="_blank" style="display: block; text-align: center; padding: 14px 20px; background-color: ${MAIZE}; color: ${NAVY}; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px;">
                View your pass online &rarr;
              </a>
              <a href="${googleCalendarUrl}" target="_blank" style="display: block; text-align: center; margin-top: 10px; padding: 12px 20px; border: 1px solid rgba(255,203,5,0.5); background-color: rgba(255,203,5,0.08); color: ${MAIZE}; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px;">
                Add to Google Calendar
              </a>
            </td>
          </tr>

          <!-- Day at a glance -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: ${MAIZE};">The lineup</div>
              <h2 style="margin: 6px 0 4px 0; font-family: ${DISPLAY}; font-weight: 800; font-size: 30px; line-height: 1; text-transform: uppercase; color: #ffffff;">
                Your day at <span style="color: ${MAIZE};">a glance</span>
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 6px;">
                ${agendaRows()}
              </table>
              <div style="margin-top: 14px;">
                <a href="${conferenceUrl}" target="_blank" style="font-size: 13px; font-weight: 700; color: ${MAIZE}; text-decoration: none;">See speakers and session details &rarr;</a>
              </div>
            </td>
          </tr>

          <!-- Logistics -->
          <tr>
            <td style="padding: 28px 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;">
                <tr>
                  <td style="padding: 18px 20px; font-size: 13px; line-height: 1.7; color: rgba(255,255,255,0.85);">
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: ${MAIZE}; margin-bottom: 6px;">Know before you go</div>
                    <div><strong style="color: #ffffff;">Where:</strong> Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109</div>
                    <div><strong style="color: #ffffff;">Arrival:</strong> Registration opens at 10:30 AM in Stewart Lobby</div>
                    <div><strong style="color: #ffffff;">Dress code:</strong> Business casual</div>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.6; color: rgba(255,255,255,0.5); text-align: center;">
                Questions or need to transfer your pass? Reply to this email or contact
                <a href="mailto:ABGContact@umich.edu" style="color: ${MAIZE}; text-decoration: none;">ABGContact@umich.edu</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; background-color: ${DARKEST}; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; font-size: 11px; line-height: 1.6; color: rgba(255,255,255,0.5);">
              &copy; 2026 AI Business Group &middot; University of Michigan<br />
              Stephen M. Ross School of Business &middot; Ann Arbor, MI
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = [
    `You're in, ${ticket.attendeeName}!`,
    '',
    'Your pass for the Michigan AI Business Conference (Friday, October 23, 2026) is confirmed.',
    `Pass type: ${ticket.tier}`,
    `Ticket code: ${ticket.ticketCode}`,
    '',
    `View your pass and QR code: ${passUrl}`,
    'Arrival: registration opens at 10:30 AM in Stewart Lobby, Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor.',
    '',
    'Questions? ABGContact@umich.edu',
  ].join('\n');

  return { html, text };
}

/**
 * Sends a conference ticket confirmation email with the check-in QR code, with the pass attached as a PDF
 */
export async function sendConferenceTicketEmail(
  ticket: ConferenceTicket,
  siteUrl: string = process.env.NEXTAUTH_URL || 'https://abgumich.org'
): Promise<boolean> {
  try {
    const { html, text } = buildConferenceTicketEmail(ticket, siteUrl);

    // QR image (handy to save to a phone) plus the full pass as a PDF
    const qrPng = await QRCode.toBuffer(ticket.checkInToken, { width: 480, margin: 2, color: { dark: '#00274c', light: '#ffffff' } });
    const attachments = [
      { filename: `michigan-ai-conference-pass-${ticket.ticketCode}.png`, content: qrPng.toString('base64'), encoding: 'base64' },
    ];
    try {
      const pdf = await buildConferenceTicketPdf(ticket);
      attachments.push({ filename: `michigan-ai-conference-pass-${ticket.ticketCode}.pdf`, content: Buffer.from(pdf).toString('base64'), encoding: 'base64' });
    } catch (pdfErr) {
      // The email still goes out with the QR if the PDF can't be built
      console.error('Failed to build ticket PDF for email:', pdfErr);
    }

    return await sendEmail({
      to: ticket.attendeeEmail,
      subject: `Your Pass: Michigan AI Business Conference 2026 (${ticket.ticketCode})`,
      html,
      text,
      attachments,
    });
  } catch (err) {
    console.error('Failed to send conference ticket confirmation email:', err);
    return false;
  }
}
