/**
 * Recruitment Portal - Database Operations
 * All operations connect to MongoDB with TLS
 */

import { MongoClient, ObjectId, WithId, Document, MongoClientOptions } from 'mongodb';
import type {
  RecruitmentCycle,
  RecruitmentEvent,
  EventRsvp,
  ApplicationQuestions,
  Application,
  ApplicationStage,
  ApplicationTrack,
  RecruitmentSlot,
  SlotKind,
  SlotBooking,
  ApplicationReview,
  EmailLog,
  ReviewPhase,
  PhaseConfig,
  PhaseStatus,
  PhaseRanking,
  RankedApplicant,
  PhaseDecisionAction,
  PhaseReviewSummary,
  PhaseCompleteness,
  ReviewerCompletion,
  CutoffCriteria,
  ReferralSignal,
} from '@/types/recruitment';

// ============================================================================
// MongoDB Connection
// ============================================================================

// Check if connection string already has TLS/SSL settings
const connectionString = process.env.DATABASE_URL || '';
const hasTlsInConnectionString = /[?&](tls|ssl)=/.test(connectionString);
const isProduction = process.env.NODE_ENV === 'production';

// MongoDB connection options
// - In production: use the CA certificate file for proper TLS verification
// - In development with SSL in connection string: allow self-signed certs to avoid cert issues
// - Otherwise: only enable TLS in production
const mongoOptions: MongoClientOptions = hasTlsInConnectionString
  ? (isProduction 
      ? { tlsCAFile: '/app/global-bundle.pem' }
      : { tlsAllowInvalidCertificates: true })
  : {
      tls: isProduction,
      tlsCAFile: isProduction ? '/app/global-bundle.pem' : undefined,
    };

async function getClient(): Promise<MongoClient> {
  const client = new MongoClient(process.env.DATABASE_URL!, mongoOptions);
  await client.connect();
  return client;
}

// Exported collection names for direct access
export const COLLECTIONS = {
  CYCLES: 'recruitment_cycles',
  EVENTS: 'recruitment_events',
  RSVPS: 'recruitment_rsvps',
  QUESTIONS: 'recruitment_questions',
  APPLICATIONS: 'recruitment_applications',
  SLOTS: 'recruitment_slots',
  BOOKINGS: 'recruitment_bookings',
  REVIEWS: 'recruitment_reviews',
  EMAIL_LOGS: 'recruitment_email_logs',
  PHASE_CONFIGS: 'recruitment_phase_configs',
  PHASE_RANKINGS: 'recruitment_phase_rankings',
  PHASE_DECISIONS: 'recruitment_phase_decisions',
} as const;

// Helper to convert string to ObjectId
export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

// Helper to run operations with a DB connection
export async function withConnection<T>(fn: (db: ReturnType<MongoClient['db']>) => Promise<T>): Promise<T> {
  const client = await getClient();
  try {
    return await fn(client.db());
  } finally {
    await client.close();
  }
}

export async function getCollection<T extends Document>(name: string) {
  const client = await getClient();
  return client.db().collection<T>(name);
}

// Helper to serialize MongoDB documents (convert ObjectId to string)
function serializeDoc<T>(doc: WithId<Document> | null): T | null {
  if (!doc) return null;
  const serialized = { ...doc } as any;
  if (serialized._id) {
    serialized._id = serialized._id.toString();
  }
  // Convert any ObjectId fields
  Object.keys(serialized).forEach(key => {
    if (serialized[key] instanceof ObjectId) {
      serialized[key] = serialized[key].toString();
    }
  });
  return serialized as T;
}

export function serializeDocs<T>(docs: WithId<Document>[]): T[] {
  return docs.map(doc => serializeDoc<T>(doc)!);
}

// ============================================================================
// Cycles
// ============================================================================

const CYCLES_COLLECTION = 'recruitment_cycles';

export async function getCycles(): Promise<RecruitmentCycle[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(CYCLES_COLLECTION);
    const cycles = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return serializeDocs<RecruitmentCycle>(cycles);
  } finally {
    await client.close();
  }
}

export async function getCycleById(id: string): Promise<RecruitmentCycle | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(CYCLES_COLLECTION);
    const cycle = await collection.findOne({ _id: new ObjectId(id) });
    return serializeDoc<RecruitmentCycle>(cycle);
  } finally {
    await client.close();
  }
}

export async function getActiveCycle(): Promise<RecruitmentCycle | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(CYCLES_COLLECTION);
    const cycle = await collection.findOne({ isActive: true });
    return serializeDoc<RecruitmentCycle>(cycle);
  } finally {
    await client.close();
  }
}

export async function setActiveCycle(id: string): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(CYCLES_COLLECTION);
    // Deactivate all other cycles
    await collection.updateMany(
      { _id: { $ne: new ObjectId(id) } },
      { $set: { isActive: false } }
    );
    // Activate this cycle
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: true, updatedAt: new Date().toISOString() } }
    );
  } finally {
    await client.close();
  }
}

export async function createCycle(data: Omit<RecruitmentCycle, '_id'>): Promise<string> {
  const client = await getClient();
  try {
    const collection = client.db().collection(CYCLES_COLLECTION);
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return result.insertedId.toString();
  } finally {
    await client.close();
  }
}

export async function updateCycle(id: string, data: Partial<RecruitmentCycle>): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(CYCLES_COLLECTION);
    
    // If setting this cycle as active, deactivate others
    if (data.isActive) {
      await collection.updateMany(
        { _id: { $ne: new ObjectId(id) } },
        { $set: { isActive: false } }
      );
    }
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date().toISOString() } }
    );
  } finally {
    await client.close();
  }
}

export async function deleteCycle(id: string): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(CYCLES_COLLECTION);
    await collection.deleteOne({ _id: new ObjectId(id) });
  } finally {
    await client.close();
  }
}

// ============================================================================
// Events
// ============================================================================

const EVENTS_COLLECTION = 'recruitment_events';

export async function getEventsByCycle(cycleId: string): Promise<RecruitmentEvent[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(EVENTS_COLLECTION);
    const events = await collection.find({ cycleId }).sort({ date: 1 }).toArray();
    return serializeDocs<RecruitmentEvent>(events);
  } finally {
    await client.close();
  }
}

export async function getEventById(id: string): Promise<RecruitmentEvent | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(EVENTS_COLLECTION);
    const event = await collection.findOne({ _id: new ObjectId(id) });
    return serializeDoc<RecruitmentEvent>(event);
  } finally {
    await client.close();
  }
}

export async function createEvent(data: Omit<RecruitmentEvent, '_id'>): Promise<string> {
  const client = await getClient();
  try {
    const collection = client.db().collection(EVENTS_COLLECTION);
    const result = await collection.insertOne({
      ...data,
      rsvpCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return result.insertedId.toString();
  } finally {
    await client.close();
  }
}

export async function updateEvent(id: string, data: Partial<RecruitmentEvent>): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(EVENTS_COLLECTION);
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date().toISOString() } }
    );
  } finally {
    await client.close();
  }
}

