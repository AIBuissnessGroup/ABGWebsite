import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';

// Safely serialize BigInt values
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ));
}

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/abg-website';
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db();
    
    const teamMembers = await db.collection('TeamMember')
      .find({ active: true })
      .sort({ featured: -1, sortOrder: 1, joinDate: 1 })
      .toArray();

    return NextResponse.json(safeJson(teamMembers));
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.role || !data.year) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'Name, role, and year are required' 
      }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    // Get the highest sortOrder to add new member at the end
    const maxSortOrderDoc = await db.collection('TeamMember')
      .findOne({}, { sort: { sortOrder: -1 }, projection: { sortOrder: 1 } });

    const sortOrderValue = maxSortOrderDoc?.sortOrder || 0;

    const teamMemberData = {
      name: data.name.trim(),
      role: data.role.trim(),
      year: data.year.trim(),
      major: data.major?.trim() || null,
      bio: data.bio?.trim() || null,
      email: data.email?.trim() || null,
      linkedIn: data.linkedIn?.trim() || null,
      github: data.github?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      featured: Boolean(data.featured),
      active: true,
      sortOrder: sortOrderValue + 1,
      joinDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Creating team member with data:', teamMemberData);

    const result = await db.collection('TeamMember').insertOne(teamMemberData);
    const teamMember = await db.collection('TeamMember').findOne({ _id: result.insertedId });

    console.log('Team member created successfully:', teamMember);

    return NextResponse.json(safeJson(teamMember));
  } catch (error: any) {
    console.error('Error creating team member:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json({ 
      error: 'Failed to create team member',
      details: error.message 
    }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.id || !data.name || !data.role || !data.year) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'ID, name, role, and year are required' 
      }, { status: 400 });
    }

    await client.connect();
    const db = client.db();

    const updateData: any = {
      name: data.name.trim(),
      role: data.role.trim(),
      year: data.year.trim(),
      major: data.major?.trim() || null,
      bio: data.bio?.trim() || null,
      email: data.email?.trim() || null,
      linkedIn: data.linkedIn?.trim() || null,
      github: data.github?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      featured: Boolean(data.featured),
      active: data.active !== undefined ? Boolean(data.active) : true,
      updatedAt: new Date()
    };

    // Only include sortOrder if it's provided
    if (data.sortOrder !== undefined) {
      updateData.sortOrder = Number(data.sortOrder);
    }
    
    const result = await db.collection('TeamMember').findOneAndUpdate(
      { id: data.id },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json(safeJson(result));
  } catch (error: any) {
    console.error('Error updating team member:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json({ 
      error: 'Failed to update team member',
      details: error.message 
    }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Team member ID required' }, { status: 400 });
    }

    await client.connect();
    const db = client.db();
    
    const result = await db.collection('TeamMember').deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting team member:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json({ 
      error: 'Failed to delete team member',
      details: error.message 
    }, { status: 500 });
  } finally {
    await client.close();
  }
} 