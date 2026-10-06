import { ObjectId } from 'mongodb';
import { getDb } from './mongodb';
import { Meeting, MeetingAttendee, MeetingCategory, UserAttendanceSummary } from '@/types/meetings';

let indexesEnsured = false;
export async function ensureMeetingIndexes() {
  if (indexesEnsured) return;
  try {
    const db = await getDb();
    const meetingsCollection = db.collection('meetings');
    const attendanceCollection = db.collection('meeting_attendance');

    await meetingsCollection.createIndex({ code: 1 }, { unique: true, sparse: true });
    await meetingsCollection.createIndex({ createdAt: -1 });

    await attendanceCollection.createIndex(
      { meetingId: 1, userEmail: 1 },
      { unique: true }
    );
    await attendanceCollection.createIndex({ userEmail: 1 });
    await attendanceCollection.createIndex({ userId: 1 });
    await attendanceCollection.createIndex({ checkedInAt: -1 });

    indexesEnsured = true;
  } catch (error) {
    console.error('Failed to ensure meeting indexes:', error);
  }
}

export function generateMeetingCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getAllMeetings(): Promise<Meeting[]> {
  try {
    await ensureMeetingIndexes();
    const db = await getDb();
    const meetingsCollection = db.collection('meetings');
    const attendanceCollection = db.collection('meeting_attendance');

    const rawMeetings = await meetingsCollection.find({}).sort({ date: -1, createdAt: -1 }).toArray();

    // Get attendee counts for each meeting safely
    const counts = await attendanceCollection
      .aggregate([
        { $match: { meetingId: { $ne: null } } },
        { $group: { _id: '$meetingId', count: { $sum: 1 } } }
      ])
      .toArray();

    const countMap = new Map<string, number>();
    counts.forEach((c: any) => {
      if (c && c._id) {
        countMap.set(c._id.toString(), c.count || 0);
      }
    });

    return rawMeetings.map((m: any) => ({
      id: m._id ? m._id.toString() : '',
      name: m.name || 'Untitled Meeting',
      date: m.date || new Date().toISOString().split('T')[0],
      category: m.category || 'General Meeting',
      code: m.code || '',
      isOpen: m.isOpen !== false,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      createdBy: m.createdBy || '',
      attendeeCount: m._id ? (countMap.get(m._id.toString()) || 0) : 0,
    }));
  } catch (err) {
    console.error('Error in getAllMeetings:', err);
    return [];
  }
}

export async function getMeetingById(id: string): Promise<{ meeting: Meeting | null; attendees: MeetingAttendee[] }> {
  try {
    await ensureMeetingIndexes();
    const db = await getDb();
    const meetingsCollection = db.collection('meetings');
    const attendanceCollection = db.collection('meeting_attendance');

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return { meeting: null, attendees: [] };
    }

    const rawMeeting = await meetingsCollection.findOne({ _id: objectId });
    if (!rawMeeting) {
      return { meeting: null, attendees: [] };
    }

    const rawAttendees = await attendanceCollection
      .find({ meetingId: objectId })
      .sort({ checkedInAt: -1 })
      .toArray();

    const attendees: MeetingAttendee[] = rawAttendees.map((a: any) => ({
      id: a._id ? a._id.toString() : '',
      meetingId: a.meetingId ? a.meetingId.toString() : objectId.toString(),
      userId: a.userId ? a.userId.toString() : '',
      userName: a.userName || 'Member',
      userEmail: a.userEmail || '',
      userRoles: Array.isArray(a.userRoles) ? a.userRoles : [],
      meetingName: a.meetingName || rawMeeting.name || 'Meeting',
      meetingDate: a.meetingDate || rawMeeting.date || '',
      meetingCategory: a.meetingCategory || rawMeeting.category || 'General Meeting',
      checkedInAt: a.checkedInAt ? new Date(a.checkedInAt).toISOString() : new Date().toISOString(),
    }));

    const meeting: Meeting = {
      id: rawMeeting._id.toString(),
      name: rawMeeting.name || 'Untitled Meeting',
      date: rawMeeting.date || '',
      category: rawMeeting.category || 'General Meeting',
      code: rawMeeting.code || '',
      isOpen: rawMeeting.isOpen !== false,
      createdAt: rawMeeting.createdAt ? new Date(rawMeeting.createdAt).toISOString() : new Date().toISOString(),
      createdBy: rawMeeting.createdBy || '',
      attendeeCount: attendees.length,
    };

    return { meeting, attendees };
  } catch (err) {
    console.error('Error in getMeetingById:', err);
    return { meeting: null, attendees: [] };
  }
}