export async function deleteEvent(id: string): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(EVENTS_COLLECTION);
    await collection.deleteOne({ _id: new ObjectId(id) });
  } finally {
    await client.close();
  }
}

// ============================================================================
// RSVPs
// ============================================================================

const RSVPS_COLLECTION = 'recruitment_rsvps';

export async function getRsvpsByEvent(eventId: string): Promise<EventRsvp[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(RSVPS_COLLECTION);
    const rsvps = await collection.find({ eventId }).toArray();
    return serializeDocs<EventRsvp>(rsvps);
  } finally {
    await client.close();
  }
}

export async function getRsvpsByUser(cycleId: string, userId: string): Promise<EventRsvp[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(RSVPS_COLLECTION);
    const rsvps = await collection.find({ cycleId, userId }).toArray();
    return serializeDocs<EventRsvp>(rsvps);
  } finally {
    await client.close();
  }
}

export async function createRsvp(data: Omit<EventRsvp, '_id'>): Promise<string> {
  const client = await getClient();
  try {
    const collection = client.db().collection(RSVPS_COLLECTION);
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date().toISOString(),
    });
    
    // Increment RSVP count on event
    const eventsCollection = client.db().collection(EVENTS_COLLECTION);
    await eventsCollection.updateOne(
      { _id: new ObjectId(data.eventId) },
      { $inc: { rsvpCount: 1 } }
    );
    
    return result.insertedId.toString();
  } finally {
    await client.close();
  }
}

export async function deleteRsvp(cycleId: string, eventId: string, userId: string): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(RSVPS_COLLECTION);
    const result = await collection.deleteOne({ cycleId, eventId, userId });
    
    if (result.deletedCount > 0) {
      // Decrement RSVP count on event
      const eventsCollection = client.db().collection(EVENTS_COLLECTION);
      await eventsCollection.updateOne(
        { _id: new ObjectId(eventId) },
        { $inc: { rsvpCount: -1 } }
      );
    }
  } finally {
    await client.close();
  }
}

export async function markAttendance(rsvpId: string): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(RSVPS_COLLECTION);
    await collection.updateOne(
      { _id: new ObjectId(rsvpId) },
      { $set: { attendedAt: new Date().toISOString() } }
    );
  } finally {
    await client.close();
  }
}

export async function checkInToEvent(
  eventId: string, 
  userId: string, 
  photoUrl: string
): Promise<{ success: boolean; error?: string }> {
  const client = await getClient();
  try {
    // Get the event to verify check-in is enabled
    const eventsCollection = client.db().collection(EVENTS_COLLECTION);
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      return { success: false, error: 'Event not found' };
    }
    
    if (!event.checkInEnabled) {
      return { success: false, error: 'Check-in is not enabled for this event' };
    }
    
    // Find and update the RSVP with photo
    const rsvpsCollection = client.db().collection(RSVPS_COLLECTION);
    const result = await rsvpsCollection.updateOne(
      { eventId, userId },
      { 
        $set: { 
          checkInPhoto: photoUrl,
          checkedInAt: new Date().toISOString(),
          attendedAt: new Date().toISOString(), // Also set legacy field
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, error: 'You must RSVP before checking in' };
    }
    
    return { success: true };
  } finally {
    await client.close();
  }
}

export async function getRsvpByUserAndEvent(eventId: string, userId: string): Promise<EventRsvp | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(RSVPS_COLLECTION);
    const rsvp = await collection.findOne({ eventId, userId });
    return serializeDoc<EventRsvp>(rsvp);
  } finally {
    await client.close();
  }
}

// ============================================================================
// Questions
// ============================================================================

const QUESTIONS_COLLECTION = 'recruitment_questions';

export async function getQuestionsByCycle(cycleId: string): Promise<ApplicationQuestions[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(QUESTIONS_COLLECTION);
    const questions = await collection.find({ cycleId }).toArray();
    return serializeDocs<ApplicationQuestions>(questions);
  } finally {
    await client.close();
  }
}

export async function upsertQuestions(data: Omit<ApplicationQuestions, '_id'>): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(QUESTIONS_COLLECTION);
    await collection.updateOne(
      { cycleId: data.cycleId, track: data.track },
      { 
        $set: { 
          ...data, 
          updatedAt: new Date().toISOString() 
        } 
      },
      { upsert: true }
    );
  } finally {
    await client.close();
  }
}

// ============================================================================
// Applications
// ============================================================================

const APPLICATIONS_COLLECTION = 'recruitment_applications';

export async function getApplicationsByCycle(
  cycleId: string, 
  filters?: { stage?: ApplicationStage | ApplicationStage[]; track?: string }
): Promise<Application[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(APPLICATIONS_COLLECTION);
    const query: any = { cycleId };
    
    // Support single stage or array of stages
    if (filters?.stage) {
      if (Array.isArray(filters.stage)) {
        query.stage = { $in: filters.stage };
      } else {
        query.stage = filters.stage;
      }
    }
    if (filters?.track) query.track = filters.track;
    
    const applications = await collection.find(query).sort({ createdAt: -1 }).toArray();
    return serializeDocs<Application>(applications);
  } finally {
    await client.close();
  }
}

export async function getApplicationById(id: string): Promise<Application | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(APPLICATIONS_COLLECTION);
    const application = await collection.findOne({ _id: new ObjectId(id) });
    return serializeDoc<Application>(application);
  } finally {
    await client.close();
  }
}

export async function getApplicationByUser(cycleId: string, userId: string): Promise<Application | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(APPLICATIONS_COLLECTION);
    const application = await collection.findOne({ cycleId, userId });
    return serializeDoc<Application>(application);
  } finally {
    await client.close();
  }
}

export async function saveApplicationDraft(data: {
  cycleId: string;
  userId: string;
  track: string;
  answers: Record<string, any>;
  files?: Record<string, string>;
}): Promise<string> {
  const client = await getClient();
  try {
    const collection = client.db().collection(APPLICATIONS_COLLECTION);
    const existing = await collection.findOne({ cycleId: data.cycleId, userId: data.userId });
    
    // Build update object, only including files if provided
    const updateFields: Record<string, any> = {
      track: data.track,
      answers: data.answers,
      lastSavedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Only update files if explicitly provided (not undefined)
    if (data.files !== undefined) {
      updateFields.files = data.files;
    }
    
    console.log('💾 Saving application draft:', {
      cycleId: data.cycleId,
      userId: data.userId,
      hasFiles: data.files !== undefined,
      fileKeys: data.files ? Object.keys(data.files) : [],
    });
    
    if (existing) {
      await collection.updateOne(
        { _id: existing._id },
        { $set: updateFields }
      );
      return existing._id.toString();
    } else {
      const result = await collection.insertOne({
        ...data,
        files: data.files || {},
        stage: 'draft',
        lastSavedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return result.insertedId.toString();
    }
  } finally {
    await client.close();
  }
}

export async function submitApplication(cycleId: string, userId: string): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(APPLICATIONS_COLLECTION);
    await collection.updateOne(
      { cycleId, userId },
      { 
        $set: { 
          stage: 'submitted',
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } 
      }
    );
  } finally {
    await client.close();
  }
}

export async function updateApplicationStage(id: string, stage: ApplicationStage): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(APPLICATIONS_COLLECTION);
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { stage, updatedAt: new Date().toISOString() } }
    );
  } finally {
    await client.close();
  }
}

