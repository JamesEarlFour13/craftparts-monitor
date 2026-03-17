# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Craftparts Monitor is a Next.js 16 application that monitors sync history from the `craftparts_sync_history` PostgreSQL table. It displays the latest record per `extern_description` in a paginated, searchable table with a timeline modal for viewing full history. Includes authentication with role-based access control (superAdmin, admin, viewer).

## Commands

- `bun dev` — start dev server
- `bun run build` — production build
- `bun run lint` — run ESLint (flat config with next/core-web-vitals and next/typescript)
- `bun start` — serve production build
- `bunx drizzle-kit generate` — generate Drizzle migrations
- `bunx drizzle-kit migrate` — apply migrations (requires DATABASE_URL env)
- `bunx drizzle-kit pull` — introspect existing DB schema

## Tech Stack & Conventions

- **Package manager:** Bun (use `bun` instead of `npm`/`yarn`)
- **ORM:** Drizzle ORM with `@neondatabase/serverless` driver
- **Auth:** BetterAuth with admin plugin, email+password auth, RBAC
- **UI components:** shadcn/ui v4 with `base-maia` style, using Base UI primitives (`@base-ui/react`) and `class-variance-authority` for variants
- **Icons:** Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`)
- **Styling:** Tailwind CSS v4 with PostCSS, `tw-animate-css` for animations, `tailwind-merge` + `clsx` via `cn()` helper in `lib/utils.ts`
- **Data fetching:** TanStack Query (`@tanstack/react-query`) for client-side data fetching and caching. Hooks are centralized in `lib/api.ts`.
- **Database:** PostgreSQL on Neon DB via `@neondatabase/serverless`. Drizzle client singleton in `lib/db/index.ts`.
- **Path alias:** `@/*` maps to project root

## Architecture

- **No server actions** — all data fetching goes through API routes (`app/api/`)
- **API routes:**
  - `GET /api/sync-history` — paginated list of latest record per `extern_description` (params: `page`, `limit`, `search`) — auth required
  - `GET /api/sync-history/timeline` — all records for a given `extern_description` (param: `externDescription`) — auth required
  - `/api/auth/[...all]` — BetterAuth handler (login, signup, session, etc.)
  - `GET /api/users` — list users (admin+ only)
  - `POST /api/users` — create user (admin+ only)
  - `PATCH /api/users/[id]` — update user role (superAdmin only)
  - `DELETE /api/users/[id]` — delete user (with role permission check)
  - `GET /api/notification-recipients` — list notification recipients (admin+ only)
  - `POST /api/notification-recipients` — create recipient (admin+ only)
  - `PATCH /api/notification-recipients/[id]` — update recipient (admin+ only)
  - `DELETE /api/notification-recipients/[id]` — delete recipient (admin+ only)
  - `POST /api/notification-recipients/test` — send test email to verify SMTP (admin+ only)
  - `GET /api/settings` — get app settings (notificationsEnabled) (admin+ only)
  - `PATCH /api/settings` — update app settings (admin+ only)
  - `POST /api/cron/check-sync` — cron endpoint: checks for Failed/Aborted syncs in the last hour and emails recipients. Auth via `Authorization: Bearer <CRON_SECRET>`
- **DB schema:** `lib/db/schema.ts` — existing table schemas, `lib/db/auth-schema.ts` — BetterAuth tables
- **DB client & queries:** `lib/db/index.ts` — Drizzle client + query functions
- **Auth config:** `lib/auth.ts` (server), `lib/auth-client.ts` (client)
- **RBAC:** `lib/auth-utils.ts` — role helpers (canManageUsers, canCreateRole, canDeleteUser, canChangeRole)
- **Seed:** `lib/seed.ts` — auto-creates superAdmin on first request from SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD env vars
- **Types:** `lib/types.ts` — shared interfaces (`SyncHistoryRecord`, `PaginatedResponse`)
- **Email service:** `lib/email.ts` — nodemailer transporter singleton + `sendEmail()` / `sendTestEmail()` / `sendSyncAlertEmail()` helpers
- **API hooks:** `lib/api.ts` — TanStack Query hooks for sync history + user management + notification recipients + app settings
- **Providers:** `components/providers.tsx` — `QueryClientProvider` wrapper, used in root layout
- **Route protection:** `proxy.ts` — checks session cookie, redirects unauthenticated to `/login`

## Roles (RBAC)

- **superAdmin** — full access, can manage all users and roles
- **admin** — can create viewers and admins, can delete viewers and admins
- **viewer** — read-only access to sync history

## Adding shadcn Components

```bash
bunx shadcn@latest add <component-name>
```

Components go to `components/ui/`. The shadcn config (`components.json`) uses RSC-compatible output, Hugeicons as the icon library, and neutral as the base color.

## Environment Variables

- `DATABASE_URL` — Neon PostgreSQL connection string
- `BETTER_AUTH_SECRET` — BetterAuth secret (min 32 chars)
- `BETTER_AUTH_URL` — App base URL (e.g., `http://localhost:3000`)
- `SUPERADMIN_EMAIL` — Auto-seed super admin email
- `SUPERADMIN_PASSWORD` — Auto-seed super admin password
- `SMTP_HOST` — SMTP server host (default: `localhost`)
- `SMTP_PORT` — SMTP port (default: `587`, use `465` for SSL)
- `SMTP_USER` — SMTP auth user (optional for local mail servers)
- `SMTP_PASS` — SMTP auth password (optional)
- `SMTP_FROM` — From address for outgoing emails (default: `monitor@craftparts.com`)
- `CRON_SECRET` — Shared secret for authenticating cron API calls

## Cron Setup (VPS)

Add to system crontab to periodically call the check-sync endpoint:

```bash
0 * * * * curl -s -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check-sync
```
