/**
 * Centralized MongoDB Connection Utility
 * 
 * Provides a single, reusable MongoDB client across the entire Next.js application.
 * - Build-time safe: won't crash during `next build` when env vars aren't available
 * - Connection pooling: reuses a single connection across requests
 * - Platform agnostic: works with Railway MongoDB, Atlas, or any MongoDB instance
 */

import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    // During `next build`, env vars may not be set. That's OK —
    // connections only happen at runtime in API route handlers.
    throw new Error(
      'MONGODB_URI is not defined. Set it in your environment variables.'
    );
  }

  if (clientPromise) {
    return clientPromise;
  }

  client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 60000,
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  clientPromise = client.connect();
  return clientPromise;
}

/**
 * Get a connected MongoDB database instance.
 * Call this inside API route handlers and server-side functions — never at module scope.
 *
 * @param dbName - Optional database name override. Defaults to the database in the connection string.
 */
export async function getDb(dbName?: string): Promise<Db> {
  const connectedClient = await getClientPromise();
  return connectedClient.db(dbName);
}

/**
 * Get the raw MongoClient (for advanced use cases like transactions).
 */
export async function getClient(): Promise<MongoClient> {
  return getClientPromise();
}

export default getClientPromise;