export async function deleteApplication(id: string): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(APPLICATIONS_COLLECTION);
    await collection.deleteOne({ _id: new ObjectId(id) });
  } finally {
    await client.close();
  }
}

export async function updateApplicationNotes(id: string, notes: string): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(APPLICATIONS_COLLECTION);
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { adminNotes: notes, updatedAt: new Date().toISOString() } }
    );
  } finally {
    await client.close();
  }
}

export async function updateApplicationFiles(id: string, files: Record<string, string>): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(APPLICATIONS_COLLECTION);
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { files, updatedAt: new Date().toISOString() } }
    );
  } finally {
    await client.close();
  }
}

// ============================================================================
// Slots
// ============================================================================

const SLOTS_COLLECTION = 'recruitment_slots';

export async function getSlotsByCycle(
  cycleId: string, 
  filters?: { kind?: SlotKind }
): Promise<RecruitmentSlot[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(SLOTS_COLLECTION);
    const query: any = { cycleId };
    if (filters?.kind) query.kind = filters.kind;
    
    const slots = await collection.find(query).sort({ startTime: 1 }).toArray();
    return serializeDocs<RecruitmentSlot>(slots);
  } finally {
    await client.close();
  }
}

export async function getSlotById(id: string): Promise<RecruitmentSlot | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(SLOTS_COLLECTION);
    const slot = await collection.findOne({ _id: new ObjectId(id) });
    return serializeDoc<RecruitmentSlot>(slot);
  } finally {
    await client.close();
  }
}

export async function getAvailableSlots(cycleId: string, kind: SlotKind, track?: string): Promise<RecruitmentSlot[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(SLOTS_COLLECTION);
    
    // Build query - filter by kind and availability
    const query: any = {
      cycleId,
      kind,
      startTime: { $gt: new Date().toISOString() },
      $expr: { $lt: ['$bookedCount', '$maxBookings'] },
    };
    
    // If track is specified, only return slots for that track or slots with no track restriction
    if (track) {
      query.$or = [
        { forTrack: track },
        { forTrack: { $exists: false } },
        { forTrack: null },
        { forTrack: '' },
      ];
    }
    
    const slots = await collection.find(query).sort({ startTime: 1 }).toArray();
    return serializeDocs<RecruitmentSlot>(slots);
  } finally {
    await client.close();
  }
}

export async function createSlot(data: Omit<RecruitmentSlot, '_id'>): Promise<string> {
  const client = await getClient();
  try {
    const collection = client.db().collection(SLOTS_COLLECTION);
    const result = await collection.insertOne({
      ...data,
      bookedCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return result.insertedId.toString();
  } finally {
    await client.close();
  }
}

export async function updateSlot(id: string, data: Partial<RecruitmentSlot>): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(SLOTS_COLLECTION);
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...data, updatedAt: new Date().toISOString() } }
    );
  } finally {
    await client.close();
  }
}

export async function deleteSlot(id: string): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(SLOTS_COLLECTION);
    await collection.deleteOne({ _id: new ObjectId(id) });
  } finally {
    await client.close();
  }
}

// ============================================================================
// Bookings
// ============================================================================

const BOOKINGS_COLLECTION = 'recruitment_bookings';

export async function getBookingsBySlot(slotId: string): Promise<SlotBooking[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(BOOKINGS_COLLECTION);
    const bookings = await collection.find({ slotId }).toArray();
    return serializeDocs<SlotBooking>(bookings);
  } finally {
    await client.close();
  }
}

export async function getBookingsByUser(cycleId: string, userId: string): Promise<SlotBooking[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(BOOKINGS_COLLECTION);
    
    // Query by userId directly (for coffee chats) or by applicantEmail as fallback
    const bookings = await collection.find({ 
      cycleId,
      $or: [
        { userId },
        { applicantEmail: userId }, // Fallback for older bookings
      ]
    }).toArray();
    return serializeDocs<SlotBooking>(bookings);
  } finally {
    await client.close();
  }
}

export async function createBooking(data: Omit<SlotBooking, '_id'>): Promise<string> {
  const client = await getClient();
  try {
    const collection = client.db().collection(BOOKINGS_COLLECTION);
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Increment booked count on slot
    const slotsCollection = client.db().collection(SLOTS_COLLECTION);
    await slotsCollection.updateOne(
      { _id: new ObjectId(data.slotId) },
      { $inc: { bookedCount: 1 } }
    );
    
    return result.insertedId.toString();
  } finally {
    await client.close();
  }
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(BOOKINGS_COLLECTION);
    const booking = await collection.findOne({ _id: new ObjectId(bookingId) });
    
    if (booking && booking.status !== 'cancelled') {
      await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: { status: 'cancelled', updatedAt: new Date().toISOString() } }
      );
      
      // Decrement booked count on slot
      const slotsCollection = client.db().collection(SLOTS_COLLECTION);
      await slotsCollection.updateOne(
        { _id: new ObjectId(booking.slotId) },
        { $inc: { bookedCount: -1 } }
      );
    }
  } finally {
    await client.close();
  }
}

export async function getBookingsByApplication(applicationId: string): Promise<SlotBooking[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(BOOKINGS_COLLECTION);
    const bookings = await collection.find({ applicationId }).toArray();
    return serializeDocs<SlotBooking>(bookings);
  } finally {
    await client.close();
  }
}

export async function getBookingById(bookingId: string): Promise<SlotBooking | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(BOOKINGS_COLLECTION);
    const booking = await collection.findOne({ _id: new ObjectId(bookingId) });
    return booking ? serializeDoc<SlotBooking>(booking) : null;
  } finally {
    await client.close();
  }
}

export async function updateBooking(bookingId: string, updates: Partial<SlotBooking>): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(BOOKINGS_COLLECTION);
    await collection.updateOne(
      { _id: new ObjectId(bookingId) },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date().toISOString() 
        } 
      }
    );
  } finally {
    await client.close();
  }
}

// ============================================================================
// Reviews
// ============================================================================

const REVIEWS_COLLECTION = 'recruitment_reviews';

export async function getReviewsByApplication(applicationId: string): Promise<ApplicationReview[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(REVIEWS_COLLECTION);
    const reviews = await collection.find({ applicationId }).toArray();
    return serializeDocs<ApplicationReview>(reviews);
  } finally {
    await client.close();
  }
}

export async function upsertReview(data: Omit<ApplicationReview, '_id'>): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(REVIEWS_COLLECTION);
    await collection.updateOne(
      { applicationId: data.applicationId, reviewerEmail: data.reviewerEmail },
      { 
        $set: { 
          ...data, 
          updatedAt: new Date().toISOString() 
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        }
      },
      { upsert: true }
    );
  } finally {
    await client.close();
  }
}

