import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, desc, sql } from "drizzle-orm";
import { craftpartsSyncHistory } from "./schema";
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
