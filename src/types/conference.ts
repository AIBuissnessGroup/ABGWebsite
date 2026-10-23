export interface ConferenceSpeaker {
  id: string;
  name: string;
  role: string;
  company: string;
  event?: string; // What event/session in the AI business conference they are part of
  photoUrl: string;
  bio?: string;
  linkedinUrl?: string;
  order: number;
}

export interface ConferenceScheduleItem {
  id: string;
  time: string;
  title: string;
  location?: string;
  description?: string;
  speakerIds?: string[];
  order: number;
}

export interface ConferenceSponsor {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  tier: 'Title' | 'Platinum' | 'Gold' | 'Silver' | 'Partner';
  order: number;
}

export interface ConferenceCheckinStaff {
  email: string;
  addedBy?: string;
  addedAt?: number;
}

export interface ConferenceData {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  eventDate: string; // e.g., "Friday, October 23, 2026"
  location: string; // e.g., "Stephen M. Ross School of Business"
  description: string;
  backgroundImageUrl: string;
  
  // Action buttons & redirects
  ticketButtonText: string;
  ticketButtonUrl: string;
  learnMoreButtonText: string;
  learnMoreButtonUrl: string;
  sponsorButtonText: string;
  sponsorButtonUrl: string;

  // Sections
  speakersTitle?: string;
  speakersDescription?: string;
  speakers: ConferenceSpeaker[];

  scheduleTitle?: string;
  scheduleDescription?: string;
  schedule: ConferenceScheduleItem[];

  sponsorsTitle?: string;
  sponsorsDescription?: string;
  sponsors: ConferenceSponsor[];

  // Stage backgrounds: speaker order per lineup session id (speaker names, left to right)
  backgroundSpeakerOrder?: Record<string, string[]>;

  // People (besides admins) allowed to use /conference/checkin on conference day
  checkinStaff?: ConferenceCheckinStaff[];

  // Admins allowed to drive the live stage screens from /conference/control (empty = any admin)
  stageControllers?: ConferenceCheckinStaff[];

  // Visibility / Temporary toggle
  isVisible: boolean;
  updatedAt: number;
}