export async function getReviewSummary(applicationId: string): Promise<{
  reviewCount: number;
  avgScore: number;
  scores: Record<string, number>;
} | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(REVIEWS_COLLECTION);
    const reviews = await collection.find({ applicationId }).toArray();
    
    if (reviews.length === 0) return null;
    
    const avgScores: Record<string, number[]> = {};
    
    reviews.forEach(review => {
      Object.entries(review.scores || {}).forEach(([key, value]) => {
        if (!avgScores[key]) avgScores[key] = [];
        avgScores[key].push(value as number);
      });
    });
    
    const scores: Record<string, number> = {};
    Object.entries(avgScores).forEach(([key, values]) => {
      scores[key] = values.reduce((a, b) => a + b, 0) / values.length;
    });
    
    const overallScores = reviews
      .map(r => r.scores?.overall)
      .filter(Boolean) as number[];
    
    return {
      reviewCount: reviews.length,
      avgScore: overallScores.length > 0 
        ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length 
        : 0,
      scores,
    };
  } finally {
    await client.close();
  }
}

// ============================================================================
// Email Logs
// ============================================================================

const EMAIL_LOGS_COLLECTION = 'recruitment_email_logs';

export async function logEmailSent(data: Omit<EmailLog, '_id'>): Promise<string> {
  const client = await getClient();
  try {
    const collection = client.db().collection(EMAIL_LOGS_COLLECTION);
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date().toISOString(),
    });
    return result.insertedId.toString();
  } finally {
    await client.close();
  }
}

export async function getEmailLogsByCycle(cycleId: string): Promise<EmailLog[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(EMAIL_LOGS_COLLECTION);
    const logs = await collection.find({ cycleId }).sort({ createdAt: -1 }).toArray();
    return serializeDocs<EmailLog>(logs);
  } finally {
    await client.close();
  }
}

export async function getEmailLogsByApplication(applicationId: string): Promise<EmailLog[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(EMAIL_LOGS_COLLECTION);
    const logs = await collection.find({ applicationId }).sort({ createdAt: -1 }).toArray();
    return serializeDocs<EmailLog>(logs);
  } finally {
    await client.close();
  }
}

// ============================================================================
// Phase Configuration
// ============================================================================

const PHASE_CONFIGS_COLLECTION = 'recruitment_phase_configs';

export async function getPhaseConfig(
  cycleId: string, 
  phase: ReviewPhase, 
  track?: ApplicationTrack
): Promise<PhaseConfig | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(PHASE_CONFIGS_COLLECTION);
    const query: any = { cycleId, phase };
    if (track) query.track = track;
    const config = await collection.findOne(query);
    return serializeDoc<PhaseConfig>(config);
  } finally {
    await client.close();
  }
}

export async function getPhaseConfigsByCycle(
  cycleId: string, 
  track?: ApplicationTrack
): Promise<PhaseConfig[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(PHASE_CONFIGS_COLLECTION);
    const query: any = { cycleId };
    if (track) query.track = track;
    const configs = await collection.find(query).toArray();
    return serializeDocs<PhaseConfig>(configs);
  } finally {
    await client.close();
  }
}

export async function upsertPhaseConfig(data: Omit<PhaseConfig, '_id'>): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(PHASE_CONFIGS_COLLECTION);
    // Include track in unique key for track-specific configs
    const query: any = { cycleId: data.cycleId, phase: data.phase };
    if (data.track) query.track = data.track;
    await collection.updateOne(
      query,
      { 
        $set: { 
          ...data, 
          updatedAt: new Date().toISOString() 
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        }
      },
      { upsert: true }
    );
  } finally {
    await client.close();
  }
}

export async function finalizePhase(
  cycleId: string, 
  phase: ReviewPhase, 
  adminEmail: string,
  track?: ApplicationTrack
): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(PHASE_CONFIGS_COLLECTION);
    const query: any = { cycleId, phase };
    if (track) query.track = track;
    await collection.updateOne(
      query,
      { 
        $set: { 
          status: 'finalized' as PhaseStatus,
          finalizedAt: new Date().toISOString(),
          finalizedBy: adminEmail,
          updatedAt: new Date().toISOString(),
        }
      }
    );
  } finally {
    await client.close();
  }
}

// Unlock a finalized phase (allows re-reviewing)
export async function unlockPhase(
  cycleId: string, 
  phase: ReviewPhase, 
  adminEmail: string,
  track?: ApplicationTrack
): Promise<void> {
  const client = await getClient();
  try {
    const collection = client.db().collection(PHASE_CONFIGS_COLLECTION);
    const query: any = { cycleId, phase };
    if (track) query.track = track;
    await collection.updateOne(
      query,
      { 
        $set: { 
          status: 'in_progress' as PhaseStatus,
          updatedAt: new Date().toISOString(),
        },
        $unset: {
          finalizedAt: '',
          finalizedBy: '',
          cutoffAppliedAt: '',
          cutoffAppliedBy: '',
          cutoffCriteria: '',
        }
      }
    );
  } finally {
    await client.close();
  }
}

// Revert phase - move applicants back to previous stage
export async function revertPhase(
  cycleId: string,
  phase: ReviewPhase,
  adminEmail: string,
  track?: ApplicationTrack
): Promise<{ reverted: number }> {
  const client = await getClient();
  try {
    const applicationsCollection = client.db().collection(APPLICATIONS_COLLECTION);
    const decisionsCollection = client.db().collection(PHASE_DECISIONS_COLLECTION);
    
    // Determine which stages to revert from and to
    const revertMapping: Record<ReviewPhase, { from: ApplicationStage[]; to: ApplicationStage }> = {
      application: { from: ['interview_round1', 'rejected'], to: 'under_review' },
      interview_round1: { from: ['interview_round2', 'rejected'], to: 'interview_round1' },
      interview_round2: { from: ['accepted', 'rejected'], to: 'interview_round2' },
    };
    
    const mapping = revertMapping[phase];
    
    // Find all applications that were moved by this phase's cutoff
    // We look at the decisions collection to find what was changed
    const decisionQuery: any = { cycleId, phase };
    if (track) decisionQuery.track = track;
    const decisions = await decisionsCollection.find(decisionQuery).toArray();
    
    let revertedCount = 0;
    
    for (const decision of decisions) {
      const app = await applicationsCollection.findOne({ _id: new ObjectId(decision.applicationId) });
      if (app && mapping.from.includes(app.stage as ApplicationStage)) {
        await applicationsCollection.updateOne(
          { _id: new ObjectId(decision.applicationId) },
          { 
            $set: { 
              stage: mapping.to,
              updatedAt: new Date().toISOString(),
            }
          }
        );
        revertedCount++;
      }
    }
    
    // Delete the decisions for this phase
    await decisionsCollection.deleteMany({ cycleId, phase });
    
    // Also delete the phase ranking
    await client.db().collection(PHASE_RANKINGS_COLLECTION).deleteMany({ cycleId, phase });
    
    return { reverted: revertedCount };
  } finally {
    await client.close();
  }
}

