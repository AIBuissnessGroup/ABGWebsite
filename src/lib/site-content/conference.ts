import { getDb } from '../mongodb';
import { ConferenceData } from '@/types/conference';
import { DEFAULT_CONFERENCE_DATA } from '../conference-defaults';

export { DEFAULT_CONFERENCE_DATA };

/**
 * Fetch Conference Data with safe fallback to default values
 */
export async function getConferenceData(): Promise<ConferenceData> {
  try {
    const db = await getDb();
    const doc = await db.collection('ConferenceEvent').findOne({ id: DEFAULT_CONFERENCE_DATA.id });
    if (doc) {
      const { _id, ...safeDoc } = doc;
      return {
        ...DEFAULT_CONFERENCE_DATA,
        ...safeDoc,
        speakers: safeDoc.speakers || DEFAULT_CONFERENCE_DATA.speakers,
        schedule: safeDoc.schedule || DEFAULT_CONFERENCE_DATA.schedule,
        sponsors: safeDoc.sponsors || DEFAULT_CONFERENCE_DATA.sponsors,
      } as ConferenceData;
    }

    // Insert default data if collection is empty
    await db.collection('ConferenceEvent').insertOne(DEFAULT_CONFERENCE_DATA as any);
    return DEFAULT_CONFERENCE_DATA;
  } catch (err) {
    console.warn('Unable to reach MongoDB for conference data; returning defaults:', err);
    return DEFAULT_CONFERENCE_DATA;
  }
}

/**
 * Upsert Conference Data (Admin update)
 */
export async function upsertConferenceData(data: Partial<ConferenceData>): Promise<ConferenceData> {
  const db = await getDb();
  const updateData = {
    ...data,
    id: DEFAULT_CONFERENCE_DATA.id,
    updatedAt: Date.now(),
  };

  await db.collection('ConferenceEvent').updateOne(
    { id: DEFAULT_CONFERENCE_DATA.id },
    { $set: updateData },
    { upsert: true }
  );

  const updated = await db.collection('ConferenceEvent').findOne({ id: DEFAULT_CONFERENCE_DATA.id });
  if (updated) {
    const { _id, ...safeDoc } = updated;
    return safeDoc as ConferenceData;
  }
  return { ...DEFAULT_CONFERENCE_DATA, ...updateData };
}
