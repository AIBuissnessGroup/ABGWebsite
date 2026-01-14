// API endpoint to backfill user info for existing applications
// This runs within the app context where DB connections work

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { MongoClient, ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.roles?.some(role => 
      ['ADMIN', 'PRESIDENT', 'VP_INTERNAL'].includes(role)
    )) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to MongoDB
    const hasTlsInConnectionString = process.env.DATABASE_URL?.includes('tls=true') || 
                                     process.env.DATABASE_URL?.includes('ssl=true');
    
    const mongoOptions: Record<string, unknown> = hasTlsInConnectionString
      ? { tlsCAFile: "/app/global-bundle.pem" }
      : { tlsAllowInvalidCertificates: true };

    const client = new MongoClient(process.env.DATABASE_URL!, mongoOptions);
    
    await client.connect();
    const db = client.db();
    
    // Get all users with their emails
    const users = await db.collection("users").find({}).toArray();
    console.log(`Found ${users.length} users in database`);
    
    // Get all applications
    const applications = await db.collection("applications").find({}).toArray();
    console.log(`Found ${applications.length} applications`);
    
    // Get all NextAuth accounts for mapping
    const accounts = await db.collection("accounts").find({}).toArray();
    console.log(`Found ${accounts.length} accounts`);
    
    // Create a mapping from account providerAccountId to userId (ObjectId)
    const accountToUserMap = new Map<string, ObjectId>();
    for (const account of accounts) {
      accountToUserMap.set(account.providerAccountId, account.userId);
    }
    
    // Create a mapping from user ObjectId to user info
    const userInfoMap = new Map<string, { email: string; name: string }>();
    for (const user of users) {
      if (user.email) {
        userInfoMap.set(user._id.toString(), {
          email: user.email,
          name: user.name || user.email.split('@')[0]
        });
      }
    }
    
    // Also map by email directly
    const emailToUserMap = new Map<string, { email: string; name: string }>();
    for (const user of users) {
      if (user.email) {
        emailToUserMap.set(user.email, {
          email: user.email,
          name: user.name || user.email.split('@')[0]
        });
      }
    }
    
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    const notFoundList: string[] = [];
    
    for (const app of applications) {
      // Skip if already has userEmail
      if (app.userEmail) {
        skipped++;
        continue;
      }
      
      const userId = app.userId;
      if (!userId) {
        notFound++;
        notFoundList.push(`App ${app._id}: No userId`);
        continue;
      }
      
      let userInfo: { email: string; name: string } | undefined;
      
      // Strategy 1: userId is an email address
      if (userId.includes('@')) {
        userInfo = emailToUserMap.get(userId) || { email: userId, name: userId.split('@')[0] };
      }
      
      // Strategy 2: userId is a Google providerAccountId - look up via accounts
      if (!userInfo) {
        const userObjectId = accountToUserMap.get(userId);
        if (userObjectId) {
          userInfo = userInfoMap.get(userObjectId.toString());
        }
      }
      
      // Strategy 3: userId is a user ObjectId directly (less likely but check)
      if (!userInfo && ObjectId.isValid(userId)) {
        userInfo = userInfoMap.get(userId);
      }
      
      if (userInfo) {
        await db.collection("applications").updateOne(
          { _id: app._id },
          { 
            $set: { 
              userEmail: userInfo.email,
              userName: userInfo.name
            }
          }
        );
        updated++;
        console.log(`Updated app ${app._id}: ${userInfo.email}`);
      } else {
        notFound++;
        if (notFoundList.length < 20) {
          notFoundList.push(`App ${app._id}: userId=${userId}`);
        }
      }
    }
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      stats: {
        totalApplications: applications.length,
        totalUsers: users.length,
        totalAccounts: accounts.length,
        updated,
        skipped,
        notFound,
        notFoundSample: notFoundList.slice(0, 10)
      }
    });
    
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json(
      { error: "Backfill failed", details: String(error) },
      { status: 500 }
    );
  }
}

// GET to show stats without updating
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.roles?.some(role => 
      ['ADMIN', 'PRESIDENT', 'VP_INTERNAL'].includes(role)
    )) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasTlsInConnectionString = process.env.DATABASE_URL?.includes('tls=true') || 
                                     process.env.DATABASE_URL?.includes('ssl=true');
    
    const mongoOptions: Record<string, unknown> = hasTlsInConnectionString
      ? { tlsCAFile: "/app/global-bundle.pem" }
      : { tlsAllowInvalidCertificates: true };

    const client = new MongoClient(process.env.DATABASE_URL!, mongoOptions);
    
    await client.connect();
    const db = client.db();
    
    const users = await db.collection("users").find({}).toArray();
    const applications = await db.collection("applications").find({}).toArray();
    const accounts = await db.collection("accounts").find({}).toArray();
    
    // Count apps with/without userEmail
    const withEmail = applications.filter(a => a.userEmail).length;
    const withoutEmail = applications.filter(a => !a.userEmail).length;
    
    // Sample of apps without email
    const sampleWithout = applications
      .filter(a => !a.userEmail)
      .slice(0, 5)
      .map(a => ({ id: a._id.toString(), userId: a.userId }));
    
    // Sample of users
    const sampleUsers = users
      .slice(0, 5)
      .map(u => ({ id: u._id.toString(), email: u.email, name: u.name }));
    
    // Sample of accounts
    const sampleAccounts = accounts
      .slice(0, 5)
      .map(a => ({ 
        providerAccountId: a.providerAccountId, 
        userId: a.userId?.toString(),
        provider: a.provider
      }));
    
    await client.close();
    
    return NextResponse.json({
      stats: {
        users: users.length,
        applications: applications.length,
        accounts: accounts.length,
        appsWithEmail: withEmail,
        appsWithoutEmail: withoutEmail
      },
      samples: {
        appsWithoutEmail: sampleWithout,
        users: sampleUsers,
        accounts: sampleAccounts
      }
    });
    
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to get stats", details: String(error) },
      { status: 500 }
    );
  }
}