// Initialize default phase configs for a cycle
export async function initializePhaseConfigs(cycleId: string): Promise<void> {
  const phases: ReviewPhase[] = ['application', 'interview_round1', 'interview_round2'];
  
  const defaultConfigs: Record<ReviewPhase, Partial<PhaseConfig>> = {
    application: {
      scoringCategories: [
        { key: 'overall', label: 'Overall Impression', minScore: 1, maxScore: 5, weight: 0.3 },
        { key: 'experience', label: 'Relevant Experience', minScore: 1, maxScore: 5, weight: 0.25 },
        { key: 'motivation', label: 'Motivation & Fit', minScore: 1, maxScore: 5, weight: 0.25 },
        { key: 'communication', label: 'Written Communication', minScore: 1, maxScore: 5, weight: 0.2 },
      ],
      minReviewersRequired: 2,
    },
    interview_round1: {
      scoringCategories: [
        { key: 'overall', label: 'Overall Impression', minScore: 1, maxScore: 5, weight: 0.25 },
        { key: 'technical', label: 'Technical Knowledge', minScore: 1, maxScore: 5, weight: 0.3 },
        { key: 'problem_solving', label: 'Problem Solving', minScore: 1, maxScore: 5, weight: 0.25 },
        { key: 'communication', label: 'Communication', minScore: 1, maxScore: 5, weight: 0.2 },
      ],
      minReviewersRequired: 2,
    },
    interview_round2: {
      scoringCategories: [
        { key: 'overall', label: 'Overall Impression', minScore: 1, maxScore: 5, weight: 0.2 },
        { key: 'cultural_fit', label: 'Cultural Fit', minScore: 1, maxScore: 5, weight: 0.25 },
        { key: 'leadership', label: 'Leadership Potential', minScore: 1, maxScore: 5, weight: 0.2 },
        { key: 'teamwork', label: 'Teamwork & Collaboration', minScore: 1, maxScore: 5, weight: 0.2 },
        { key: 'motivation', label: 'Motivation & Commitment', minScore: 1, maxScore: 5, weight: 0.15 },
      ],
      minReviewersRequired: 2,
    },
  };

  const client = await getClient();
  try {
    const collection = client.db().collection(PHASE_CONFIGS_COLLECTION);
    
    for (const phase of phases) {
      const existing = await collection.findOne({ cycleId, phase });
      if (!existing) {
        await collection.insertOne({
          cycleId,
          phase,
          status: 'not_started' as PhaseStatus,
          ...defaultConfigs[phase],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } finally {
    await client.close();
  }
}

// ============================================================================
// Phase-Scoped Reviews
// ============================================================================

export async function getReviewsByPhase(
  applicationId: string, 
  phase: ReviewPhase
): Promise<ApplicationReview[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(REVIEWS_COLLECTION);
    const reviews = await collection.find({ applicationId, phase }).toArray();
    return serializeDocs<ApplicationReview>(reviews);
  } finally {
    await client.close();
  }
}

export async function getReviewsByPhaseAndCycle(
  cycleId: string, 
  phase: ReviewPhase
): Promise<ApplicationReview[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(REVIEWS_COLLECTION);
    const reviews = await collection.find({ cycleId, phase }).toArray();
    return serializeDocs<ApplicationReview>(reviews);
  } finally {
    await client.close();
  }
}

export async function upsertPhaseReview(data: Omit<ApplicationReview, '_id'>): Promise<string> {
  const client = await getClient();
  try {
    const collection = client.db().collection(REVIEWS_COLLECTION);
    
    // Check if phase is finalized
    const phaseConfig = await client.db().collection(PHASE_CONFIGS_COLLECTION).findOne({
      cycleId: data.cycleId,
      phase: data.phase,
    });
    
    if (phaseConfig?.status === 'finalized') {
      throw new Error('Cannot modify reviews for a finalized phase');
    }
    
    const result = await collection.updateOne(
      { 
        applicationId: data.applicationId, 
        reviewerEmail: data.reviewerEmail,
        phase: data.phase,
      },
      { 
        $set: { 
          ...data, 
          updatedAt: new Date().toISOString() 
        },
        $setOnInsert: {
          createdAt: new Date().toISOString(),
        }
      },
      { upsert: true }
    );
    
    return result.upsertedId?.toString() || '';
  } finally {
    await client.close();
  }
}

export async function getPhaseReviewSummary(
  applicationId: string,
  phase: ReviewPhase
): Promise<PhaseReviewSummary | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(REVIEWS_COLLECTION);
    const reviews = await collection.find({ applicationId, phase }).toArray();
    
    if (reviews.length === 0) return null;
    
    // Calculate average scores per category
    const avgScores: Record<string, number[]> = {};
    const recommendations = { advance: 0, hold: 0, reject: 0 };
    const referrals = { referral: 0, neutral: 0, deferral: 0 };
    const reviewers: string[] = [];
    
    reviews.forEach(review => {
      reviewers.push(review.reviewerEmail);
      
      // Aggregate scores
      Object.entries(review.scores || {}).forEach(([key, value]) => {
        if (!avgScores[key]) avgScores[key] = [];
        avgScores[key].push(value as number);
      });
      
      // Count recommendations
      if (review.recommendation) {
        recommendations[review.recommendation as keyof typeof recommendations]++;
      }
      
      // Count referral signals
      const signal = (review.referralSignal || 'neutral') as keyof typeof referrals;
      referrals[signal]++;
    });
    
    // Calculate averages
    const scores: Record<string, number> = {};
    Object.entries(avgScores).forEach(([key, values]) => {
      scores[key] = values.reduce((a, b) => a + b, 0) / values.length;
    });
    
    // Calculate overall average
    const overallScores = reviews
      .map(r => r.scores?.overall)
      .filter(Boolean) as number[];
    const avgScore = overallScores.length > 0 
      ? overallScores.reduce((a, b) => a + b, 0) / overallScores.length 
      : 0;
    
    // Calculate weighted score (if we have config)
    const phaseConfigCollection = client.db().collection(PHASE_CONFIGS_COLLECTION);
    const config = await phaseConfigCollection.findOne({ 
      cycleId: reviews[0]?.cycleId, 
      phase 
    });
    
    let weightedScore = avgScore;
    if (config?.scoringCategories) {
      let totalWeight = 0;
      let weightedSum = 0;
      config.scoringCategories.forEach((cat: any) => {
        if (scores[cat.key] !== undefined) {
          weightedSum += scores[cat.key] * cat.weight;
          totalWeight += cat.weight;
        }
      });
      if (totalWeight > 0) {
        weightedScore = weightedSum / totalWeight;
      }
    }
    
    return {
      phase,
      reviewCount: reviews.length,
      avgScore,
      weightedScore,
      scores,
      recommendations,
      referrals,
      reviewers,
    };
  } finally {
    await client.close();
  }
}

// ============================================================================
// Phase Rankings
// ============================================================================

const PHASE_RANKINGS_COLLECTION = 'recruitment_phase_rankings';

