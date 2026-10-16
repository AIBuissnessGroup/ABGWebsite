// Speaker lineup for the Michigan AI Business Conference (Friday, October 23, 2026).
// Drives the session posters on /conference and the lineup popup on the home page.

export type LineupSpeakerRole = 'speaker' | 'moderator' | 'keynote' | 'host';

export interface LineupLogo {
  src?: string; // omitted → a text badge is shown instead
  alt: string;
  text?: string; // shorter text for the badge when there is no image
  dark?: boolean; // white logo that needs a dark badge
}

export interface LineupSpeaker {
  name: string;
  title: string;
  company: string;
  photo: string;
  role: LineupSpeakerRole;
  logo?: LineupLogo;
  photoPosition?: string; // CSS object-position for the portrait crop
}

export type LineupSessionKind = 'panel' | 'keynote' | 'talk' | 'logistics';

export interface LineupSession {
  id: string;
  kind: LineupSessionKind;
  label?: string; // eyebrow chip, e.g. "Panel 1"
  start: string;
  end: string;
  // Headline lines; text wrapped in *asterisks* is shown in maize
  headline: string[];
  room: string;
  description?: string;
  showDescriptionOnCard?: boolean; // show the description on the /conference card
  speakers: LineupSpeaker[];
  concurrentWith?: string; // id of a session running at the same time
}

const PHOTO = '/conference/speakers';
const LOGO = '/conference/logos';

const ABG_LOGO: LineupLogo = { src: `${LOGO}/abg.png`, alt: 'AI Business Group' };

export const CONFERENCE_DATE_LABEL = 'Friday, Oct 23';
export const CONFERENCE_VENUE = 'Ross School of Business';

