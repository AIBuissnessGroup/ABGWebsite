// Enhanced event types based on existing schema with new attendance features

export interface EventPartner {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  type: 'sponsor' | 'partner' | 'media' | 'venue';
  tier?: 'platinum' | 'gold' | 'silver' | 'bronze';
}

export interface EventSpeaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio?: string;
  photo?: string;
  linkedIn?: string;
  twitter?: string;
  website?: string;
  order: number; // for display ordering
}

export interface CustomField {
  id: string;
  type: 'text' | 'select' | 'textarea' | 'email' | 'phone';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: number; // timestamp
  endDate?: number; // timestamp
  location: string;
  venue?: string;
  capacity?: number;
  registrationUrl?: string;
  registrationEnabled: number; // 0 or 1
  registrationCtaLabel: string;
  eventType: 'MEETING' | 'WORKSHOP' | 'NETWORKING' | 'CONFERENCE' | 'SOCIAL' | 'SYMPOSIUM';
  imageUrl?: string;
  featured: number; // 0 or 1
  published: number; // 0 or 1
  parentEventId?: string;
  isMainEvent: number; // 0 or 1
  createdAt: number;
  updatedAt: number;
  createdBy: string;

  // Attendance confirmation fields
  attendanceConfirmEnabled?: number; // 0 or 1
  attendancePassword?: string;
  attendancePasswordHash?: string;
  attendancePasswordSalt?: string;
  requireName?: number; // 0 or 1
  requireMajor?: number; // 0 or 1
  requireGradeLevel?: number; // 0 or 1
  requirePhone?: number; // 0 or 1

  // Event partners and sponsors
  partners?: EventPartner[];

  // Event speakers
  speakers?: EventSpeaker[];

  // Custom registration fields
  customFields?: CustomField[];

  // Sub-events for main events
  subevents?: Event[];

  // Enhanced attendance confirmation system
  attendanceConfirmation?: {
    enabled: boolean;
    requiresPassword: boolean;
    password?: string;
    allowUMichEmailOnly: boolean;
    requiredFields: {
      name: boolean;
      umichEmail: boolean;
      major: boolean;
      gradeLevel: boolean;
      phone: boolean;
    };
    smsReminders: boolean;
  };

  // Waitlist and capacity management
  waitlist?: {
    enabled: boolean;
    maxSize?: number;
    autoPromote: boolean;
    currentSize: number;
  };

  // Event updates
  updates?: {
    enabled: boolean;
    history: EventUpdate[];
  };

  // SEO and slug for individual pages
  slug?: string;
  metaDescription?: string;
}

export interface EventUpdate {
  id: string;
  title: string;
  message: string;
  sentAt: number;
  sentBy: string;
  recipients: 'all' | 'confirmed' | 'waitlist';
  type: 'info' | 'urgent' | 'reminder';
}

export interface EventAttendance {
  id: string;
  eventId: string;
  attendee: {
    name?: string;
    umichEmail: string;
    major?: string;
    gradeLevel?: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate' | 'PhD';
    phone?: string;
  };
  status: 'confirmed' | 'waitlisted' | 'attended' | 'cancelled';
  registeredAt: number;
  confirmedAt?: number;
  attendedAt?: number;
  waitlistPosition?: number;
  source: 'website' | 'admin' | 'import';
  reminders: {
    emailSent: boolean;
    smsSent: boolean;
    lastReminderSent?: number;
  };
  checkInCode?: string; // QR code for event check-in
}

export interface EventAnalytics {
  eventId: string;
  totalRegistrations: number;
  confirmedAttendees: number;
  actualAttendance: number;
  waitlistSize: number;
  cancellationRate: number;
  attendanceRate: number;
  demographicBreakdown: {
    byGrade: Record<string, number>;
    byMajor: Record<string, number>;
  };
  registrationTimeline: Array<{
    date: number;
    count: number;
  }>;
  popularTimes: Array<{
    hour: number;
    registrations: number;
  }>;
}

// Form data interfaces
export interface AttendanceFormData {
  name?: string;
  umichEmail: string;
  major?: string;
  gradeLevel?: string;
  phone?: string;
  password?: string;
}

// API response types
export interface EventWithAttendance extends Event {
  currentAttendees: number;
  userRegistration?: EventAttendance;
  isUserRegistered: boolean;
  isAtCapacity: boolean;
  canJoinWaitlist: boolean;
}

export interface EventListResponse {
  events: Event[];
  pagination: {
    current: number;
    total: number;
    count: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    eventType?: string;
    featured?: boolean;
    upcoming?: boolean;
  };
}