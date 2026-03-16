import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/auth-schema";

const statement = {
  user: ["create", "list", "set-role", "ban", "impersonate", "delete"],
} as const;

const ac = createAccessControl(statement);

const superAdmin = ac.newRole({
  user: ["create", "list", "set-role", "ban", "impersonate", "delete"],
});

const adminRole = ac.newRole({
  user: ["create", "list", "set-role", "ban", "delete"],
});

const viewer = ac.newRole({
  user: [],
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      ac,
      roles: {
        superAdmin,
        admin: adminRole,
        viewer,
      },
      defaultRole: "viewer",
    }),
    nextCookies(),
  ],
  session: {
    cookieCache: {
      enabled: false,
    },
  },
});
