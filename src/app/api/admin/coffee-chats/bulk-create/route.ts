import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { createMongoClient } from '@/lib/mongodb';
import { requireAdminSession } from '@/lib/server-admin';
import { easternInputToUtc, formatUtcDateInEastern } from '@/lib/timezone';

const client = createMongoClient();

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      startDate,
      endDate,
      daysOfWeek = [2, 3, 4, 5], // Tue-Fri by default
      startTime = '16:00',
      endTime = '18:00',
      slotDuration = 20,
      location = 'Ross School of Business',
      capacity = 1,
      execMemberId
    } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    const rangeStart = new Date(easternInputToUtc(`${startDate}T00:00`));
    const rangeEnd = new Date(easternInputToUtc(`${endDate}T23:59`));

    const slots = generateSlots({
      startDate,
      endDate,
      daysOfWeek,
      startTime,
      endTime,
      slotDuration,
      location,
      capacity,
      execMemberId,
    });

    await client.connect();
    const db = client.db();
    
    // Check for existing slots to avoid duplicates
    const existingSlots = await db
      .collection('CoffeeChat')
      .find({
        startTime: {
          $gte: rangeStart,
          $lte: rangeEnd,
        },
      })
      .toArray();

    const existingSlotMap = new Map(
      existingSlots.map(slot => [
        `${slot.startTime.toISOString()}-${slot.location}`,
        slot
      ])
    );

    const newSlots = [];
    const skippedSlots = [];

    for (const slotData of slots) {
      const key = `${slotData.startTime.toISOString()}-${slotData.location}`;
      if (existingSlotMap.has(key)) {
        skippedSlots.push(slotData);
      } else {
        newSlots.push({
          ...slotData,
          id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: `Coffee Chat - ${formatUtcDateInEastern(slotData.startTime.toISOString())}`,
          hostName: '',
          hostEmail: '',
          isOpen: true,
          signups: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: session.user.email,
        });
      }
    }

    if (newSlots.length > 0) {
      await db.collection('CoffeeChat').insertMany(newSlots);
    }

    return NextResponse.json({
      created: newSlots.length,
      skipped: skippedSlots.length,
      totalRequested: slots.length,
      slots: newSlots.map(slot => ({
        id: slot.id,
        title: slot.title,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        location: slot.location,
        capacity: slot.capacity,
        execMemberId: slot.execMemberId,
      }))
    });
  } catch (error) {
    console.error('Error bulk creating coffee chat slots:', error);
    return NextResponse.json({ error: 'Failed to bulk create slots' }, { status: 500 });
  } finally {
    await client.close();
  }
}

function generateSlots({
  startDate,
  endDate,
  daysOfWeek,
  startTime,
  endTime,
  slotDuration,
  location,
  capacity,
  execMemberId,
}: {
  startDate: string;
  endDate: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  location: string;
  capacity: number;
  execMemberId?: string;
}) {
  const slots = [];
  const startCursor = new Date(`${startDate}T00:00:00Z`);
  const endCursor = new Date(`${endDate}T00:00:00Z`);

  for (
    let cursor = new Date(startCursor);
    cursor.getTime() <= endCursor.getTime();
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay();

    if (daysOfWeek.includes(dayOfWeek)) {
      const dayStart = new Date(easternInputToUtc(`${dateStr}T${startTime}`));
      const dayEnd = new Date(easternInputToUtc(`${dateStr}T${endTime}`));

      let slotCursor = new Date(dayStart);
      while (slotCursor < dayEnd) {
        const slotEnd = new Date(slotCursor.getTime() + slotDuration * 60000);
        if (slotEnd <= dayEnd) {
          slots.push({
            startTime: new Date(slotCursor),
            endTime: new Date(slotEnd),
            location,
            capacity,
            execMemberId: execMemberId || null,
          });
        }
        slotCursor = slotEnd;
      }
    }
  }

  return slots;
}
