import { readFile } from 'fs/promises';
import path from 'path';
import QRCode from 'qrcode';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ConferenceTicket } from '@/types/conference-ticket';

const NAVY = rgb(0, 39 / 255, 76 / 255);
const DEEP = rgb(0, 23 / 255, 46 / 255);
const MAIZE = rgb(1, 203 / 255, 5 / 255);
const GRAY = rgb(0.42, 0.45, 0.5);
const LIGHT = rgb(0.93, 0.94, 0.96);

/**
 * Builds a one-page Letter-size admission pass PDF for a conference ticket,
 * with the same check-in QR code that is emailed to attendees.
 */
export async function buildConferenceTicketPdf(ticket: ConferenceTicket): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Michigan AI Business Conference Pass - ${ticket.ticketCode}`);
  pdf.setAuthor('AI Business Group');

  const page = pdf.addPage([612, 792]);
  const { width, height } = page.getSize();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  const centered = (text: string, y: number, size: number, font = regular, color = NAVY) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  // Header band
  page.drawRectangle({ x: 0, y: height - 150, width, height: 150, color: NAVY });
  page.drawRectangle({ x: 0, y: height - 156, width, height: 6, color: MAIZE });

  // ABG logo (optional: skipped if the file isn't available on the server)
  try {
    const logoBytes = await readFile(path.join(process.cwd(), 'public', 'conference', 'logos', 'abg.png'));
    const logo = await pdf.embedPng(logoBytes);
    const logoH = 26;
    const logoW = (logo.width / logo.height) * logoH;
    page.drawRectangle({ x: 48, y: height - 66, width: logoW + 16, height: logoH + 12, color: rgb(1, 1, 1) });
    page.drawImage(logo, { x: 56, y: height - 60, width: logoW, height: logoH });
  } catch {
    // Logo is decorative; the pass is still valid without it
  }

  page.drawText('OFFICIAL ADMISSION PASS', { x: 48, y: height - 96, size: 10, font: bold, color: MAIZE });
  page.drawText('Michigan AI Business Conference 2026', { x: 48, y: height - 124, size: 22, font: bold, color: rgb(1, 1, 1) });

  // Attendee
  let y = height - 210;
  page.drawText('ATTENDEE', { x: 48, y, size: 9, font: bold, color: GRAY });
  y -= 28;
  page.drawText(ticket.attendeeName || 'Attendee', { x: 48, y, size: 26, font: bold, color: NAVY });
  y -= 20;
  page.drawText(ticket.attendeeEmail || '', { x: 48, y, size: 11, font: regular, color: GRAY });

  // Pass details row
  y -= 44;
  page.drawRectangle({ x: 48, y: y - 14, width: width - 96, height: 50, color: LIGHT });
  const cols = [
    { label: 'PASS TYPE', value: ticket.tier },
    { label: 'TICKET CODE', value: ticket.ticketCode },
    { label: 'STATUS', value: ticket.status === 'confirmed' ? 'Confirmed' : ticket.status },
  ];
  cols.forEach((c, i) => {
    const x = 64 + i * ((width - 128) / 3);
    page.drawText(c.label, { x, y: y + 18, size: 8, font: bold, color: GRAY });
    page.drawText(String(c.value || ''), { x, y: y, size: 13, font: bold, color: NAVY });
  });

  // QR code
  const qrPng = await QRCode.toBuffer(ticket.checkInToken, {
    width: 600,
    margin: 1,
    color: { dark: '#00274c', light: '#ffffff' },
  });
  const qr = await pdf.embedPng(qrPng);
  const qrSize = 210;
  const qrY = y - 44 - qrSize;
  page.drawRectangle({ x: (width - qrSize) / 2 - 12, y: qrY - 12, width: qrSize + 24, height: qrSize + 24, borderColor: MAIZE, borderWidth: 3 });
  page.drawImage(qr, { x: (width - qrSize) / 2, y: qrY, width: qrSize, height: qrSize });
  centered('Show this QR code at check-in', qrY - 34, 12, bold);
  centered(ticket.ticketCode, qrY - 52, 11, regular, GRAY);

  // Event details footer
  page.drawRectangle({ x: 0, y: 0, width, height: 150, color: DEEP });
  page.drawText('EVENT DETAILS', { x: 48, y: 118, size: 9, font: bold, color: MAIZE });
  const details = [
    'Friday, October 23, 2026',
    'Arrival & registration from 10:30 AM, Stewart Lobby',
    'Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109',
  ];
  details.forEach((line, i) => page.drawText(line, { x: 48, y: 96 - i * 18, size: 11, font: i === 0 ? bold : regular, color: rgb(1, 1, 1) }));
  page.drawText('Questions? ABGContact@umich.edu', { x: 48, y: 28, size: 9, font: regular, color: rgb(0.75, 0.8, 0.86) });

  return pdf.save();
}
