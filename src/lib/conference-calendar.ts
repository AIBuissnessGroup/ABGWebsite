/**
 * Generates a Google Calendar URL for the conference (Client & Server safe)
 */
export function getGoogleCalendarUrl(): string {
  const title = encodeURIComponent('Michigan AI Business Conference 2026');
  const details = encodeURIComponent(
    'The Michigan AI Business Conference, hosted by the University of Michigan AI Business Group at the Stephen M. Ross School of Business. Full-day event exploring AI across Finance and Venture Capital.\n\nBring your digital ticket QR pass for check-in!'
  );
  const location = encodeURIComponent('Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109');
  
  // Oct 23, 2026: 10:30 AM arrival to 5:00 PM EDT (EDT is UTC-4 -> 14:30 UTC to 21:00 UTC)
  const startIso = '20261023T143000Z';
  const endIso = '20261023T210000Z';

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}
