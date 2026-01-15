/**
 * Recruitment Portal - Core Data Types
 * All records are cycle-scoped (reference cycleId)
 */

// ============================================================================
// Recruitment Cycles
// ============================================================================
export interface RecruitmentCycle {
  _id?: string;
  slug: string;                    // e.g., "fall-2025"
  name: string;                    // e.g., "Fall 2025 Recruitment"
  isActive: boolean;               // Only one cycle should be active at a time
  portalOpenAt: Date;              // When portal opens
  portalCloseAt: Date;             // When portal closes
  applicationDueAt: Date;          // Application deadline
  settings?: CycleSettings;
  createdAt?: string;
  updatedAt?: string;
}

// Recruitment Connect - confidential contacts for applicant questions
export interface RecruitmentConnect {
  name: string;                    // Full name
  email: string;                   // @umich.edu email
  photo?: string;                  // Photo URL/path
  major: string;                   // Major (e.g., "Economics", "Information")
  roleLastSemester?: string;       // What they did last semester (e.g., "Consulting Analyst")
}

export interface CycleSettings {
  requireResume: boolean;
  requireHeadshot: boolean;
  allowTrackChange: boolean;       // Can applicants change their track after starting?
  googleCalendarId?: string;       // Default calendar for this cycle
  emailFromName?: string;          // Name for outgoing emails
  emailReplyTo?: string;           // Reply-to address
  tracks?: ApplicationTrack[];     // Available tracks for this cycle
  recruitmentConnects?: RecruitmentConnect[]; // Confidential contacts for applicant questions
}

// ============================================================================
// Recruitment Events (RSVP-enabled)
// ============================================================================
export type RecruitmentEventType = 'info_session' | 'social' | 'workshop' | 'panel' | 'deadline' | 'other';

export interface RecruitmentEvent {
  _id?: string;
  cycleId: string;
  title: string;
  description?: string;
  startAt: Date;                   // Event start time
  endAt: Date;                     // Event end time
  location?: string;
  venue?: string;
  eventType?: RecruitmentEventType;
  isRequired?: boolean;
  capacity?: number;
  rsvpCount?: number;
  rsvpEnabled?: boolean;
  rsvpDeadline?: Date;
  checkInEnabled?: boolean;        // Enable check-in with code
  checkInCode?: string;            // Secret code shown at event
  calendarId?: string;
  createdByAdminId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Event RSVPs + Attendance
// ============================================================================
export interface EventRsvp {
  _id?: string;
  cycleId: string;
  eventId: string;
  userId: string;
  applicantName?: string;
  applicantEmail?: string;
  eventTitle?: string;
  rsvpAt: string;
  attendedAt?: string;             // Legacy field
  checkInCode?: string;            // Code they entered
  checkInPhoto?: string;           // URL/path to selfie
  checkedInAt?: string;            // When they checked in
  createdAt?: string;
}

// ============================================================================
// Application Questions (dynamic per cycle/track)
// ============================================================================
export type ApplicationTrack = 'business' | 'engineering' | 'ai_investment_fund' | 'ai_energy_efficiency' | 'both';
export type QuestionFieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'file' | 'url' | 'email' | 'phone' | 'number' | 'date' | 'checkbox';
export type FileKind = 'resume' | 'headshot' | 'other';

export interface QuestionField {
  key: string;                     // Unique identifier within the form
  label: string;
  type: QuestionFieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];              // For select/multiselect
  wordLimit?: number;              // Word limit for text/textarea
  minLength?: number;
  fileKind?: FileKind;             // For file uploads
  accept?: string;                 // File accept attribute (e.g., ".pdf,.doc")
  maxFileSizeMB?: number;
  order: number;                   // Display order
}

export interface ApplicationQuestions {
  _id?: string;
  cycleId: string;
  track: ApplicationTrack;
  fields: QuestionField[];
  updatedAt?: string;
}

// ============================================================================
// Applications (with autosave drafts)
// ============================================================================
export type ApplicationStage = 
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'coffee_chat'
  | 'interview_round1'
  | 'interview_round2'
  | 'final_review'
  | 'waitlisted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  _id?: string;
  cycleId: string;
  userId: string;
  track: ApplicationTrack;
  stage: ApplicationStage;
  answers: Record<string, any>;    // Key-value pairs of question answers (autosaved)
  files: Record<string, string>;   // Key-value pairs of file URLs
  adminNotes?: string;
  submittedAt?: string;
  lastSavedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Slots (Coffee Chats & Interviews)