export async function createMeeting(data: {
  name: string;
  date: string;
  category?: MeetingCategory;
  createdBy: string;
}): Promise<Meeting> {
  await ensureMeetingIndexes();
  const db = await getDb();
  const meetingsCollection = db.collection('meetings');

  const newMeeting = {
    name: data.name.trim(),
    date: data.date,
    category: data.category || 'General Meeting',
    code: generateMeetingCode(),
    isOpen: true,
    createdAt: new Date(),
    createdBy: data.createdBy,
  };

  const result = await meetingsCollection.insertOne(newMeeting);

  return {
    id: result.insertedId.toString(),
    name: newMeeting.name,
    date: newMeeting.date,
    category: newMeeting.category as MeetingCategory,
    code: newMeeting.code,
    isOpen: newMeeting.isOpen,
    createdAt: newMeeting.createdAt.toISOString(),
    createdBy: newMeeting.createdBy,
    attendeeCount: 0,
  };
}

export async function updateMeeting(
  id: string,
  update: { name?: string; date?: string; category?: MeetingCategory; isOpen?: boolean }
): Promise<boolean> {
  const db = await getDb();
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return false;
  }

  const $set: any = { updatedAt: new Date() };
  if (update.name !== undefined) $set.name = update.name.trim();
  if (update.date !== undefined) $set.date = update.date;
  if (update.category !== undefined) $set.category = update.category;
  if (update.isOpen !== undefined) $set.isOpen = update.isOpen;

  const res = await db.collection('meetings').updateOne({ _id: objectId }, { $set });
  return res.matchedCount > 0;
}

export async function deleteMeeting(id: string): Promise<boolean> {
  const db = await getDb();
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return false;
  }

  await db.collection('meetings').deleteOne({ _id: objectId });
  await db.collection('meeting_attendance').deleteMany({ meetingId: objectId });
  return true;
}