export const CONFERENCE_LINEUP: LineupSession[] = [
  {
    id: 'arrival',
    kind: 'logistics',
    start: '10:30 AM',
    end: '11:00 AM',
    headline: ['Arrival, registration, coffee cart and red carpet photos'],
    room: 'Stewart Lobby',
    description:
      'Come and get your badge, take a picture on our red carpet, and enjoy coffee from our sponsor Rambler!',
    speakers: [],
  },
  {
    id: 'opening',
    kind: 'talk',
    label: 'Opening remarks',
    start: '11:00 AM',
    end: '11:10 AM',
    headline: ['*Opening* Remarks'],
    room: 'Blau Colloquium',
    description:
      'Opening remarks given by our president, Julia Lotz.',
    speakers: [
      {
        name: 'Julia Lotz',
        title: 'President',
        company: 'AI Business Group',
        photo: `${PHOTO}/julia-lotz.jpg`,
        role: 'host',
      },
    ],
  },
  {
    id: 'banks-and-funds',
    kind: 'panel',
    label: 'Panel 1',
    start: '11:15 AM',
    end: '12:00 PM',
    headline: ["*AI* Inside the *World's*", '*Biggest Banks* and Funds'],
    room: 'Blau Colloquium',
    description:
      'AI is reshaping finance — from trading and risk management to fraud detection and customer experience. Hear from industry experts on where the technology is headed and what it means for the future of the industry.',
    speakers: [
      {
        name: 'Julia Lynn',
        title: 'Vice President, Applied AI/ML Lead',
        company: 'JPMorgan',
        photo: `${PHOTO}/julia-lynn.jpg`,
        role: 'speaker',
        logo: { src: `${LOGO}/jpmorgan.svg`, alt: 'J.P. Morgan' },
      },
      {
        name: 'Nikhil Pajankar',
        title: 'Senior Product Manager, Risk Analytics',
        company: 'Citi',
        photo: `${PHOTO}/nikhil-pajankar.jpg`,
        role: 'speaker',
        logo: { src: `${LOGO}/citi.svg`, alt: 'Citi' },
      },
      {
        name: 'Kaylee Weil',
        title: 'AI Reverse Mentor & Chief People Organization Analyst',
        company: 'Bank of America',
        photo: `${PHOTO}/kaylee-weil.jpg`,
        role: 'speaker',
        logo: { src: `${LOGO}/bofa.svg`, alt: 'Bank of America' },
      },
    ],
  },
  {
    id: 'bitcoin-101',
    kind: 'talk',
    label: 'Lunch & learn',
    start: '12:15 PM',
    end: '1:00 PM',
    headline: ['*Bitcoin 101:* Lunch & Learn'],
    room: 'R2220',
    description:
      'Learn about the value of Bitcoin from Josh Spiewak and how to invest while enjoying a catered lunch.',
    concurrentWith: 'professional-brand',
    speakers: [
      {
        name: 'Josh Spiewak',
        title: 'Managing Partner & COO',
        company: 'NorthStar Advisory Group',
        photo: `${PHOTO}/josh-spiewak.jpg`,
        role: 'speaker',
        logo: { src: `${LOGO}/northstar.png`, alt: 'NorthStar Advisory Group', dark: true },
      },
      {
        name: 'Sloan Spiewak',
        title: 'Portfolio Manager',
        company: 'AI Business Group',
        photo: `${PHOTO}/sloan-spiewak.jpg`,
        role: 'moderator',
        logo: ABG_LOGO,
      },
    ],
  },
  {
    id: 'professional-brand',
    kind: 'talk',
    label: 'Workshop',
    start: '12:15 PM',
    end: '1:00 PM',
    headline: ['Building Your *Professional Brand*'],
    room: 'R2230',
    showDescriptionOnCard: true,
    description:
      'Learn about professional development from incoming full-time analyst at BNY, Jacob Walker. A catered lunch will be served.',
    concurrentWith: 'bitcoin-101',
    speakers: [
      {
        name: 'Jacob Walker',
        title: 'Incoming Full-Time Analyst',
        company: 'BNY',
        photo: `${PHOTO}/jacob-walker.jpg`,
        role: 'host',
        logo: { src: `${LOGO}/bny.png`, alt: 'BNY' },
      },
    ],
  },
  {
    id: 'microsoft-keynote',
    kind: 'keynote',
    label: 'Keynote',
    start: '1:15 PM',
    end: '2:00 PM',
    headline: ['*Engineering the Future:*', "*AI at Microsoft's*", 'Core'],
    room: 'Robertson Auditorium',
    description:
      'A deep dive into AI in the world of technology from Jennifer Marsman, Principal Engineer in AI in the office of the CTO at Microsoft.',
    speakers: [
      {
        name: 'Jennifer Marsman',
        title: 'Principal Engineer in AI',
        company: 'Microsoft',
        photo: `${PHOTO}/jennifer-marsman.jpg`,
        role: 'keynote',
        logo: { src: `${LOGO}/microsoft.svg`, alt: 'Microsoft' },
      },
      {
        name: 'Michael Speigl',
        title: 'Professor',
        company: 'Ross School of Business',
        photo: `${PHOTO}/michael-speigl.jpg`,
        role: 'moderator',
        logo: { src: `${LOGO}/ross.png`, alt: 'Michigan Ross' },
      },
    ],
  },
  {
    id: 'coffee-chats',
    kind: 'logistics',
    start: '2:15 PM',
    end: '3:15 PM',
    headline: ['Kresge coffee chats'],
    room: 'Kresge Interview Suites',
    description:
      'An exclusive opportunity for select attendees to sit down one-on-one with our speakers — a more personal, in-depth conversation beyond what the stage allows.',
    speakers: [],
  },
  {
    id: 'pitch-to-portfolio',
    kind: 'panel',
    label: 'Panel 2',
    start: '3:45 PM',
    end: '4:30 PM',
    headline: ['From *Pitch* to *Portfolio*', 'Building and Funding the *AI Wave*'],
    room: 'Robertson Auditorium',
    description:
      'Explore how venture capital and startup building are evolving alongside AI — from how investors are using AI to source deals and evaluate startups, to how founders are building and scaling the next wave of AI-driven companies. Join industry leaders spanning investing, operating, and entrepreneurship as they discuss where the smart money is headed and what it takes to build something that stands out.',
    speakers: [
      {
        name: 'Lindsey Kilbride',
        title: 'Principal',
        company: 'Detroit Venture Partners',
        photo: `${PHOTO}/lindsey-kilbride.jpg`,
        role: 'speaker',
        logo: { src: `${LOGO}/dvp.png`, alt: 'Detroit Venture Partners' },
      },
      {
        name: 'Doug Neal',
        title: 'Co-Founder & Managing Director',
        company: 'eLab Ventures',
        photo: `${PHOTO}/doug-neal.jpg`,
        role: 'speaker',
        logo: { src: `${LOGO}/elab.svg`, alt: 'eLab Ventures' },
      },
      {
        name: 'Belvin Liles',
        title: 'Principal',
        company: 'ID Ventures',
        photo: `${PHOTO}/belvin-liles.jpg`,
        role: 'speaker',
        logo: { src: `${LOGO}/idventures.png`, alt: 'ID Ventures' },
      },
      {
        name: 'Evan Kramer',
        title: 'CEO',
        company: 'Traliant',
        photo: `${PHOTO}/evan-kramer.jpg`,
        role: 'speaker',
        logo: { src: `${LOGO}/traliant.svg`, alt: 'Traliant' },
      },
      {
        name: 'Anthony Walker',
        title: 'Former President',
        company: 'AI Business Group',
        photo: `${PHOTO}/anthony-walker.jpg`,
        role: 'moderator',
        logo: ABG_LOGO,
      },
    ],
  },
  {
    id: 'closing',
    kind: 'logistics',
    start: '4:30 PM',
    end: '5:00 PM',
    headline: ['Closing and networking'],
    room: 'Robertson Auditorium',
    description:
      'Thank you so much for being part of our inaugural conference! Networking commences in the lobby, and we hope to see you next year.',
    speakers: [],
  },
];

