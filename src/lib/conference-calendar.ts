/**
 * Generates a Google Calendar URL for the conference (Client & Server safe)
 */
export function getGoogleCalendarUrl(): string {
  const title = encodeURIComponent('Michigan AI Business Conference 2026');
  const details = encodeURIComponent(
    'The Michigan AI Business Conference, hosted by the University of Michigan AI Business Group at the Stephen M. Ross School of Business. Full-day event exploring AI across Finance, Venture Capital, and Business Strategy.\n\nBring your digital ticket QR pass for check-in!'
  );
  const location = encodeURIComponent('Stephen M. Ross School of Business, 701 Tappan Ave, Ann Arbor, MI 48109');
  
  // Oct 23, 2026: 8:30 AM to 5:30 PM EDT (EDT is UTC-4 -> 12:30 UTC to 21:30 UTC)
  const startIso = '20261023T123000Z';
  const endIso = '20261023T213000Z';

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}
