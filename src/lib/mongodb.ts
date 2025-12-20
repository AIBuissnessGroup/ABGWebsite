import { MongoClient, Db } from 'mongodb';

/**
 * Centralized MongoDB/DocumentDB Client Module
 * 
 * This module provides a single source of configuration for MongoDB connections.
 * 
 * Environment Variables:
 * - MONGODB_URI or DATABASE_URL: Connection string (required)
 * - DB_TYPE: Database type - 'documentdb' or 'mongodb' (default: 'documentdb')
 *   - 'documentdb': Uses TLS with CA file (/app/global-bundle.pem)
 *   - 'mongodb': Standard MongoDB connection (for localhost development)
 * - NODE_ENV: Controls connection pooling behavior
 * 
 * @example
 * // For DocumentDB (production)
 * DB_TYPE=documentdb
 * MONGODB_URI=mongodb://...
 * 
 * @example
 * // For local MongoDB (development)
 * DB_TYPE=mongodb
 * MONGODB_URI=mongodb://localhost:27017/abg-website
 */

// Get MongoDB URI from environment variables
const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

if (!uri) {
  throw new Error('Please define MONGODB_URI or DATABASE_URL environment variable');
}

// Determine database type from environment variable
// DB_TYPE can be 'documentdb' or 'mongodb' (default: 'documentdb')
const dbType = (process.env.DB_TYPE || 'documentdb').toLowerCase();

// MongoDB connection options - conditional TLS based on DB_TYPE
const options: any = dbType === 'documentdb' ? {
  tls: true,
  tlsCAFile: "/app/global-bundle.pem",
} : {
  // Standard MongoDB connection (for localhost/development)
  // No TLS CA file needed
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the client across module reloads
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Get a connected MongoDB client instance.
 * Uses connection pooling to reuse connections efficiently.
 * 
 * @returns Promise<MongoClient> A connected MongoDB client
 * 
 * @example
 * ```typescript
 * const client = await getMongoClient();
 * const db = client.db();
 * const collection = db.collection('users');
 * // ... use collection
 * await client.close();
 * ```
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

/**
 * Get a database instance from the MongoDB client.
 * Convenience wrapper around getMongoClient().
 * 
 * @param dbName Optional database name. If not provided, uses default database from connection string.
 * @returns Promise<Db> A database instance
 * 
 * @example
 * ```typescript
 * const db = await getDatabase();
 * const users = await db.collection('users').find().toArray();
 * ```
 */
export async function getDatabase(dbName?: string): Promise<Db> {
  const client = await getMongoClient();
  return dbName ? client.db(dbName) : client.db();
}

/**
 * Create a new MongoDB client instance.
 * Use this when you need a fresh client instance that you'll manage independently.
 * Remember to close this client when done.
 * 
 * @returns MongoClient A new MongoDB client instance (not connected)
 * 
 * @example
 * ```typescript
 * const client = createMongoClient();
 * await client.connect();
 * try {
 *   const db = client.db();
 *   // ... use db
 * } finally {
 *   await client.close();
 * }
 * ```
 */
export function createMongoClient(): MongoClient {
  return new MongoClient(uri, options);
}

// Export the URI for backwards compatibility with existing code
export { uri as mongoUri };
