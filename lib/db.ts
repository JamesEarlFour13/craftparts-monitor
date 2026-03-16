import { Pool } from "pg";
import type { SyncHistoryRecord, PaginatedResponse } from "./types";

const globalForPg = globalThis as unknown as { pgPool: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

export async function getLatestPerDescription(
  page = 1,
  limit = 20,
  search = ""
): Promise<PaginatedResponse<SyncHistoryRecord>> {
  const offset = (page - 1) * limit;
  const hasSearch = search.length > 0;
  const searchPattern = `%${search}%`;

  const whereClause = hasSearch
    ? "WHERE rn = 1 AND extern_description ILIKE $3"
    : "WHERE rn = 1";

  const countWhereClause = hasSearch
    ? "WHERE extern_description ILIKE $1"
    : "";

  const dataParams = hasSearch
    ? [limit, offset, searchPattern]
    : [limit, offset];

  const countParams = hasSearch ? [searchPattern] : [];

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT *
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
       LIMIT $1 OFFSET $2`,
      dataParams
    ),
    pool.query(
      `SELECT COUNT(*) FROM (
         SELECT DISTINCT ON (extern_description) id
         FROM craftparts_sync_history
         ${countWhereClause}
       ) t`,
      countParams
    ),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);

  return {
    data: dataResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getHistoryByExternDescription(
  externDescription: string
): Promise<SyncHistoryRecord[]> {
  const { rows } = await pool.query(
    `SELECT * FROM craftparts_sync_history WHERE extern_description = $1 ORDER BY updated_at DESC`,
    [externDescription]
  );
  return rows;
}
