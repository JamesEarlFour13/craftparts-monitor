---
name: No direct DB inserts for auth
description: Never insert directly into BetterAuth tables (user, account, session, verification) — always use BetterAuth API functions
type: feedback
---

Never write raw SQL inserts into BetterAuth-managed tables (user, account, session, verification). Always use BetterAuth's own API functions (signUpEmail, createUser, etc.) for creating/modifying auth data.

**Why:** BetterAuth has its own password hashing format, account linking logic, and table relationships. Direct inserts bypass all of that and create broken/unusable records.

**How to apply:** For seeding, use `auth.api.signUpEmail()` or `auth.api.createUser()`. Only use raw SQL for reading or updating non-sensitive fields like `role`.