export async function recordMeetingAttendance(data: {
  meetingId: string;
  userEmail: string;
  userName: string;
  userRoles?: string[];
  userId?: string;
  ip?: string;
  userAgent?: string;
}): Promise<{
  success: boolean;
  alreadyCheckedIn?: boolean;
  meeting?: Meeting;
  record?: MeetingAttendee;
  error?: string;
}> {
  try {
    await ensureMeetingIndexes();
    const db = await getDb();
    const meetingsCollection = db.collection('meetings');
    const attendanceCollection = db.collection('meeting_attendance');

    let meetingObjectId: ObjectId;
    try {
      meetingObjectId = new ObjectId(data.meetingId);
    } catch {
      return { success: false, error: 'Invalid meeting ID' };
    }

    const rawMeeting = await meetingsCollection.findOne({ _id: meetingObjectId });
    if (!rawMeeting) {
      return { success: false, error: 'Meeting not found' };
    }

    if (rawMeeting.isOpen === false) {
      return { success: false, error: 'Check-in for this meeting is currently closed' };
    }

    const meeting: Meeting = {
      id: rawMeeting._id.toString(),
      name: rawMeeting.name || 'Untitled Meeting',
      date: rawMeeting.date || '',
      category: rawMeeting.category || 'General Meeting',
      code: rawMeeting.code || '',
      isOpen: rawMeeting.isOpen !== false,
      createdAt: rawMeeting.createdAt ? new Date(rawMeeting.createdAt).toISOString() : new Date().toISOString(),
      createdBy: rawMeeting.createdBy || '',
    };

    // Check if user is already checked in
    const existingRecord = await attendanceCollection.findOne({
      meetingId: meetingObjectId,
      userEmail: data.userEmail.toLowerCase().trim(),
    });

    if (existingRecord) {
      return {
        success: true,
        alreadyCheckedIn: true,
        meeting,
        record: {
          id: existingRecord._id ? existingRecord._id.toString() : '',
          meetingId: existingRecord.meetingId ? existingRecord.meetingId.toString() : meeting.id,
          userId: existingRecord.userId ? existingRecord.userId.toString() : '',
          userName: existingRecord.userName || 'Member',
          userEmail: existingRecord.userEmail || data.userEmail,
          userRoles: Array.isArray(existingRecord.userRoles) ? existingRecord.userRoles : [],
          meetingName: existingRecord.meetingName || meeting.name,
          meetingDate: existingRecord.meetingDate || meeting.date,
          meetingCategory: existingRecord.meetingCategory || meeting.category,
          checkedInAt: existingRecord.checkedInAt ? new Date(existingRecord.checkedInAt).toISOString() : new Date().toISOString(),
        },
      };
    }

    let userObjectId: ObjectId | undefined;
    if (data.userId) {
      try {
        userObjectId = new ObjectId(data.userId);
      } catch {
        // ignore
      }
    }

    const newRecord = {
      meetingId: meetingObjectId,
      userId: userObjectId,
      userName: data.userName || 'Member',
      userEmail: data.userEmail.toLowerCase().trim(),
      userRoles: Array.isArray(data.userRoles) ? data.userRoles : [],
      meetingName: meeting.name,
      meetingDate: meeting.date,
      meetingCategory: meeting.category,
      checkedInAt: new Date(),
      ip: data.ip,
      userAgent: data.userAgent,
    };

    try {
      const result = await attendanceCollection.insertOne(newRecord);
      return {
        success: true,
        alreadyCheckedIn: false,
        meeting,
        record: {
          id: result.insertedId.toString(),
          meetingId: meeting.id,
          userId: userObjectId ? userObjectId.toString() : '',
          userName: newRecord.userName,
          userEmail: newRecord.userEmail,
          userRoles: newRecord.userRoles,
          meetingName: newRecord.meetingName,
          meetingDate: newRecord.meetingDate,
          meetingCategory: newRecord.meetingCategory,
          checkedInAt: newRecord.checkedInAt.toISOString(),
        },
      };
    } catch (err: any) {
      if (err.code === 11000) {
        const existing = await attendanceCollection.findOne({
          meetingId: meetingObjectId,
          userEmail: data.userEmail.toLowerCase().trim(),
        });
        return {
          success: true,
          alreadyCheckedIn: true,
          meeting,
          record: existing
            ? {
                id: existing._id.toString(),
                meetingId: existing.meetingId.toString(),
                userId: existing.userId ? existing.userId.toString() : '',
                userName: existing.userName,
                userEmail: existing.userEmail,
                userRoles: Array.isArray(existing.userRoles) ? existing.userRoles : [],
                meetingName: existing.meetingName || meeting.name,
                meetingDate: existing.meetingDate || meeting.date,
                meetingCategory: existing.meetingCategory || meeting.category,
                checkedInAt: new Date(existing.checkedInAt).toISOString(),
              }
            : undefined,
        };
      }
      console.error('Error inserting attendance record:', err);
      return { success: false, error: 'Failed to record attendance' };
    }
  } catch (err: any) {
    console.error('Error in recordMeetingAttendance:', err);
    return { success: false, error: 'Internal error recording attendance' };
  }
}

