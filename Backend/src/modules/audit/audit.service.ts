import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { users } from '../auth/auth.schema.js';
import { auditLogs } from './audit.schema.js';

export interface WriteAuditInput {
  tenantId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function writeAuditLog(input: WriteAuditInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      tenantId: input.tenantId,
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? null,
    });
  } catch (error) {
    console.error('[audit] failed to write log', error);
  }
}

export async function listAuditLogs(filters: {
  tenantId: string;
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
}) {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 30, 100);
  const conditions = [eq(auditLogs.tenantId, filters.tenantId)];

  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
  if (filters.actorId) conditions.push(eq(auditLogs.actorId, filters.actorId));
  if (filters.from) {
    conditions.push(gte(auditLogs.createdAt, new Date(`${filters.from}T00:00:00.000Z`)));
  }
  if (filters.to) {
    conditions.push(lte(auditLogs.createdAt, new Date(`${filters.to}T23:59:59.999Z`)));
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        summary: auditLogs.summary,
        metadata: auditLogs.metadata,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        actorId: auditLogs.actorId,
        actorName: users.fullName,
        actorEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(auditLogs).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}
