import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

let seeded = false;

export async function ensureSuperAdmin() {
  if (seeded) return;
  seeded = true;

  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    return;
  }

  try {
    const existing = await db.execute(
      sql`SELECT id, role FROM "user" WHERE email = ${email} LIMIT 1`
    );

    if (existing.rows.length > 0) {
      if (existing.rows[0].role !== "superAdmin") {
        await db.execute(
          sql`UPDATE "user" SET role = 'superAdmin' WHERE email = ${email}`
        );
        console.log("[seed] Updated existing user to superAdmin");
      }
      return;
    }

    // signUpEmail doesn't require auth — creates user + account with proper hashing
    const result = await auth.api.signUpEmail({
      body: { email, password, name: "Super Admin" },
    });

    if (result?.user?.id) {
      // signUpEmail only sets role to "user", update to superAdmin
      await db.execute(
        sql`UPDATE "user" SET role = 'superAdmin' WHERE id = ${result.user.id}`
      );
      console.log("[seed] Super admin created successfully");
    }
  } catch (error) {
    console.error("[seed] Failed to create super admin:", error);
  }
}
