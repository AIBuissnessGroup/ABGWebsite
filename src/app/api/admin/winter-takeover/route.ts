import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Get takeover state - public endpoint for all devices to poll
export async function GET() {
  const client = new MongoClient(process.env.DATABASE_URL!, {
    tls: true,
    tlsCAFile: "/app/global-bundle.pem",
  });

  try {
    await client.connect();
    const db = client.db();
    
    const state = await db.collection('settings').findOne({ key: 'winter-takeover' });
    
    return NextResponse.json({
      triggered: state?.triggered || false,
      triggeredAt: state?.triggeredAt || null,
      countdownDate: state?.countdownDate || null,
    });
  } catch (error) {
    console.error('Error fetching takeover state:', error);
    return NextResponse.json({ triggered: false, triggeredAt: null, countdownDate: null });
  } finally {
    await client.close();
  }
}

// Trigger takeover - admin only
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.roles?.some(role => ['ADMIN', 'PRESIDENT', 'VP_INTERNAL'].includes(role))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = new MongoClient(process.env.DATABASE_URL!, {
    tls: true,
    tlsCAFile: "/app/global-bundle.pem",
  });

  try {
    await client.connect();
    const db = client.db();
    
    const { action, countdownDate } = await request.json();
    
    if (action === 'trigger') {
      await db.collection('settings').updateOne(
        { key: 'winter-takeover' },
        { 
          $set: { 
            triggered: true, 
            triggeredAt: new Date(),
            triggeredBy: session.user.email,
          } 
        },
        { upsert: true }
      );
      
      return NextResponse.json({ success: true, message: 'Winter takeover triggered!' });
    } else if (action === 'reset') {
      await db.collection('settings').updateOne(
        { key: 'winter-takeover' },
        { 
          $set: { 
            triggered: false, 
            triggeredAt: null,
            triggeredBy: null,
          } 
        },
        { upsert: true }
      );
      
      return NextResponse.json({ success: true, message: 'Winter takeover reset!' });
    } else if (action === 'setCountdown') {
      if (!countdownDate) {
        return NextResponse.json({ error: 'countdownDate is required' }, { status: 400 });
      }
      
      await db.collection('settings').updateOne(
        { key: 'winter-takeover' },
        { 
          $set: { 
            countdownDate: new Date(countdownDate),
            countdownSetBy: session.user.email,
            countdownSetAt: new Date(),
          } 
        },
        { upsert: true }
      );
      
      return NextResponse.json({ success: true, message: 'Countdown date updated!' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating takeover state:', error);
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 });
  } finally {
    await client.close();
  }
}