export async function generatePhaseRanking(
  cycleId: string,
  phase: ReviewPhase,
  track?: ApplicationTrack
): Promise<PhaseRanking> {
  const client = await getClient();
  try {
    // Get all submitted applications for this cycle
    const applicationsCollection = client.db().collection(APPLICATIONS_COLLECTION);
    const reviewsCollection = client.db().collection(REVIEWS_COLLECTION);
    const phaseConfigCollection = client.db().collection(PHASE_CONFIGS_COLLECTION);
    const usersCollection = client.db().collection('users');
    const accountsCollection = client.db().collection('accounts');
    const bookingsCollection = client.db().collection(BOOKINGS_COLLECTION);
    
    // Determine which stages are eligible for this phase
    const eligibleStages: ApplicationStage[] = (() => {
      switch (phase) {
        case 'application':
          return ['submitted', 'under_review'];
        case 'interview_round1':
          return ['interview_round1'];
        case 'interview_round2':
          return ['interview_round2'];
        default:
          return [];
      }
    })();
    
    // Build filter with optional track filtering
    const applicationFilter: Record<string, unknown> = {
      cycleId,
      stage: { $in: eligibleStages },
    };
    if (track) {
      // Match specific track or 'both'
      applicationFilter.$or = [{ track }, { track: 'both' }];
    }
    
    const applications = await applicationsCollection.find(applicationFilter).toArray();
    
    // Get phase config for weighted scoring (with optional track)
    const configFilter: Record<string, unknown> = { cycleId, phase };
    if (track) {
      configFilter.track = track;
    }
    const config = await phaseConfigCollection.findOne(configFilter) 
      || await phaseConfigCollection.findOne({ cycleId, phase }); // Fallback to non-track-specific
    
    // Helper function to get user info (same logic as applications API)
    const getUserInfo = async (app: any): Promise<{ name: string; email: string; headshot?: string }> => {
      let userName = 'Unknown';
      let userEmail = 'unknown@umich.edu';
      let userHeadshot: string | undefined;
      
      // Strategy 1: Check bookings for this application
      const booking = await bookingsCollection.findOne({ 
        applicationId: app._id.toString(),
        applicantEmail: { $exists: true }
      });
      if (booking?.applicantEmail) {
        userEmail = booking.applicantEmail;
        userName = booking.applicantName || userEmail.split('@')[0];
      }
      
      // Strategy 2: Look up user by Google sub ID
      if (userEmail === 'unknown@umich.edu') {
        let userDoc = null;
        
        // First try: check if userId looks like an email
        if (app.userId?.includes('@')) {
          userDoc = await usersCollection.findOne({ email: app.userId });
        }
        
        // Second try: search through accounts collection
        if (!userDoc) {
          const account = await accountsCollection.findOne({ providerAccountId: app.userId });
          if (account?.userId) {
            try {
              userDoc = await usersCollection.findOne({ _id: new ObjectId(account.userId) });
            } catch {
              userDoc = await usersCollection.findOne({ _id: account.userId });
            }
          }
        }
        
        if (userDoc) {
          userName = userDoc.name || userDoc.email?.split('@')[0] || 'Unknown';
          userEmail = userDoc.email || 'unknown@umich.edu';
        }
      }
      
      // Strategy 3: Fallback to answers
      if (userEmail === 'unknown@umich.edu') {
        userName = (app.answers?.name as string) || 
                   (app.answers?.fullName as string) ||
                   (app.answers?.full_name as string) ||
                   (app.answers?.applicant_name as string) ||
                   (app.answers?.first_name as string) ||
                   'Unknown';
        userEmail = (app.answers?.email as string) || 
                    (app.answers?.applicant_email as string) ||
                    'unknown@umich.edu';
      }
      
      // Get headshot from files - try multiple strategies
      // Strategy 1: Look for exact field names
      userHeadshot = app.files?.headshot || app.files?.photo || app.files?.profile_photo;
      
      // Strategy 2: Search for keys containing headshot/photo/picture
      if (!userHeadshot && app.files) {
        const fileKeys = Object.keys(app.files);
        const headshotKey = fileKeys.find(k => 
          k.toLowerCase().includes('headshot') || 
          k.toLowerCase().includes('photo') || 
          k.toLowerCase().includes('picture') ||
          k.toLowerCase().includes('profile')
        );
        if (headshotKey) {
          userHeadshot = app.files[headshotKey];
        }
      }
      
      // Strategy 3: Look up question fields to find file field with fileKind='headshot'
      if (!userHeadshot && app.files) {
        const questionsCollection = client.db().collection(QUESTIONS_COLLECTION);
        const questionSet = await questionsCollection.findOne({ cycleId, track: app.track });
        if (questionSet?.fields) {
          const headshotField = questionSet.fields.find((f: any) => f.type === 'file' && f.fileKind === 'headshot');
          if (headshotField && app.files[headshotField.key]) {
            userHeadshot = app.files[headshotField.key];
          }
        }
      }
      
      return { name: userName, email: userEmail, headshot: userHeadshot };
    };
    
    // Build rankings
    const rankings: RankedApplicant[] = [];
    
    // If z-score normalization is enabled, calculate reviewer statistics first
    let reviewerStats: Map<string, { mean: number; stdDev: number; count: number }> | null = null;
    
    if (config?.useZScoreNormalization) {
      // Get ALL reviews for this phase to calculate reviewer statistics
      const allPhaseReviews = await reviewsCollection.find({ 
        phase,
        applicationId: { $in: applications.map(a => a._id.toString()) }
      }).toArray();
      
      // Group scores by reviewer
      const reviewerScores: Map<string, number[]> = new Map();
      
      allPhaseReviews.forEach(review => {
        const email = review.reviewerEmail;
        if (!reviewerScores.has(email)) {
          reviewerScores.set(email, []);
        }
        // Collect all individual scores (not just overall)
        Object.values(review.scores || {}).forEach(score => {
          if (typeof score === 'number') {
            reviewerScores.get(email)!.push(score);
          }
        });
      });
      
      // Calculate mean and std dev for each reviewer
      reviewerStats = new Map();
      
      reviewerScores.forEach((scores, email) => {
        if (scores.length < 2) {
          // Not enough data for meaningful normalization - use default
          reviewerStats!.set(email, { mean: 3, stdDev: 1, count: scores.length });
          return;
        }
        
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance) || 1; // Avoid division by zero
        
        reviewerStats!.set(email, { mean, stdDev, count: scores.length });
      });
      
      console.log('Z-score normalization stats:', Object.fromEntries(reviewerStats));
    }
    
    // Helper function to normalize a score using z-score
    const normalizeScore = (score: number, reviewerEmail: string): number => {
      if (!reviewerStats || !reviewerStats.has(reviewerEmail)) {
        return score; // No normalization
      }
      const stats = reviewerStats.get(reviewerEmail)!;
      if (stats.stdDev === 0 || stats.count < 2) {
        return score; // Can't normalize with no variance or too few scores
      }
      // Convert to z-score, then scale back to 1-5 range (mean=3, stdDev=1)
      const zScore = (score - stats.mean) / stats.stdDev;
      // Scale z-score back to 1-5 scale: z=0 maps to 3, z=±2 maps to 1/5
      const normalized = 3 + zScore;
      // Clamp to valid range
      return Math.max(1, Math.min(5, normalized));
    };
    
    for (const app of applications) {
      const appId = app._id.toString();
      const reviews = await reviewsCollection.find({ applicationId: appId, phase }).toArray();
      const userInfo = await getUserInfo(app);
      
      if (reviews.length === 0) {
        // Include applicants without reviews at the bottom
        rankings.push({
          applicationId: appId,
          applicantName: userInfo.name,
          applicantEmail: userInfo.email,
          applicantHeadshot: userInfo.headshot,
          track: app.track,
          rank: 0, // Will be assigned later
          averageScore: 0,
          weightedScore: 0,
          reviewCount: 0,
          referralCount: 0,
          deferralCount: 0,
          neutralCount: 0,
          recommendations: { advance: 0, hold: 0, reject: 0 },
        });
        continue;
      }
      
      // Calculate scores (with optional z-score normalization)
      const avgScores: Record<string, number[]> = {};
      const recommendations = { advance: 0, hold: 0, reject: 0 };
      let referralCount = 0, deferralCount = 0, neutralCount = 0;
      
      reviews.forEach(review => {
        const reviewerEmail = review.reviewerEmail;
        Object.entries(review.scores || {}).forEach(([key, value]) => {
          if (!avgScores[key]) avgScores[key] = [];
          // Apply z-score normalization if enabled
          const rawScore = value as number;
          const normalizedValue = config?.useZScoreNormalization 
            ? normalizeScore(rawScore, reviewerEmail)
            : rawScore;
          avgScores[key].push(normalizedValue);
        });
        
        if (review.recommendation) {
          recommendations[review.recommendation as keyof typeof recommendations]++;
        }
        
        const signal = review.referralSignal || 'neutral';
        if (signal === 'referral') referralCount++;
        else if (signal === 'deferral') deferralCount++;
        else neutralCount++;
      });
      
      const scores: Record<string, number> = {};
      Object.entries(avgScores).forEach(([key, values]) => {
        scores[key] = values.reduce((a, b) => a + b, 0) / values.length;
      });
      
      const avgScore = scores.overall || 0;
      
      // Calculate weighted score
      let weightedScore = avgScore;
      if (config?.scoringCategories) {
        let totalWeight = 0;
        let weightedSum = 0;
        config.scoringCategories.forEach((cat: any) => {
          if (scores[cat.key] !== undefined) {
            weightedSum += scores[cat.key] * cat.weight;
            totalWeight += cat.weight;
          }
        });
        if (totalWeight > 0) {
          weightedScore = weightedSum / totalWeight;
        }
      }
      
      // Apply referral weights to score
      if (config?.referralWeights) {
        const advocateWeight = config.referralWeights.advocate || 0;
        const opposeWeight = config.referralWeights.oppose || 0;
        weightedScore += (referralCount * advocateWeight) + (deferralCount * opposeWeight);
      }
      
      rankings.push({
        applicationId: appId,
        applicantName: userInfo.name,
        applicantEmail: userInfo.email,
        applicantHeadshot: userInfo.headshot,
        track: app.track,
        rank: 0,
        averageScore: avgScore,
        weightedScore,
        reviewCount: reviews.length,
        referralCount,
        deferralCount,
        neutralCount,
        recommendations,
      });
    }
    
    // Sort by weighted score (desc), then by referral count (desc), then by deferral count (asc)
    rankings.sort((a, b) => {
      if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
      if (b.referralCount !== a.referralCount) return b.referralCount - a.referralCount;
      return a.deferralCount - b.deferralCount;
    });
    
    // Assign ranks
    rankings.forEach((r, idx) => {
      r.rank = idx + 1;
    });
    
    const phaseRanking: PhaseRanking = {
      cycleId,
      phase,
      track,
      rankings,
      generatedAt: new Date().toISOString(),
    };
    
    return phaseRanking;
  } finally {
    await client.close();
  }
}

