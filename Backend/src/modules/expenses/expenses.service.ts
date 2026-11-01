import { and, desc, eq, gte, ilike, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../lib/errors.js';
import { users } from '../auth/auth.schema.js';
import { expenseCategories, expenses } from './expenses.schema.js';
import type {
  CreateExpenseCategoryData,
  CreateExpenseData,
  ListExpenseCategoriesFilters,
  ListExpensesFilters,
  UpdateExpenseCategoryData,
  UpdateExpenseData,
} from './expenses.types.js';
import { DEFAULT_EXPENSE_CATEGORIES } from './expenses.types.js';

async function requireCategory(categoryId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(expenseCategories)
    .where(
      and(
        eq(expenseCategories.id, categoryId),
        eq(expenseCategories.tenantId, tenantId),
        isNull(expenseCategories.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Expense category');
  return row;
}

async function requireExpense(expenseId: string, tenantId: string) {
  const [row] = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.tenantId, tenantId),
        isNull(expenses.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError('Expense');
  return row;
}

function mapCategory(row: {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapExpense(row: {
  id: string;
  title: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
  vendor: string | null;
  reference: string | null;
  notes: string | null;
  status: string;
  categoryId: string | null;
  categoryName: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    expenseDate: row.expenseDate,
    paymentMethod: row.paymentMethod,
    vendor: row.vendor,
    reference: row.reference,
    notes: row.notes,
    status: row.status,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    createdBy: row.createdBy,
    createdByName: row.createdByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function ensureDefaultCategories(tenantId: string) {
  const existing = await db
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .where(
      and(
        eq(expenseCategories.tenantId, tenantId),
        isNull(expenseCategories.deletedAt),
      ),
    )
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(expenseCategories).values(
    DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
      tenantId,
      name,
      isActive: true,
    })),
  );
}

export async function listCategories(filters: ListExpenseCategoriesFilters) {
  await ensureDefaultCategories(filters.tenantId);

  const conditions = [
    eq(expenseCategories.tenantId, filters.tenantId),
    isNull(expenseCategories.deletedAt),
  ];
  if (filters.activeOnly) {
    conditions.push(eq(expenseCategories.isActive, true));
  }

  const rows = await db
    .select({
      id: expenseCategories.id,
      name: expenseCategories.name,
      description: expenseCategories.description,
      isActive: expenseCategories.isActive,
      createdAt: expenseCategories.createdAt,
      updatedAt: expenseCategories.updatedAt,
    })
    .from(expenseCategories)
    .where(and(...conditions))
    .orderBy(expenseCategories.name);

  return rows.map(mapCategory);
}

export async function createCategory(input: {
  tenantId: string;
  data: CreateExpenseCategoryData;
}) {
  await ensureDefaultCategories(input.tenantId);

  const name = input.data.name.trim();
  const [duplicate] = await db
    .select({ id: expenseCategories.id })
    .from(expenseCategories)
    .where(
      and(
        eq(expenseCategories.tenantId, input.tenantId),
        eq(expenseCategories.name, name),
        isNull(expenseCategories.deletedAt),
      ),
    )
    .limit(1);
  if (duplicate) throw new BadRequestError('A category with this name already exists');

  const [row] = await db
    .insert(expenseCategories)
    .values({
      tenantId: input.tenantId,
      name,
      description: input.data.description?.trim() || null,
      isActive: true,
    })
    .returning();

  if (!row) throw new BadRequestError('Could not create category');
  return mapCategory(row);
}

export async function updateCategory(input: {
  categoryId: string;
  tenantId: string;
  data: UpdateExpenseCategoryData;
}) {
  const category = await requireCategory(input.categoryId, input.tenantId);

  if (input.data.name !== undefined) {
    const name = input.data.name.trim();
    const [duplicate] = await db
      .select({ id: expenseCategories.id })
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.tenantId, input.tenantId),
          eq(expenseCategories.name, name),
          isNull(expenseCategories.deletedAt),
          sql`${expenseCategories.id} <> ${category.id}`,
        ),
      )
      .limit(1);
    if (duplicate) throw new BadRequestError('A category with this name already exists');
  }

  const [row] = await db
    .update(expenseCategories)
    .set({
      ...(input.data.name !== undefined ? { name: input.data.name.trim() } : {}),
      ...(input.data.description !== undefined
        ? { description: input.data.description?.trim() || null }
        : {}),
      ...(input.data.isActive !== undefined ? { isActive: input.data.isActive } : {}),
      updatedAt: new Date(),
    })
    .where(eq(expenseCategories.id, category.id))
    .returning();

  if (!row) throw new NotFoundError('Expense category');
  return mapCategory(row);
}

export async function deleteCategory(categoryId: string, tenantId: string) {
  const category = await requireCategory(categoryId, tenantId);
  const now = new Date();
  await db
    .update(expenseCategories)
    .set({ deletedAt: now, isActive: false, updatedAt: now })
    .where(eq(expenseCategories.id, category.id));
}

export async function listExpenses(filters: ListExpensesFilters) {
  const {
    tenantId,
    page = 1,
    limit = 20,
    search,
    categoryId,
    paymentMethod,
    status,
    fromDate,
    toDate,
  } = filters;

  const conditions = [eq(expenses.tenantId, tenantId), isNull(expenses.deletedAt)];
  if (categoryId) conditions.push(eq(expenses.categoryId, categoryId));
  if (paymentMethod) conditions.push(eq(expenses.paymentMethod, paymentMethod));
  if (status) conditions.push(eq(expenses.status, status));
  if (fromDate) conditions.push(gte(expenses.expenseDate, fromDate));
  if (toDate) conditions.push(lte(expenses.expenseDate, toDate));
  if (search) {
    const escaped = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    const searchFilter = or(
      ilike(expenses.title, escaped),
      ilike(expenses.vendor, escaped),
      ilike(expenses.reference, escaped),
      ilike(expenseCategories.name, escaped),
    );
    if (searchFilter) conditions.push(searchFilter);
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [rows, countRows, sumRows] = await Promise.all([
    db
      .select({
        id: expenses.id,
        title: expenses.title,
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
        paymentMethod: expenses.paymentMethod,
        vendor: expenses.vendor,
        reference: expenses.reference,
        notes: expenses.notes,
        status: expenses.status,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name,
        createdBy: expenses.createdBy,
        createdByName: users.fullName,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .leftJoin(users, eq(expenses.createdBy, users.id))
      .where(where)
      .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(where),
    db
      .select({
        totalAmount: sql<number>`coalesce(sum(case when ${expenses.status} = 'recorded' then ${expenses.amount} else 0 end), 0)::int`,
        recordedCount: sql<number>`count(*) filter (where ${expenses.status} = 'recorded')::int`,
        voidCount: sql<number>`count(*) filter (where ${expenses.status} = 'void')::int`,
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  const summary = {
    totalAmount: sumRows[0]?.totalAmount ?? 0,
    recordedCount: sumRows[0]?.recordedCount ?? 0,
    voidCount: sumRows[0]?.voidCount ?? 0,
  };

  return {
    items: rows.map(mapExpense),
    summary,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getExpense(expenseId: string, tenantId: string) {
  const [row] = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      amount: expenses.amount,
      expenseDate: expenses.expenseDate,
      paymentMethod: expenses.paymentMethod,
      vendor: expenses.vendor,
      reference: expenses.reference,
      notes: expenses.notes,
      status: expenses.status,
      categoryId: expenses.categoryId,
      categoryName: expenseCategories.name,
      createdBy: expenses.createdBy,
      createdByName: users.fullName,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .leftJoin(users, eq(expenses.createdBy, users.id))
    .where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.tenantId, tenantId),
        isNull(expenses.deletedAt),
      ),
    )
    .limit(1);

  if (!row) throw new NotFoundError('Expense');
  return mapExpense(row);
}

export async function createExpense(input: {
  tenantId: string;
  createdBy: string;
  data: CreateExpenseData;
}) {
  if (input.data.categoryId) {
    await requireCategory(input.data.categoryId, input.tenantId);
  }

  const [row] = await db
    .insert(expenses)
    .values({
      tenantId: input.tenantId,
      createdBy: input.createdBy,
      title: input.data.title.trim(),
      amount: input.data.amount,
      expenseDate: input.data.expenseDate,
      categoryId: input.data.categoryId ?? null,
      paymentMethod: input.data.paymentMethod ?? 'cash',
      vendor: input.data.vendor?.trim() || null,
      reference: input.data.reference?.trim() || null,
      notes: input.data.notes?.trim() || null,
      status: 'recorded',
    })
    .returning({ id: expenses.id });

  if (!row) throw new BadRequestError('Could not create expense');
  return getExpense(row.id, input.tenantId);
}

export async function updateExpense(input: {
  expenseId: string;
  tenantId: string;
  data: UpdateExpenseData;
}) {
  const expense = await requireExpense(input.expenseId, input.tenantId);

  if (input.data.categoryId) {
    await requireCategory(input.data.categoryId, input.tenantId);
  }

  await db
    .update(expenses)
    .set({
      ...(input.data.title !== undefined ? { title: input.data.title.trim() } : {}),
      ...(input.data.amount !== undefined ? { amount: input.data.amount } : {}),
      ...(input.data.expenseDate !== undefined
        ? { expenseDate: input.data.expenseDate }
        : {}),
      ...(input.data.categoryId !== undefined
        ? { categoryId: input.data.categoryId }
        : {}),
      ...(input.data.paymentMethod !== undefined
        ? { paymentMethod: input.data.paymentMethod }
        : {}),
      ...(input.data.vendor !== undefined
        ? { vendor: input.data.vendor?.trim() || null }
        : {}),
      ...(input.data.reference !== undefined
        ? { reference: input.data.reference?.trim() || null }
        : {}),
      ...(input.data.notes !== undefined
        ? { notes: input.data.notes?.trim() || null }
        : {}),
      ...(input.data.status !== undefined ? { status: input.data.status } : {}),
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, expense.id));

  return getExpense(expense.id, input.tenantId);
}

export async function deleteExpense(expenseId: string, tenantId: string) {
  const expense = await requireExpense(expenseId, tenantId);
  const now = new Date();
  await db
    .update(expenses)
    .set({ deletedAt: now, status: 'void', updatedAt: now })
    .where(eq(expenses.id, expense.id));
}