export async function getUserMeetingAttendance(userEmailOrId: string): Promise<MeetingAttendee[]> {
  try {
    await ensureMeetingIndexes();
    const db = await getDb();
    const attendanceCollection = db.collection('meeting_attendance');

    let query: any;
    if (ObjectId.isValid(userEmailOrId)) {
      query = {
        $or: [
          { userId: new ObjectId(userEmailOrId) },
          { userEmail: userEmailOrId.toLowerCase().trim() },
        ],
      };
    } else {
      query = { userEmail: userEmailOrId.toLowerCase().trim() };
    }

    const rawRecords = await attendanceCollection
      .find(query)
      .sort({ checkedInAt: -1 })
      .toArray();

    return rawRecords.map((a: any) => ({
      id: a._id ? a._id.toString() : '',
      meetingId: a.meetingId ? a.meetingId.toString() : '',
      userId: a.userId ? a.userId.toString() : '',
      userName: a.userName || 'Member',
      userEmail: a.userEmail || '',
      userRoles: Array.isArray(a.userRoles) ? a.userRoles : [],
      meetingName: a.meetingName || 'Meeting',
      meetingDate: a.meetingDate || '',
      meetingCategory: a.meetingCategory || 'General Meeting',
      checkedInAt: a.checkedInAt ? new Date(a.checkedInAt).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.error('Error in getUserMeetingAttendance:', err);
    return [];
  }
}

export async function searchUsersWithAttendance(
  search: string = '',
  roleFilter: string = '',
  limit: number = 50,
  skip: number = 0
): Promise<{ users: UserAttendanceSummary[]; total: number }> {
  try {
    await ensureMeetingIndexes();
    const db = await getDb();
    const usersCollection = db.collection('users');
    const attendanceCollection = db.collection('meeting_attendance');

    const filter: any = {};
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (roleFilter && roleFilter !== 'ALL') {
      filter.roles = roleFilter;
    }

    const total = await usersCollection.countDocuments(filter);
    const rawUsers = await usersCollection
      .find(filter)
      .sort({ name: 1, email: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const userEmails = rawUsers
      .map((u: any) => (u.email ? u.email.toLowerCase().trim() : ''))
      .filter(Boolean);

    const attendanceStats = userEmails.length > 0 ? await attendanceCollection
      .aggregate([
        { $match: { userEmail: { $in: userEmails } } },
        { $sort: { checkedInAt: -1 } },
        {
          $group: {
            _id: '$userEmail',
            count: { $sum: 1 },
            lastRecord: { $first: '$$ROOT' },
          },
        },
      ])
      .toArray() : [];

    const statsMap = new Map<string, { count: number; lastRecord: any }>();
    attendanceStats.forEach((s: any) => {
      if (s && s._id) {
        statsMap.set(s._id.toLowerCase(), { count: s.count || 0, lastRecord: s.lastRecord });
      }
    });

    const users: UserAttendanceSummary[] = rawUsers.map((u: any) => {
      const emailKey = u.email ? u.email.toLowerCase().trim() : '';
      const stats = emailKey ? statsMap.get(emailKey) : undefined;

      let safeRoles: string[] = [];
      if (Array.isArray(u.roles)) {
        safeRoles = u.roles;
      } else if (u.role) {
        safeRoles = [u.role];
      } else if (typeof u.roles === 'string') {
        safeRoles = [u.roles];
      } else {
        safeRoles = ['USER'];
      }

      return {
        userId: u._id ? u._id.toString() : '',
        name: u.name || 'Unnamed Member',
        email: u.email || '',
        roles: safeRoles,
        totalAttended: stats?.count || 0,
        lastAttended: stats?.lastRecord
          ? {
              meetingName: stats.lastRecord.meetingName || 'Meeting',
              meetingDate: stats.lastRecord.meetingDate || '',
              meetingCategory: stats.lastRecord.meetingCategory || 'General Meeting',
              checkedInAt: stats.lastRecord.checkedInAt ? new Date(stats.lastRecord.checkedInAt).toISOString() : new Date().toISOString(),
            }
          : undefined,
      };
    });

    return { users, total };
  } catch (err) {
    console.error('Error in searchUsersWithAttendance:', err);
    return { users: [], total: 0 };
  }
}