export async function savePhaseRanking(ranking: PhaseRanking): Promise<string> {
  const client = await getClient();
  try {
    const collection = client.db().collection(PHASE_RANKINGS_COLLECTION);
    const result = await collection.insertOne({
      ...ranking,
      createdAt: new Date().toISOString(),
    });
    return result.insertedId.toString();
  } finally {
    await client.close();
  }
}

export async function getLatestPhaseRanking(
  cycleId: string, 
  phase: ReviewPhase
): Promise<PhaseRanking | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(PHASE_RANKINGS_COLLECTION);
    const ranking = await collection.findOne(
      { cycleId, phase },
      { sort: { generatedAt: -1 } }
    );
    return serializeDoc<PhaseRanking>(ranking);
  } finally {
    await client.close();
  }
}

export async function getFinalizedPhaseRanking(
  cycleId: string, 
  phase: ReviewPhase
): Promise<PhaseRanking | null> {
  const client = await getClient();
  try {
    const collection = client.db().collection(PHASE_RANKINGS_COLLECTION);
    const ranking = await collection.findOne(
      { cycleId, phase, finalizedAt: { $exists: true } },
      { sort: { finalizedAt: -1 } }
    );
    return serializeDoc<PhaseRanking>(ranking);
  } finally {
    await client.close();
  }
}

// ============================================================================
// Phase Decisions & Cutoffs
// ============================================================================

const PHASE_DECISIONS_COLLECTION = 'recruitment_phase_decisions';

