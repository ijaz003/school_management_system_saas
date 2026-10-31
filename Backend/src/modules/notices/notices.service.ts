import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { users } from '../auth/auth.schema.js';
import { notices } from './notices.schema.js';
import type {
  CreateNoticeInput,
  ListNoticesFilters,
  UpdateNoticeInput,
} from './notices.types.js';

function mapNotice(row: {
  id: string;
  title: string;
  body: string;
  audience: string;
  status: string;
  publishedAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string | null;
}) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    status: row.status,
    publishedAt: row.publishedAt,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function requireNotice(noticeId: string, tenantId: string) {
  const [notice] = await db
    .select()
    .from(notices)
    .where(
      and(
        eq(notices.id, noticeId),
        eq(notices.tenantId, tenantId),
        isNull(notices.deletedAt),
      ),
    )
    .limit(1);
  if (!notice) throw new NotFoundError('Notice');
  return notice;
}

export async function listNotices(filters: ListNoticesFilters) {
  const { tenantId, page = 1, limit = 20, search, status, audience } = filters;
  const conditions = [eq(notices.tenantId, tenantId), isNull(notices.deletedAt)];
  if (status) conditions.push(eq(notices.status, status));
  if (audience) conditions.push(eq(notices.audience, audience));
  if (search) {
    const escaped = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchFilter = or(ilike(notices.title, escaped), ilike(notices.body, escaped));
    if (searchFilter) conditions.push(searchFilter);
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: notices.id,
        title: notices.title,
        body: notices.body,
        audience: notices.audience,
        status: notices.status,
        publishedAt: notices.publishedAt,
        createdBy: notices.createdBy,
        createdAt: notices.createdAt,
        updatedAt: notices.updatedAt,
        createdByName: users.fullName,
      })
      .from(notices)
      .leftJoin(users, eq(notices.createdBy, users.id))
      .where(where)
      .orderBy(desc(notices.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(notices).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items: rows.map(mapNotice),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getNoticeById(noticeId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: notices.id,
      title: notices.title,
      body: notices.body,
      audience: notices.audience,
      status: notices.status,
      publishedAt: notices.publishedAt,
      createdBy: notices.createdBy,
      createdAt: notices.createdAt,
      updatedAt: notices.updatedAt,
      createdByName: users.fullName,
    })
    .from(notices)
    .leftJoin(users, eq(notices.createdBy, users.id))
    .where(
      and(
        eq(notices.id, noticeId),
        eq(notices.tenantId, tenantId),
        isNull(notices.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Notice');
  return mapNotice(row);
}

export async function createNotice(input: CreateNoticeInput) {
  const now = new Date();
  const publish = input.data.publish === true;
  const [created] = await db
    .insert(notices)
    .values({
      tenantId: input.tenantId,
      title: input.data.title.trim(),
      body: input.data.body.trim(),
      audience: input.data.audience ?? 'all',
      status: publish ? 'published' : 'draft',
      publishedAt: publish ? now : null,
      createdBy: input.createdBy,
    })
    .returning({ id: notices.id });
  if (!created) throw new BadRequestError('Could not create notice');
  return getNoticeById(created.id, input.tenantId);
}

export async function updateNotice(input: UpdateNoticeInput) {
  const existing = await requireNotice(input.noticeId, input.tenantId);
  if (existing.status === 'published' && input.data.title === undefined && input.data.body === undefined && input.data.audience === undefined) {
    throw new BadRequestError('Nothing to update');
  }

  await db
    .update(notices)
    .set({
      ...(input.data.title !== undefined ? { title: input.data.title.trim() } : {}),
      ...(input.data.body !== undefined ? { body: input.data.body.trim() } : {}),
      ...(input.data.audience !== undefined ? { audience: input.data.audience } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(notices.id, existing.id), eq(notices.tenantId, input.tenantId)));

  return getNoticeById(existing.id, input.tenantId);
}

export async function publishNotice(noticeId: string, tenantId: string) {
  const existing = await requireNotice(noticeId, tenantId);
  if (existing.status === 'published') {
    return getNoticeById(existing.id, tenantId);
  }

  await db
    .update(notices)
    .set({
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(notices.id, existing.id), eq(notices.tenantId, tenantId)));

  return getNoticeById(existing.id, tenantId);
}

export async function deleteNotice(noticeId: string, tenantId: string) {
  const existing = await requireNotice(noticeId, tenantId);
  await db
    .update(notices)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(notices.id, existing.id), eq(notices.tenantId, tenantId)));
}
