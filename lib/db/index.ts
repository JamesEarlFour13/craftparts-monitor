import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { craftpartsSyncHistory, notificationRecipients, appSettings } from "./schema";
import { user } from "./auth-schema";
import type { SyncHistoryRecord, PaginatedResponse } from "../types";

const globalForDb = globalThis as unknown as { pool: Pool };

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool);

export async function getLatestPerDescription(
  page = 1,
  limit = 20,
  search = ""
): Promise<PaginatedResponse<SyncHistoryRecord>> {
  const offset = (page - 1) * limit;
  const hasSearch = search.length > 0;
  const searchPattern = `%${search}%`;

  const whereClause = hasSearch
    ? sql`WHERE rn = 1 AND extern_description ILIKE ${searchPattern}`
    : sql`WHERE rn = 1`;

  const countWhereClause = hasSearch
    ? sql`WHERE extern_description ILIKE ${searchPattern}`
    : sql``;

  const [dataResult, countResult] = await Promise.all([
    db.execute(sql`
      SELECT *
      FROM (
        SELECT *,
               ROW_NUMBER() OVER (
                 PARTITION BY extern_description
                 ORDER BY updated_at DESC
               ) AS rn
        FROM craftparts_sync_history
      ) t
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
    db.execute(sql`
      SELECT COUNT(*) FROM (
        SELECT DISTINCT ON (extern_description) id
        FROM craftparts_sync_history
        ${countWhereClause}
      ) t
    `),
  ]);

  const total = parseInt(countResult.rows[0].count as string, 10);

  return {
    data: dataResult.rows as unknown as SyncHistoryRecord[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getHistoryByExternDescription(
  externDescription: string
): Promise<SyncHistoryRecord[]> {
  const rows = await db
    .select()
    .from(craftpartsSyncHistory)
    .where(eq(craftpartsSyncHistory.externDescription, externDescription))
    .orderBy(desc(craftpartsSyncHistory.updatedAt));

  return rows as unknown as SyncHistoryRecord[];
}

// Notification recipients

export async function getNotificationRecipients() {
  return db
    .select()
    .from(notificationRecipients)
    .orderBy(desc(notificationRecipients.createdAt));
}

export async function getActiveNotificationRecipients() {
  return db
    .select()
    .from(notificationRecipients)
    .where(eq(notificationRecipients.active, true))
    .orderBy(desc(notificationRecipients.createdAt));
}

export async function createNotificationRecipient(
  email: string,
  name: string
) {
  const [row] = await db
    .insert(notificationRecipients)
    .values({ email, name })
    .returning();
  return row;
}

export async function updateNotificationRecipient(
  id: number,
  data: { email?: string; name?: string; active?: boolean }
) {
  const [row] = await db
    .update(notificationRecipients)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(notificationRecipients.id, id))
    .returning();
  return row;
}

export async function deleteNotificationRecipient(id: number) {
  await db
    .delete(notificationRecipients)
    .where(eq(notificationRecipients.id, id));
}

// App settings

export async function getAppSetting(key: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key));
  return row?.value ?? null;
}

export async function setAppSetting(key: string, value: string) {
  await db
    .insert(appSettings)
    .values({ key, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date().toISOString() },
    });
}

export async function isNotificationsEnabled(): Promise<boolean> {
  const value = await getAppSetting("notifications_enabled");
  return value !== "false";
}

// Cron queries

export async function getRecentFailedRecords(sinceMinutes: number) {
  const rows = await db
    .select()
    .from(craftpartsSyncHistory)
    .where(
      sql`${craftpartsSyncHistory.status} IN ('Failed', 'Aborted') AND ${craftpartsSyncHistory.createdAt} >= NOW() - INTERVAL '${sql.raw(String(sinceMinutes))} minutes'`
    );
  return rows as unknown as SyncHistoryRecord[];
}

export async function getSuperAdminEmails(): Promise<string[]> {
  const rows = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.role, "superAdmin"));
  return rows.map((r) => r.email);
}

export async function getSuperAdminUsers() {
  return db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.role, "superAdmin"));
}