// ============================================================================
export type SlotKind = 'coffee_chat' | 'interview_round1' | 'interview_round2';

export interface RecruitmentSlot {
  _id?: string;
  cycleId: string;
  kind: SlotKind;
  hostName: string;
  hostEmail: string;
  startTime: string;               // ISO date string
  endTime?: string;                // ISO date string
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  forTrack?: ApplicationTrack;
  maxBookings: number;
  bookedCount: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Alias for backwards compatibility
export type Slot = RecruitmentSlot;

// ============================================================================
// Bookings (who booked what slot)
// ============================================================================
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface SlotBooking {
  _id?: string;
  cycleId: string;
  slotId: string;
  userId: string; // User ID (email or auth ID) - always required
  applicationId?: string; // Optional for coffee chats (user may not have started application)
  slotKind: SlotKind;
  applicantName?: string;
  applicantEmail?: string;
  status: BookingStatus;
  bookedAt: string;
  createdAt?: string;
  updatedAt?: string;
  // Google Calendar event details
  calendarEventId?: string;
  calendarEventLink?: string;
  // Populated slot details (joined from slot when returned)
  slotDetails?: {
    startTime: string;
    endTime?: string;
    durationMinutes: number;
    hostName: string;
    hostEmail?: string;
    location?: string;
    meetingUrl?: string;
  };
}

// Alias for backwards compatibility
export type Booking = SlotBooking;

// ============================================================================
// Review Phases (3-round system)
// ============================================================================

/**
 * The three phases of the recruitment review process:
 * - application: Initial application reading/scoring
 * - interview_round1: Technical interview evaluation
 * - interview_round2: Behavioral interview evaluation
 */
export type ReviewPhase = 'application' | 'interview_round1' | 'interview_round2';

/**
 * Referral/deferral signal for tie-breaking in rankings
 */
export type ReferralSignal = 'referral' | 'neutral' | 'deferral';

// ============================================================================
// Collaborative Reviews (scoring)
// ============================================================================
export type ReviewRecommendation = 'advance' | 'hold' | 'reject';

export interface ApplicationReview {
  _id?: string;
  cycleId: string;
  applicationId: string;
  phase: ReviewPhase;              // Which review phase this belongs to
  track?: ApplicationTrack;        // NEW: Track this review belongs to
  reviewerEmail: string;
  reviewerName?: string;
  scores: Record<string, number>;  // Category -> score (1-5)
  notes?: string;                  // General notes
  questionNotes?: Record<string, string>;  // Per-question notes for interviews (questionKey -> notes)
  recommendation?: ReviewRecommendation;
  referralSignal?: ReferralSignal; // Referral/deferral for tie-breaking
  interviewDetails?: {             // For interview phases, link to the actual interview
    bookingId?: string;
    interviewerNames?: string[];
    interviewerEmails?: string[];
    interviewTime?: string;
    interviewLocation?: string;
    interviewCompleted?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Alias for backwards compatibility
export type Review = ApplicationReview;

// ============================================================================
// Phase Configuration & State
// ============================================================================

/**
 * Phase state for a recruitment cycle
 */
export type PhaseStatus = 'not_started' | 'in_progress' | 'finalized';

export interface PhaseConfig {
  _id?: string;
  cycleId: string;
  phase: ReviewPhase;
  track?: ApplicationTrack;              // NEW: Track-specific phase config (null = all tracks)
  status: PhaseStatus;
  scoringCategories: ScoringCategory[];  // Categories to score for this phase
  minReviewersRequired: number;          // Min reviewers per applicant
  referralWeights?: {                    // Weights for referral signals
    advocate: number;                    // Weight for thumbs up (default 1)
    oppose: number;                      // Weight for thumbs down (default -1)
  };
  useZScoreNormalization?: boolean;      // Normalize scores across reviewers using z-scores
  interviewQuestions?: {                 // Questions for interview phases (round 1 & 2)
    key: string;                         // Unique identifier
    question: string;                    // The question text
  }[];
  finalizedAt?: string;                  // When phase was locked
  finalizedBy?: string;                  // Who locked the phase
  cutoffAppliedAt?: string;              // When cutoff was applied
  cutoffAppliedBy?: string;              // Who applied the cutoff
  cutoffCriteria?: CutoffCriteria;       // How cutoff was determined
  createdAt?: string;
  updatedAt?: string;
}

export interface ScoringCategory {
  key: string;                     // e.g., "technical_skills"
  label: string;                   // e.g., "Technical Skills"
  description?: string;
  minScore: number;                // Usually 1
  maxScore: number;                // Usually 5
  weight: number;                  // Weight for overall score (0-1)
}

export interface CutoffCriteria {
  type: 'top_n' | 'min_score' | 'manual';
  topN?: number;                   // For top_n type
  minScore?: number;               // For min_score type
  includeManualOverrides: boolean;
}

// ============================================================================
// Phase Rankings & Snapshots
// ============================================================================

/**
 * Frozen ranking snapshot when a phase is finalized
 */
export interface PhaseRanking {
  _id?: string;
  cycleId: string;
  phase: ReviewPhase;
  track?: ApplicationTrack;        // NEW: Track-specific ranking
  rankings: RankedApplicant[];
  generatedAt: string;
  finalizedAt?: string;            // When this became the locked ranking
  createdAt?: string;
}

export interface RankedApplicant {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  applicantHeadshot?: string;      // URL to headshot image
  track: ApplicationTrack;
  rank: number;
  averageScore: number;
  weightedScore: number;
  reviewCount: number;
  referralCount: number;           // Strong advocates
  deferralCount: number;           // Strong opposes
  neutralCount: number;
  recommendations: {
    advance: number;
    hold: number;
    reject: number;
  };
  decision?: 'advance' | 'reject' | 'manual_advance' | 'manual_reject';
  decisionReason?: string;         // For manual overrides
  decisionBy?: string;
  decisionAt?: string;
}

// ============================================================================
// Phase Decision Actions
// ============================================================================

export interface PhaseDecisionAction {
  _id?: string;
  cycleId: string;
  phase: ReviewPhase;
  track?: ApplicationTrack;        // NEW: Track this decision belongs to
  applicationId: string;
  action: 'advance' | 'reject' | 'manual_advance' | 'manual_reject';
  reason?: string;
  previousStage: ApplicationStage;
  newStage: ApplicationStage;
  performedBy: string;
  performedAt: string;
  emailSent?: boolean;
  emailSentAt?: string;
}

// ============================================================================
// Email Logs
// ============================================================================
export type EmailStatus = 'pending' | 'sent' | 'failed';

export interface EmailLog {
  _id?: string;
  cycleId: string;
  applicationId?: string;
  recipientEmail: string;
  subject: string;
  templateId?: string;
  status: EmailStatus;
  error?: string;
  sentAt?: string;
  sentBy?: string;
  createdAt?: string;
}

// ============================================================================
// API Response Types
// ============================================================================
export interface PortalDashboard {
  activeCycle: RecruitmentCycle | null;
  application: Application | null;
  upcomingEvents: RecruitmentEvent[];
  myRsvps: EventRsvp[];
  availableSlots: RecruitmentSlot[];
  myBookings: SlotBooking[];
  questions?: ApplicationQuestions[];
  // 3-step tracker data for applicant portal
  roundTracker?: RoundTrackerData;
}

/**
 * Data for the 3-step round tracker on the applicant portal
 */
export interface RoundTrackerData {
  currentRound: 1 | 2 | 3;         // Which of the 3 rounds they're in
  roundName: string;               // "Application Review" | "Technical Interview" | "Behavioral Interview"
  status: 'waiting' | 'invited' | 'scheduled' | 'completed' | 'decision_pending' | 'advanced' | 'not_advanced';
  nextAction: NextActionInfo;
  rounds: RoundStatus[];
}

export interface RoundStatus {
  round: 1 | 2 | 3;
  name: string;
  phase: ReviewPhase;
  status: 'not_started' | 'in_progress' | 'completed' | 'advanced' | 'not_advanced';
  scheduledInterview?: {
    bookingId: string;
    time: string;
    location?: string;
    interviewers?: string[];
  };
}

export interface NextActionInfo {
  type: 'finish_application' | 'wait_for_review' | 'schedule_interview' | 'attend_interview' | 'wait_for_decision' | 'accepted_next_steps' | 'not_advanced';
  title: string;
  description: string;
  actionUrl?: string;              // If they need to click somewhere
  deadline?: string;               // If there's a deadline
}

export interface ApplicantDetail {
  application: Application;
  user?: {
    name?: string;
    email?: string;
  };
  rsvps: EventRsvp[];
  bookings: SlotBooking[];
  reviews: ApplicationReview[];
  reviewsByPhase?: {
    application: ApplicationReview[];
    interview_round1: ApplicationReview[];
    interview_round2: ApplicationReview[];
  };
  reviewSummary?: {
    reviewCount: number;
    avgScore: number;
    scores: Record<string, number>;
  };
  phaseSummaries?: {
    application?: PhaseReviewSummary;
    interview_round1?: PhaseReviewSummary;
    interview_round2?: PhaseReviewSummary;
  };
  interviewInfo?: {
    round1?: InterviewInfo;
    round2?: InterviewInfo;
  };
}

/**
 * Interview details for admin evaluation panel
 */
export interface InterviewInfo {
  booking?: SlotBooking;
  slot?: RecruitmentSlot;
  interviewers: string[];
  time: string;
  location?: string;
  completed: boolean;              // Based on booking status + time passed
}

export interface PhaseReviewSummary {
  phase: ReviewPhase;
  reviewCount: number;
  avgScore: number;
  weightedScore: number;
  scores: Record<string, number>;
  recommendations: {
    advance: number;
    hold: number;
    reject: number;
  };
  referrals: {
    referral: number;
    neutral: number;
    deferral: number;
  };
  reviewers: string[];             // Who has reviewed
  missingReviewers?: string[];     // Who still needs to review (based on config)
}

export interface ReviewSummary {
  reviewCount: number;
  avgScore: number;
  scores: Record<string, number>;
  recommendations: {
    advance: number;
    hold: number;
    reject: number;
  };
}

export interface ApplicantListItem {
  _id: string;
  name: string;
  email: string;
  track: ApplicationTrack;
  stage: ApplicationStage;
  reviewCount: number;
  averageScore?: number;
  eventsAttended: number;
  hasCoffeeChat: boolean;
  hasInterview: boolean;
  submittedAt?: string;
  // Phase-specific data
  phaseScores?: {
    application?: number;
    interview_round1?: number;
    interview_round2?: number;
  };
  phaseReviewCounts?: {
    application?: number;
    interview_round1?: number;
    interview_round2?: number;
  };
  phaseReferrals?: {
    application?: { referral: number; neutral: number; deferral: number };
    interview_round1?: { referral: number; neutral: number; deferral: number };
    interview_round2?: { referral: number; neutral: number; deferral: number };
  };
}

// ============================================================================
// Admin Phase Review API Types
// ============================================================================

/**
 * Request to apply cutoff and advance/reject applicants
 */
export interface ApplyCutoffRequest {
  cycleId: string;
  phase: ReviewPhase;
  cutoffCriteria: CutoffCriteria;
  manualOverrides?: ManualOverride[];
  sendEmails: boolean;
}

export interface ManualOverride {
  applicationId: string;
  action: 'advance' | 'reject';
  reason: string;
}

/**
 * Response from applying cutoff
 */
export interface ApplyCutoffResponse {
  advanced: string[];              // Application IDs advanced
  rejected: string[];              // Application IDs rejected
  emailsSent: number;
  emailsFailed: number;
  errors?: string[];
}

/**
 * Phase completeness data for admin UI
 */
export interface PhaseCompleteness {
  cycleId: string;
  phase: ReviewPhase;
  status: PhaseStatus;
  totalApplicants: number;
  applicantsWithReviews: number;
  applicantsFullyReviewed: number; // Meeting minReviewersRequired
  reviewerCompletion: ReviewerCompletion[];
}

export interface ReviewerCompletion {
  email: string;
  name?: string;
  reviewed: number;
  total: number;
  percentage: number;
}