// Sessions that have speakers, in agenda order (used by the home page popup)
export const SPEAKER_SESSIONS = CONFERENCE_LINEUP.filter((s) => s.speakers.length > 0);

// Sessions that rotate through the home page featured event box
const FEATURED_SESSION_IDS = ['banks-and-funds', 'bitcoin-101', 'professional-brand', 'microsoft-keynote', 'pitch-to-portfolio'];
export const FEATURED_SESSIONS = CONFERENCE_LINEUP.filter((s) => FEATURED_SESSION_IDS.includes(s.id));

export const LINEUP_SPEAKER_COUNT = SPEAKER_SESSIONS.reduce((n, s) => n + s.speakers.length, 0);

// Session times are Eastern (EDT, UTC-4) on the conference day
const CONFERENCE_DAY = '2026-10-23';

export function sessionStartTime(session: LineupSession): Date {
  const [, h, m, ampm] = session.start.match(/(\d+):(\d+)\s*(AM|PM)/i) || [];
  let hour = Number(h) % 12;
  if (ampm?.toUpperCase() === 'PM') hour += 12;
  return new Date(`${CONFERENCE_DAY}T${String(hour).padStart(2, '0')}:${m}:00-04:00`);
}

// The session(s) starting next after this one (two when they run concurrently)
export function nextSessionsAfter(session: LineupSession): LineupSession[] {
  const start = sessionStartTime(session).getTime();
  const later = CONFERENCE_LINEUP.filter((s) => sessionStartTime(s).getTime() > start);
  if (later.length === 0) return [];
  const soonest = Math.min(...later.map((s) => sessionStartTime(s).getTime()));
  return later.filter((s) => sessionStartTime(s).getTime() === soonest);
}

// Splits "From *Pitch* to *Portfolio*" into plain and maize segments
export function parseHeadline(line: string): { text: string; maize: boolean }[] {
  return line
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('*') && part.endsWith('*')
        ? { text: part.slice(1, -1), maize: true }
        : { text: part, maize: false }
    );
}
