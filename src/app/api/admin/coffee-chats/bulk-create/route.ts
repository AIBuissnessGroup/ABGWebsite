import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPER_ADMIN')) {
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

    // Parse dates and ensure we work in local timezone to avoid UTC issues
    const startDateObj = new Date(startDate + 'T00:00:00');
    const endDateObj = new Date(endDate + 'T23:59:59');

    const slots = generateSlots({
      startDate: startDateObj,
      endDate: endDateObj,
      daysOfWeek,
      startTime,
      endTime,
      slotDuration,
      location,
      capacity,
      execMemberId
    });

    await client.connect();
    const db = client.db();
    
    // Check for existing slots to avoid duplicates
    const existingSlots = await db.collection('CoffeeChat').find({
      startTime: {
        $gte: startDateObj,
        $lte: endDateObj
      }
    }).toArray();

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
          title: `Coffee Chat - ${formatDateTime(slotData.startTime)}`,
          hostName: '', // Will be set when exec is assigned
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
  execMemberId
}: any) {
  const slots = [];
  
  // Create date objects in local timezone to avoid UTC conversion issues
  const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDateLocal = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  
  while (currentDate <= endDateLocal) {
    const dayOfWeek = currentDate.getDay();
    
    if (daysOfWeek.includes(dayOfWeek)) {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      // Create datetime objects using local timezone constructor
      const dayStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        startHour,
        startMinute,
        0,
        0
      );
      
      const dayEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        endHour,
        endMinute,
        0,
        0
      );
      
      let cursor = new Date(dayStart);
      
      while (cursor < dayEnd) {
        const slotEnd = new Date(cursor.getTime() + slotDuration * 60000);
        
        if (slotEnd <= dayEnd) {
          slots.push({
            startTime: new Date(cursor),
            endTime: new Date(slotEnd),
            location,
            capacity,
            execMemberId: execMemberId || null,
          });
        }
        
        cursor = new Date(slotEnd);
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots;
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
