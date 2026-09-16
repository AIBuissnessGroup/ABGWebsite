export interface ConferenceSpeaker {
  id: string;
  name: string;
  role: string;
  company: string;
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

  // Visibility / Temporary toggle
  isVisible: boolean;
  updatedAt: number;
}