export async function applyCutoff(
  cycleId: string,
  phase: ReviewPhase,
  cutoffCriteria: CutoffCriteria,
  manualOverrides: Array<{ applicationId: string; action: 'advance' | 'reject'; reason: string }>,
  adminEmail: string
): Promise<{ advanced: string[]; rejected: string[] }> {
  const client = await getClient();
  try {
    // Generate fresh ranking
    const ranking = await generatePhaseRanking(cycleId, phase);
    
    // Determine who advances/rejects based on criteria
    const advanced: string[] = [];
    const rejected: string[] = [];
    
    // Process manual overrides first
    const overrideMap = new Map(manualOverrides.map(o => [o.applicationId, o]));
    
    ranking.rankings.forEach((r, idx) => {
      const override = overrideMap.get(r.applicationId);
      
      if (override) {
        // Manual override
        r.decision = override.action === 'advance' ? 'manual_advance' : 'manual_reject';
        r.decisionReason = override.reason;
        if (override.action === 'advance') {
          advanced.push(r.applicationId);
        } else {
          rejected.push(r.applicationId);
        }
      } else {
        // Apply cutoff criteria
        let shouldAdvance = false;
        
        switch (cutoffCriteria.type) {
          case 'top_n':
            shouldAdvance = idx < (cutoffCriteria.topN || 0);
            break;
          case 'min_score':
            shouldAdvance = r.weightedScore >= (cutoffCriteria.minScore || 0);
            break;
          case 'manual':
            // In manual mode, only overrides decide; default to reject
            shouldAdvance = false;
            break;
        }
        
        if (shouldAdvance) {
          r.decision = 'advance';
          advanced.push(r.applicationId);
        } else {
          r.decision = 'reject';
          rejected.push(r.applicationId);
        }
      }
      
      r.decisionBy = adminEmail;
      r.decisionAt = new Date().toISOString();
    });
    
    // Save the ranking with decisions
    ranking.finalizedAt = new Date().toISOString();
    await savePhaseRanking(ranking);
    
    // Update phase config
    await client.db().collection(PHASE_CONFIGS_COLLECTION).updateOne(
      { cycleId, phase },
      {
        $set: {
          cutoffAppliedAt: new Date().toISOString(),
          cutoffAppliedBy: adminEmail,
          cutoffCriteria,
          updatedAt: new Date().toISOString(),
        }
      }
    );
    
    // Determine new stages
    const nextStage: Record<ReviewPhase, { advance: ApplicationStage; reject: ApplicationStage }> = {
      application: { advance: 'interview_round1', reject: 'rejected' },
      interview_round1: { advance: 'interview_round2', reject: 'rejected' },
      interview_round2: { advance: 'accepted', reject: 'rejected' },
    };
    
    const applicationsCollection = client.db().collection(APPLICATIONS_COLLECTION);
    const decisionsCollection = client.db().collection(PHASE_DECISIONS_COLLECTION);
    
    // Update application stages and log decisions
    for (const appId of advanced) {
      const app = await applicationsCollection.findOne({ _id: new ObjectId(appId) });
      if (app) {
        await applicationsCollection.updateOne(
          { _id: new ObjectId(appId) },
          { $set: { stage: nextStage[phase].advance, updatedAt: new Date().toISOString() } }
        );
        
        await decisionsCollection.insertOne({
          cycleId,
          phase,
          applicationId: appId,
          action: 'advance',
          previousStage: app.stage,
          newStage: nextStage[phase].advance,
          performedBy: adminEmail,
          performedAt: new Date().toISOString(),
        });
      }
    }
    
    for (const appId of rejected) {
      const app = await applicationsCollection.findOne({ _id: new ObjectId(appId) });
      if (app) {
        await applicationsCollection.updateOne(
          { _id: new ObjectId(appId) },
          { $set: { stage: nextStage[phase].reject, updatedAt: new Date().toISOString() } }
        );
        
        await decisionsCollection.insertOne({
          cycleId,
          phase,
          applicationId: appId,
          action: 'reject',
          previousStage: app.stage,
          newStage: nextStage[phase].reject,
          performedBy: adminEmail,
          performedAt: new Date().toISOString(),
        });
      }
    }
    
    return { advanced, rejected };
  } finally {
    await client.close();
  }
}

export async function getPhaseDecisions(
  cycleId: string, 
  phase: ReviewPhase
): Promise<PhaseDecisionAction[]> {
  const client = await getClient();
  try {
    const collection = client.db().collection(PHASE_DECISIONS_COLLECTION);
    const decisions = await collection.find({ cycleId, phase }).toArray();
    return serializeDocs<PhaseDecisionAction>(decisions);
  } finally {
    await client.close();
  }
}

// ============================================================================
// Phase Completeness
// ============================================================================

export async function getPhaseCompleteness(
  cycleId: string,
  phase: ReviewPhase,
  track?: ApplicationTrack
): Promise<PhaseCompleteness> {
  const client = await getClient();
  try {
    const applicationsCollection = client.db().collection(APPLICATIONS_COLLECTION);
    const reviewsCollection = client.db().collection(REVIEWS_COLLECTION);
    const phaseConfigCollection = client.db().collection(PHASE_CONFIGS_COLLECTION);
    
    // Get phase config (with optional track)
    const configFilter: Record<string, unknown> = { cycleId, phase };
    if (track) {
      configFilter.track = track;
    }
    const config = await phaseConfigCollection.findOne(configFilter)
      || await phaseConfigCollection.findOne({ cycleId, phase }); // Fallback
    const minReviewers = config?.minReviewersRequired || 2;
    
    // Determine eligible stages
    const eligibleStages: ApplicationStage[] = (() => {
      switch (phase) {
        case 'application':
          return ['submitted', 'under_review'];
        case 'interview_round1':
          return ['interview_round1'];
        case 'interview_round2':
          return ['interview_round2'];
        default:
          return [];
      }
    })();
    
    // Build filter with optional track filtering
    const applicationFilter: Record<string, unknown> = {
      cycleId,
      stage: { $in: eligibleStages },
    };
    if (track) {
      applicationFilter.$or = [{ track }, { track: 'both' }];
    }
    
    // Get all eligible applications
    const applications = await applicationsCollection.find(applicationFilter).toArray();
    
    const totalApplicants = applications.length;
    let applicantsWithReviews = 0;
    let applicantsFullyReviewed = 0;
    
    // Track reviewer completion
    const reviewerStats: Map<string, { reviewed: Set<string>; total: number }> = new Map();
    
    // Initialize with all admins who have reviewed anything
    const allReviews = await reviewsCollection.find({ cycleId, phase }).toArray();
    allReviews.forEach(review => {
      if (!reviewerStats.has(review.reviewerEmail)) {
        reviewerStats.set(review.reviewerEmail, { reviewed: new Set(), total: totalApplicants });
      }
      reviewerStats.get(review.reviewerEmail)!.reviewed.add(review.applicationId);
    });
    
    // Count applicants with reviews
    for (const app of applications) {
      const appId = app._id.toString();
      const reviewCount = await reviewsCollection.countDocuments({ applicationId: appId, phase });
      
      if (reviewCount > 0) applicantsWithReviews++;
      if (reviewCount >= minReviewers) applicantsFullyReviewed++;
    }
    
    // Build reviewer completion list
    const reviewerCompletion: ReviewerCompletion[] = [];
    reviewerStats.forEach((stats, email) => {
      reviewerCompletion.push({
        email,
        reviewed: stats.reviewed.size,
        total: stats.total,
        percentage: stats.total > 0 ? (stats.reviewed.size / stats.total) * 100 : 0,
      });
    });
    
    // Sort by completion percentage
    reviewerCompletion.sort((a, b) => b.percentage - a.percentage);
    
    return {
      cycleId,
      phase,
      status: (config?.status as PhaseStatus) || 'not_started',
      totalApplicants,
      applicantsWithReviews,
      applicantsFullyReviewed,
      reviewerCompletion,
    };
  } finally {
    await client.close();
  }
}

// ============================================================================
// Bulk Stage Updates
// ============================================================================

export async function bulkUpdateApplicationStages(
  applicationIds: string[],
  newStage: ApplicationStage
): Promise<number> {
  const client = await getClient();
  try {
    const collection = client.db().collection(APPLICATIONS_COLLECTION);
    const result = await collection.updateMany(
      { _id: { $in: applicationIds.map(id => new ObjectId(id)) } },
      { $set: { stage: newStage, updatedAt: new Date().toISOString() } }
    );
    return result.modifiedCount;
  } finally {
    await client.close();
  }
}
