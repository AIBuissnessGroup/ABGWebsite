import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { requireAdminSession } from '@/lib/server-admin';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

export async function GET(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  
  // Extract filter parameters (same as regular API)
  const day = searchParams.get('day');
  const execId = searchParams.get('execId');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const location = searchParams.get('location');

  try {
    await client.connect();
    const db = client.db();

    // Build filter query
    const filter: any = {};
    
    if (day) {
      const dayStart = new Date(day + 'T00:00:00.000Z');
      const dayEnd = new Date(day + 'T23:59:59.999Z');
      filter.startTime = { $gte: dayStart, $lte: dayEnd };
    }
    
    if (execId) {
      filter.execMemberId = execId;
    }
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    const slots = await db.collection('CoffeeChat')
      .find(filter)
      .sort({ startTime: 1 })
      .toArray();

    // Get team members for exec info
    const teamMembers = await db.collection('TeamMember').find({ active: true }).toArray();
    const teamMemberMap = new Map(teamMembers.map(member => [member.id, member]));

    // Generate CSV
    const csvRows = [];
    csvRows.push([
      'Slot ID',
      'Date',
      'Start Time',
      'End Time',
      'Location',
      'Capacity',
      'Exec Member',
      'Exec Email',
      'Signups Count',
      'Signup Name',
      'Signup Email',
      'Signup Phone',
      'Signup Date'
    ]);

    for (const slot of slots) {
      const execMember = slot.execMemberId ? teamMemberMap.get(slot.execMemberId) : null;
      const startDateTime = new Date(slot.startTime);
      const endDateTime = new Date(slot.endTime);
      
      const baseData = [
        slot.id || slot._id.toString(),
        startDateTime.toLocaleDateString(),
        startDateTime.toLocaleTimeString(),
        endDateTime.toLocaleTimeString(),
        slot.location,
        slot.capacity,
        execMember?.name || '',
        execMember?.email || '',
        (slot.signups || []).length
      ];

      if (slot.signups && slot.signups.length > 0) {
        for (const signup of slot.signups) {
          csvRows.push([
            ...baseData,
            signup.userName || '',
            signup.userEmail || '',
            signup.phone || '',
            new Date(signup.createdAt).toLocaleString()
          ]);
        }
      } else {
        csvRows.push([...baseData, '', '', '', '']);
      }
    }

    const csvContent = csvRows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `coffee-chats-export-${timestamp}.csv`;

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting coffee chat data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  } finally {
    await client.close();
  }
}
