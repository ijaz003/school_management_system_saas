import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../../config/database.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { users } from '../auth/auth.schema.js';
import { tenants } from '../tenants/tenants.schema.js';
import { supportMessages, supportTickets } from './support.schema.js';
import type {
  CreateSupportMessageData,
  CreateSupportTicketData,
  ListSupportTicketsFilters,
  UpdateSupportTicketData,
} from './support.types.js';

const creators = alias(users, 'support_creators');
const assignees = alias(users, 'support_assignees');
const authors = alias(users, 'support_authors');

async function requireTicket(ticketId: string, tenantId?: string | null) {
  const conditions = [
    eq(supportTickets.id, ticketId),
    isNull(supportTickets.deletedAt),
  ];
  if (tenantId) conditions.push(eq(supportTickets.tenantId, tenantId));

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(and(...conditions))
    .limit(1);
  if (!ticket) throw new NotFoundError('Support ticket');
  return ticket;
}

function mapTicket(row: {
  id: string;
  tenantId: string;
  tenantName: string | null;
  tenantSlug: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdBy: string | null;
  createdByName: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  lastMessageAt: Date;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    tenantName: row.tenantName,
    tenantSlug: row.tenantSlug,
    subject: row.subject,
    category: row.category,
    priority: row.priority,
    status: row.status,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    assignedTo: row.assignedTo,
    assignedToName: row.assignedToName,
    lastMessageAt: row.lastMessageAt,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listTickets(filters: ListSupportTicketsFilters) {
  const {
    tenantId,
    page = 1,
    limit = 20,
    search,
    status,
    category,
    priority,
  } = filters;

  const conditions = [isNull(supportTickets.deletedAt)];
  if (tenantId) conditions.push(eq(supportTickets.tenantId, tenantId));
  if (status) conditions.push(eq(supportTickets.status, status));
  if (category) conditions.push(eq(supportTickets.category, category));
  if (priority) conditions.push(eq(supportTickets.priority, priority));
  if (search) {
    const escaped = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchFilter = or(
      ilike(supportTickets.subject, escaped),
      ilike(tenants.name, escaped),
      ilike(tenants.slug, escaped),
    );
    if (searchFilter) conditions.push(searchFilter);
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: supportTickets.id,
        tenantId: supportTickets.tenantId,
        tenantName: tenants.name,
        tenantSlug: tenants.slug,
        subject: supportTickets.subject,
        category: supportTickets.category,
        priority: supportTickets.priority,
        status: supportTickets.status,
        createdBy: supportTickets.createdBy,
        createdByName: creators.fullName,
        assignedTo: supportTickets.assignedTo,
        assignedToName: assignees.fullName,
        lastMessageAt: supportTickets.lastMessageAt,
        resolvedAt: supportTickets.resolvedAt,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
      })
      .from(supportTickets)
      .innerJoin(tenants, eq(supportTickets.tenantId, tenants.id))
      .leftJoin(creators, eq(supportTickets.createdBy, creators.id))
      .leftJoin(assignees, eq(supportTickets.assignedTo, assignees.id))
      .where(where)
      .orderBy(desc(supportTickets.lastMessageAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportTickets)
      .innerJoin(tenants, eq(supportTickets.tenantId, tenants.id))
      .where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  return {
    items: rows.map(mapTicket),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getTicketDetail(
  ticketId: string,
  options: { tenantId?: string | null; includeInternal: boolean },
) {
  const ticket = await requireTicket(ticketId, options.tenantId);

  const [header] = await db
    .select({
      id: supportTickets.id,
      tenantId: supportTickets.tenantId,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      subject: supportTickets.subject,
      category: supportTickets.category,
      priority: supportTickets.priority,
      status: supportTickets.status,
      createdBy: supportTickets.createdBy,
      createdByName: creators.fullName,
      assignedTo: supportTickets.assignedTo,
      assignedToName: assignees.fullName,
      lastMessageAt: supportTickets.lastMessageAt,
      resolvedAt: supportTickets.resolvedAt,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
    })
    .from(supportTickets)
    .innerJoin(tenants, eq(supportTickets.tenantId, tenants.id))
    .leftJoin(creators, eq(supportTickets.createdBy, creators.id))
    .leftJoin(assignees, eq(supportTickets.assignedTo, assignees.id))
    .where(eq(supportTickets.id, ticket.id))
    .limit(1);

  if (!header) throw new NotFoundError('Support ticket');

  const messageConditions = [eq(supportMessages.ticketId, ticket.id)];
  if (!options.includeInternal) {
    messageConditions.push(eq(supportMessages.isInternal, false));
  }

  const messages = await db
    .select({
      id: supportMessages.id,
      body: supportMessages.body,
      isInternal: supportMessages.isInternal,
      authorId: supportMessages.authorId,
      authorName: authors.fullName,
      authorRole: authors.role,
      createdAt: supportMessages.createdAt,
    })
    .from(supportMessages)
    .leftJoin(authors, eq(supportMessages.authorId, authors.id))
    .where(and(...messageConditions))
    .orderBy(supportMessages.createdAt);

  return {
    ticket: mapTicket(header),
    messages: messages.map((message) => ({
      id: message.id,
      body: message.body,
      isInternal: message.isInternal,
      authorId: message.authorId,
      authorName: message.authorName,
      authorRole: message.authorRole,
      createdAt: message.createdAt,
    })),
  };
}

export async function createTicket(input: {
  tenantId: string;
  createdBy: string;
  data: CreateSupportTicketData;
}) {
  const now = new Date();
  const [ticket] = await db
    .insert(supportTickets)
    .values({
      tenantId: input.tenantId,
      createdBy: input.createdBy,
      subject: input.data.subject.trim(),
      category: input.data.category ?? 'other',
      priority: input.data.priority ?? 'normal',
      status: 'open',
      lastMessageAt: now,
    })
    .returning({ id: supportTickets.id });

  if (!ticket) throw new BadRequestError('Could not create support ticket');

  await db.insert(supportMessages).values({
    ticketId: ticket.id,
    authorId: input.createdBy,
    body: input.data.body.trim(),
    isInternal: false,
  });

  return getTicketDetail(ticket.id, {
    tenantId: input.tenantId,
    includeInternal: false,
  });
}

export async function updateTicket(input: {
  ticketId: string;
  tenantId?: string | null;
  data: UpdateSupportTicketData;
  actorRole: string;
}) {
  const ticket = await requireTicket(input.ticketId, input.tenantId);

  if (input.actorRole !== 'super_admin' && input.data.assignedTo !== undefined) {
    throw new ForbiddenError('Only platform support can assign tickets');
  }

  const nextStatus = input.data.status ?? ticket.status;
  const resolvedAt =
    nextStatus === 'resolved' || nextStatus === 'closed'
      ? ticket.resolvedAt ?? new Date()
      : nextStatus === 'open' || nextStatus === 'in_progress' || nextStatus === 'waiting_school'
        ? null
        : ticket.resolvedAt;

  await db
    .update(supportTickets)
    .set({
      ...(input.data.status !== undefined ? { status: input.data.status } : {}),
      ...(input.data.priority !== undefined ? { priority: input.data.priority } : {}),
      ...(input.data.category !== undefined ? { category: input.data.category } : {}),
      ...(input.data.assignedTo !== undefined ? { assignedTo: input.data.assignedTo } : {}),
      resolvedAt,
      updatedAt: new Date(),
    })
    .where(eq(supportTickets.id, ticket.id));

  return getTicketDetail(ticket.id, {
    tenantId: input.tenantId,
    includeInternal: input.actorRole === 'super_admin',
  });
}

export async function addMessage(input: {
  ticketId: string;
  tenantId?: string | null;
  authorId: string;
  actorRole: string;
  data: CreateSupportMessageData;
}) {
  const ticket = await requireTicket(input.ticketId, input.tenantId);
  const isInternal = input.data.isInternal === true;

  if (isInternal && input.actorRole !== 'super_admin') {
    throw new ForbiddenError('Only platform support can add internal notes');
  }

  if (ticket.status === 'closed') {
    throw new BadRequestError('Closed tickets cannot receive new messages');
  }

  const now = new Date();
  await db.insert(supportMessages).values({
    ticketId: ticket.id,
    authorId: input.authorId,
    body: input.data.body.trim(),
    isInternal,
  });

  let nextStatus = ticket.status;
  if (!isInternal) {
    if (input.actorRole === 'super_admin') {
      nextStatus = 'waiting_school';
    } else if (ticket.status === 'waiting_school' || ticket.status === 'resolved') {
      nextStatus = 'open';
    } else if (ticket.status === 'open') {
      nextStatus = 'open';
    }
  } else if (ticket.status === 'open') {
    nextStatus = 'in_progress';
  }

  await db
    .update(supportTickets)
    .set({
      status: nextStatus,
      lastMessageAt: now,
      updatedAt: now,
      ...(nextStatus === 'resolved' || nextStatus === 'closed'
        ? {}
        : { resolvedAt: null }),
    })
    .where(eq(supportTickets.id, ticket.id));

  return getTicketDetail(ticket.id, {
    tenantId: input.tenantId,
    includeInternal: input.actorRole === 'super_admin',
  });
}
