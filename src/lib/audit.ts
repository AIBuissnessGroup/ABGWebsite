import { MongoClient, ObjectId } from 'mongodb';
import type { UserRole } from '@/types/next-auth';
import { mongoUri, createMongoClient } from './mongodb';

const uri = mongoUri;

export interface AuditLogEntry {
  _id?: string;
  userId: string;
  userEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  meta?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

export type AuditAction = 
  | 'user.role_changed'
  | 'user.created'
  | 'user.login'
  | 'event.created'
  | 'event.updated'
  | 'event.deleted'
  | 'event.registration_attempt'
  | 'event.registration_role_gate_failed'
  | 'event.registration_success'
  | 'admin.access_granted'
  | 'admin.access_denied'
  | 'content.created'
  | 'content.updated'
  | 'content.deleted';

/**
 * Log an audit event
 */
export async function logAuditEvent(
  userId: string,
  userEmail: string,
  action: AuditAction,
  targetType: string,
  options?: {
    targetId?: string;
    meta?: Record<string, any>;
    ip?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    const client = createMongoClient();
    await client.connect();
    
    const db = client.db();
    const auditCollection = db.collection('AuditLog');
    
    const auditEntry = {
      userId,
      userEmail,
      action,
      targetType,
      targetId: options?.targetId,
      meta: options?.meta || {},
      ip: options?.ip,
      userAgent: options?.userAgent,
      timestamp: new Date()
    };
    
    await auditCollection.insertOne(auditEntry);
    await client.close();
    
    console.log('AUDIT LOGGED:', {
      action,
      userEmail,
      targetType,
      targetId: options?.targetId,
      timestamp: auditEntry.timestamp.toISOString()
    });
    
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Failed to log audit event:', error, {
      action,
      userEmail,
      targetType
    });
  }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(options?: {
  page?: number;
  limit?: number;
  action?: string;
  userEmail?: string;
  targetType?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const client = createMongoClient();
  
  try {
    await client.connect();
    const db = client.db();
    const auditCollection = db.collection('AuditLog');
    
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter: any = {};
    
    if (options?.action) {
      filter.action = { $regex: options.action, $options: 'i' };
    }
    
    if (options?.userEmail) {
      filter.userEmail = { $regex: options.userEmail, $options: 'i' };
    }
    
    if (options?.targetType) {
      filter.targetType = options.targetType;
    }
    
    if (options?.startDate || options?.endDate) {
      filter.timestamp = {};
      if (options.startDate) {
        filter.timestamp.$gte = options.startDate;
      }
      if (options.endDate) {
        filter.timestamp.$lte = options.endDate;
      }
    }
    
    // Get total count
    const total = await auditCollection.countDocuments(filter);
    
    // Get logs
    const logs = await auditCollection
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    await client.close();
    
    return {
      logs: logs.map(log => ({
        _id: log._id?.toString(),
        userId: log.userId,
        userEmail: log.userEmail,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        meta: log.meta || {},
        ip: log.ip,
        userAgent: log.userAgent,
        timestamp: log.timestamp
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    await client.close();
    console.error('Error fetching audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStats(): Promise<{
  totalLogs: number;
  todayLogs: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userEmail: string; count: number }>;
}> {
  const client = createMongoClient();
  
  try {
    await client.connect();
    const db = client.db();
    const auditCollection = db.collection('AuditLog');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalLogs,
      todayLogs,
      topActions,
      topUsers
    ] = await Promise.all([
      auditCollection.countDocuments({}),
      auditCollection.countDocuments({ 
        timestamp: { $gte: today } 
      }),
      auditCollection.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, action: '$_id', count: 1 } }
      ]).toArray(),
      auditCollection.aggregate([
        { $group: { _id: '$userEmail', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, userEmail: '$_id', count: 1 } }
      ]).toArray()
    ]);
    
    await client.close();
    
    return {
      totalLogs,
      todayLogs,
      topActions: topActions as Array<{ action: string; count: number }>,
      topUsers: topUsers as Array<{ userEmail: string; count: number }>
    };
    
  } catch (error) {
    await client.close();
    console.error('Error fetching audit stats:', error);
    throw new Error('Failed to fetch audit statistics');
  }
}

/**
 * Helper to extract IP and User-Agent from request headers
 */
export function getRequestMetadata(request: Request): { ip?: string; userAgent?: string } {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ip, userAgent };
}