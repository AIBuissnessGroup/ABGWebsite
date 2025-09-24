import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

// Create a singleton connection pool
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

// Connection pool configuration
const mongoOptions = {
  maxPoolSize: 50, // Maximum number of connections in the pool
  minPoolSize: 5,  // Minimum number of connections in the pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // How long to try to connect before timing out
  socketTimeoutMS: 45000, // How long a socket stays open before timing out
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  w: 'majority'
};

async function connectToDatabase(): Promise<MongoClient> {
  if (client && client.topology && client.topology.isConnected()) {
    return client;
  }

  if (clientPromise) {
    return clientPromise;
  }

  clientPromise = MongoClient.connect(uri, mongoOptions);
  client = await clientPromise;
  
  return client;
}

// Rate limiting map to prevent spam
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

// GET - Get all newsletter subscriptions (admin only)
export async function GET(request: NextRequest) {
  try {
    const client = await connectToDatabase();
    const db = client.db();
    
    const subscriptions = await db.collection('NewsletterSubscriber')
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error fetching newsletter subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
  // Don't close the connection - let the pool manage it
}

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               request.ip || 
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ 
        error: 'Too many requests. Please try again later.' 
      }, { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      });
    }

    const { email, name, source } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db();

    // Use a transaction for data consistency
    const session = client.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Check if email already exists
        const existingSubscription = await db.collection('NewsletterSubscriber')
          .findOne({ email }, { session });

        if (existingSubscription) {
          if (existingSubscription.isActive) {
            throw new Error('EMAIL_EXISTS');
          } else {
            // Reactivate subscription
            const updateData = {
              isActive: true,
              name: name || existingSubscription.name,
              source: source || existingSubscription.source,
              unsubscribedAt: null,
              updatedAt: new Date(),
              ipAddress: ip
            };
            
            await db.collection('NewsletterSubscriber').updateOne(
              { email },
              { $set: updateData },
              { session }
            );
          }
        } else {
          // Create new subscription
          const subscription = {
            email: email.toLowerCase().trim(),
            name: name?.trim(),
            source: source || 'website',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ipAddress: ip
          };

          await db.collection('NewsletterSubscriber').insertOne(subscription, { session });
        }
      });

      return NextResponse.json({ 
        message: 'Successfully subscribed!',
        timestamp: new Date().toISOString()
      });

    } catch (transactionError: any) {
      if (transactionError.message === 'EMAIL_EXISTS') {
        return NextResponse.json({ 
          message: 'Email already subscribed' 
        }, { status: 200 });
      }
      throw transactionError;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json({ 
          message: 'Email already subscribed' 
        }, { status: 200 });
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Request timeout. Please try again.' 
        }, { status: 408 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to subscribe. Please try again.' 
    }, { status: 500 });
  }
  // Don't close the connection - let the pool manage it
}

// DELETE - Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db();

    // Simple unsubscribe - in production you'd want to verify the token
    const result = await db.collection('NewsletterSubscriber').updateOne(
      { email, isActive: true },
      { 
        $set: { 
          isActive: false, 
          unsubscribedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'Email not found or already unsubscribed' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Successfully unsubscribed' 
    });

  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return NextResponse.json({ 
      error: 'Failed to unsubscribe' 
    }, { status: 500 });
  }
}
