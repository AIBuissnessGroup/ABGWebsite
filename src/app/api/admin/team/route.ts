import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { MongoClient, ObjectId } from 'mongodb';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';

// Safely serialize BigInt values
function safeJson(obj: any) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ));
}

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';
const client = new MongoClient(uri);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session.user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await client.connect();
    const db = client.db();
    
    const teamMembers = await db.collection('TeamMember')
      .find({ active: true })
      .sort({ featured: -1, sortOrder: 1, joinDate: 1 })
      .toArray();

    // Map _id to id for consistent frontend usage and apply safeJson first
    const safeTeamMembers = safeJson(teamMembers);
    const membersWithId = safeTeamMembers.map((member: any) => ({
      ...member,
      id: member._id
    }));

    return NextResponse.json(membersWithId);
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
    
    if (!session || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      memberType: data.memberType || 'exec', // Default to exec if not specified
      project: data.project?.trim() || null, // Only for analysts
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
    
    if (!session || !isAdmin(session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get ID from URL query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    

    
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({ 
        error: 'Missing or invalid ID parameter',
        received: id
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        error: 'Invalid ID format',
        received: id
      }, { status: 400 });
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
      memberType: data.memberType || 'exec',
      project: data.project?.trim() || null,
      updatedAt: new Date()
    };

    // Only include sortOrder if it's provided
    if (data.sortOrder !== undefined) {
      updateData.sortOrder = Number(data.sortOrder);
    }
    
    const result = await db.collection('TeamMember').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Map _id to id for consistent frontend usage
    const memberWithId = {
      ...result,
      id: result._id.toString()
    };

    return NextResponse.json(safeJson(memberWithId));
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
    
    const result = await db.collection('TeamMember').deleteOne({ _id: new ObjectId(id) });
    
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
