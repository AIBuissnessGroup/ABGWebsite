import QRCode from 'qrcode';
import { sendEmail } from './email';
import { ConferenceTicket } from '@/types/conference-ticket';
import { escapeHtml } from './conference-security';
import { getGoogleCalendarUrl } from './conference-calendar';

export { getGoogleCalendarUrl };

/**
 * Sends a conference ticket confirmation email with embedded QR check-in badge
 */
export async function sendConferenceTicketEmail(
  ticket: ConferenceTicket,
  siteUrl: string = process.env.NEXTAUTH_URL || 'https://umichaibusiness.com'
): Promise<boolean> {
  try {
    // Generate high-resolution QR code (Michigan Blue on White)
    const qrDataUrl = await QRCode.toDataURL(ticket.checkInToken, {
      width: 280,
      margin: 2,
      color: {
        dark: '#00274c',
        light: '#ffffff',
      },
    });

    const googleCalendarUrl = getGoogleCalendarUrl();
    const passUrl = `${siteUrl}/conference/success?ticket_id=${encodeURIComponent(ticket.id)}`;

    // SECURITY: HTML escape all user-controlled values to prevent injection in webmail clients
    const safeName = escapeHtml(ticket.attendeeName);
    const safeEmail = escapeHtml(ticket.attendeeEmail);
    const safeTier = escapeHtml(ticket.tier);
    const safeCode = escapeHtml(ticket.ticketCode);
    const safeAmount = escapeHtml(String(ticket.amountPaid));

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Pass: Michigan AI Business Conference 2026</title>
</head>
<body style="margin: 0; padding: 0; background-color: #00172e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #00172e; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #00274c; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF6700 0%, #FF5500 100%); padding: 28px 32px; text-align: center;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.9); margin-bottom: 6px;">
                Official Digital Admission Pass
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                Michigan AI Business Conference 2026
              </h1>
              <div style="margin-top: 6px; font-size: 13px; font-weight: 600; color: #fff3e6;">
                Stephen M. Ross School of Business • Oct 23, 2026
              </div>
            </td>
          </tr>

          <!-- Attendee Greeting & Pass Card -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #ffffff;">
                Hello ${safeName},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.8);">
                You're confirmed for the <strong>Michigan AI Business Conference 2026</strong>! Please save this email or add the pass to your phone. Present the QR code below at check-in for expedited badge pickup.
              </p>

              <!-- Ticket Pass Container -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #001e3b; border-radius: 16px; border: 1px solid rgba(255,103,0,0.4); margin-bottom: 28px; overflow: hidden;">
                <!-- Pass Header -->
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px dashed rgba(255,255,255,0.15);">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #FF6700; font-weight: 800;">
                            Pass Type
                          </div>
                          <div style="font-size: 19px; font-weight: 800; color: #ffffff; margin-top: 2px;">
                            ${safeTier}
                          </div>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; background-color: rgba(255,103,0,0.15); border: 1px solid #FF6700; color: #FF6700; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 800;">
                            CONFIRMED
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- QR Code Body -->
                <tr>
                  <td align="center" style="padding: 28px 24px; background-color: #ffffff; text-align: center;">
                    <img src="${qrDataUrl}" alt="Check-in QR Code" width="200" height="200" style="display: block; margin: 0 auto; border-radius: 8px;" />
                    <div style="margin-top: 14px; font-family: monospace; font-size: 15px; font-weight: 700; color: #00274c; letter-spacing: 2px;">
                      ${safeCode}
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                      Scan at Ross Winter Garden entrance
                    </div>
                  </td>
                </tr>

                <!-- Pass Footer Details -->
                <tr>
                  <td style="padding: 20px 24px; background-color: #001e3b;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: rgba(255,255,255,0.85);">
                      <tr>
                        <td style="padding-bottom: 8px;"><strong>Attendee:</strong> ${safeName}</td>
                        <td style="padding-bottom: 8px;" align="right"><strong>Amount Paid:</strong> $${safeAmount}.00</td>
                      </tr>
                      <tr>
                        <td><strong>Email:</strong> ${safeEmail}</td>
                        <td align="right"><strong>Date:</strong> Fri, Oct 23, 2026</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="padding: 6px;">
                    <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 280px; text-align: center; padding: 14px 20px; background-color: #FF6700; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 6px 16px rgba(255,103,0,0.35);">
                      📅 Add to Google Calendar
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 6px;">
                    <a href="${passUrl}" target="_blank" style="display: inline-block; width: 85%; max-width: 280px; text-align: center; padding: 12px 20px; background-color: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 13px;">
                      🎟️ View Digital Pass Online
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Logistics Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 18px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.85);">
                <tr>
                  <td>
                    <div style="font-weight: 800; color: #FF6700; margin-bottom: 4px;">📍 Event Logistics</div>
                    <div><strong>Location:</strong> Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109</div>
                    <div><strong>Check-in & Breakfast:</strong> 8:30 AM - 9:30 AM EDT (Ross Winter Garden)</div>
                    <div><strong>Opening Keynote:</strong> 9:30 AM EDT</div>
                    <div><strong>Dress Code:</strong> Business Casual</div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: rgba(255,255,255,0.5); text-align: center; margin: 0; line-height: 1.5;">
                If you have questions or need to transfer your registration, reply directly to this email or contact <a href="mailto:contact@umichaibusiness.com" style="color: #FF6700;">contact@umichaibusiness.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #00172e; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: rgba(255,255,255,0.6);">
              © 2026 AI Business Group • University of Michigan<br />
              Stephen M. Ross School of Business • Ann Arbor, MI
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Extract base64 image data for attachment
    const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');

    return await sendEmail({
      to: ticket.attendeeEmail,
      subject: `Your Pass: Michigan AI Business Conference 2026 (${ticket.ticketCode})`,
      html,
      attachments: [
        {
          filename: `michigan-ai-conference-pass-${ticket.ticketCode}.png`,
          content: base64Data,
          encoding: 'base64',
        },
      ],
    });
  } catch (err) {
    console.error('Failed to send conference ticket confirmation email:', err);
    return false;
  }
}
