# Role-Based Authentication System (RBAC)

This document describes the role-based authentication and authorization design for the application, including roles, access control, security measures, and how to extend it.

---

## 1. Overview

The system supports two roles:

| Role  | Description                    | Access                                                                 |
|-------|--------------------------------|------------------------------------------------------------------------|
| `USER`| Default for new registrations  | Dashboard, wallet, airtime/data purchases, transaction history         |
| `ADMIN`| Elevated; assigned manually   | All USER capabilities plus Admin Dashboard, user management, role assignment, stats, pending purchases |

- **Single login flow**: One set of credentials; role determines post-login destination and available features.
- **Dedicated admin login**: `/admin/login` uses `/api/admin/login`, which validates credentials and rejects non-admins before setting the session. Useful for shared devices or admin-only kiosks.
- **Session-based**: `session_token` in an httpOnly cookie; no JWT. Role is read from the `users` table on each server-side check.

---

## 2. Database Schema

### 2.1 Role column (from `008-add-user-role.sql`)

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

### 2.2 Role constraint (from `009-add-role-constraint.sql`)

```sql
ALTER TABLE users
ADD CONSTRAINT chk_users_role CHECK (UPPER(role) IN ('USER', 'ADMIN'));
```

### 2.3 Auth sessions

`auth_sessions` links `session_token` to `user_id`. Role is not stored in the session; it is always read from `users` to avoid stale permissions.

### 2.4 Migrations order

1. `001-create-tables.sql` – `users`, etc.
2. `003-create-auth-sessions.sql` – `auth_sessions`
3. `008-add-user-role.sql` – `users.role`
4. `009-add-role-constraint.sql` – `chk_users_role`

---

## 3. Role Constants and Helpers (`lib/roles.ts`)

Central place for role values and checks:

- **`ROLES`** – `{ USER: "USER", ADMIN: "ADMIN" }`
- **`normalizeRole(raw)`** – `"USER" | "ADMIN" | null`
- **`isAdmin(role)`** – `role === "ADMIN"`
- **`isUser(role, strict?)`** – `role === "USER"` (or non-ADMIN when not strict)
- **`hasRole(userRole, required)`** – hierarchical check (ADMIN satisfies USER)
- **`isValidRole(value)`** – for input validation (e.g. role assignment)

Use these instead of string literals to keep behavior consistent and make new roles easier to add.

---

## 4. Authentication Flows

### 4.1 User registration

- `lib/actions/auth.ts` → `register()`
- New users get `role = ROLES.USER`.
- Session and cookie are set like login.

### 4.2 User login (`/login` → `/api/auth/login`)

1. Validate email/password.
2. Create `auth_sessions` row and set `session_token` cookie.
3. Return `{ success, user }` with `user.role`.
4. Client: if `isAdmin(user.role)` → `/admin`, else → `/dashboard`.

### 4.3 Admin login (`/admin/login` → `/api/admin/login`)

1. Reuse `login()` from `lib/actions/auth.ts` for credentials.
2. If not `isAdmin(user.role)` → `{ success: false, error: "Access denied. Admin privileges required." }` (no session set).
3. If admin: set same `session_token` cookie and return `{ success, user }`.
4. Client: redirect to `/admin`.

### 4.4 Logout

- `POST /api/auth/logout` deletes the `auth_sessions` row and clears `session_token`.
- Used by both user and admin UIs; admin then redirects to `/admin/login`.

---

## 5. Middleware (`middleware.ts`)

Runs at the edge; no DB. Only checks presence of `session_token`:

| Path             | No cookie     | With cookie        |
|------------------|---------------|--------------------|
| `/dashboard/*`   | → `/login`    | Continue           |
| `/admin/login`   | Continue      | Continue           |
| `/admin/*` (rest)| → `/admin/login` | Continue (role checked in layout/API) |

Role enforcement is done in:

- **Admin UI**: `app/admin/layout.tsx` (skips for `/admin/login`) and `app/admin/page.tsx` via `GET /api/admin/auth`.
- **Admin API**: `requireAdmin()` in `lib/admin-auth.ts` for all `/api/admin/*` routes.

---

## 6. Server-Side Role Checks

### 6.1 `requireAdmin()` (`lib/admin-auth.ts`)

- Reads `session_token` from cookies.
- Joins `auth_sessions` and `users`, checks `s.expires_at > NOW()`.
- Uses `isAdmin(user.role)`; if false returns `{ ok: false, status: 403, error: "Access denied" }`.
- Used by: `/api/admin/auth`, `/api/admin/users`, `/api/admin/users/[id]`, `/api/admin/stats`, `/api/admin/purchases`, etc.

### 6.2 `getCurrentUser()` (`lib/actions/auth.ts`)

- Validates `session_token`, returns `User | null` including `role`.
- Used by `/api/auth/me` and any server action that needs the current user. For admin-only logic, combine with `isAdmin(user.role)` or use `requireAdmin()`.

---

## 7. API Routes and Roles

| Route                         | Auth        | Role    | Notes                                  |
|------------------------------|------------|---------|----------------------------------------|
| `POST /api/auth/login`       | None       | –       | Sets session for any valid user        |
| `POST /api/admin/login`      | None       | –       | Sets session only if `role=ADMIN`      |
| `GET /api/auth/me`           | Session    | –       | Returns `user` with `role`             |
| `POST /api/auth/logout`      | Optional   | –       | Clears session                         |
| `GET /api/admin/auth`        | Session    | ADMIN   | `requireAdmin()`                      |
| `GET /api/admin/users`         | Session    | ADMIN   | List users including `role`            |
| `PATCH /api/admin/users/[id]`| Session    | ADMIN   | Body `{ role: "USER"|"ADMIN" }`       |
| Other `/api/admin/*`         | Session    | ADMIN   | `requireAdmin()`                       |
| `/api/dashboard/*`, etc.     | Session    | USER or ADMIN | Via `getCurrentUser()`; no extra role block for typical user actions |

---

## 8. Role Assignment (Admin UI)

- **User Management** on the Admin Dashboard includes a **Role** column.
- Dropdown per user: `USER` | `ADMIN`.
- On change: `PATCH /api/admin/users/[id]` with `{ role }`.
- **Safeguard**: an admin cannot set their own role to `USER` (enforced in the API).

---

## 9. Client-Side and UI

### 9.1 Auth context (`lib/auth-context.tsx`)

- `user`, `isLoading`, `login`, `register`, `logout`, `refreshUser`, `updateBalance`
- **`isAdmin`**: `user.role === "ADMIN"`
- **`isUser`**: logged in and not admin

`login()` returns `{ success, error?, user? }` so the login page can do role-based redirects.

### 9.2 Auth layout (`app/(auth)/layout.tsx`)

- If `user` and `!isLoading`: redirect to `isAdmin ? "/admin" : "/dashboard"` (covers `/login` and `/register` when already logged in).

### 9.3 Header (`components/header.tsx`)

- When `user.role === "ADMIN"`: show **Dashboard** and **Admin**.
- Otherwise: only **Dashboard**.

### 9.4 Admin layout (`app/admin/layout.tsx`)

- `/admin/login`: render `children` only (no header, no auth check).
- Other `/admin/*`: run `GET /api/admin/auth`; on failure redirect to `/admin/login`. Header includes User Dashboard, Logout (calls `/api/auth/logout` then `/admin/login`).

---

## 10. Security Considerations

- **HttpOnly, Secure (when HTTPS), SameSite=Lax** for `session_token` to mitigate XSS and CSRF.
- **Password hashing**: bcrypt in `lib/actions/auth.ts`.
- **Email**: case-insensitive and normalized to lowercase.
- **Admin creation**: no self-service; an existing admin or a DB migration sets `role='ADMIN'` for chosen accounts.
- **Role checks on the server**: every admin API uses `requireAdmin()`; middleware is only a first layer for route protection.
- **Role updates**: only `USER` and `ADMIN` via `isValidRole()`; admins cannot demote themselves in the PATCH handler.

---

## 11. Scalability and Maintainability

- **Adding a role**: extend `ROLES`, `ALLOWED_ROLES`, `isValidRole`, and `chk_users_role` (new migration); add `hasRole` branches and any new `require*()` helpers.
- **Adding a permission**: define a `requirePermission(name)` (or similar) that uses `users.role` or a future `user_permissions` table; call it from the relevant API routes and optionally from a new middleware or layout.
- **Audit**: `PATCH /api/admin/users/[id]` updates `users.updated_at`; for full audit trails, add an `audit_log` table and write role-change events.

---

## 12. Files Reference

| Path | Purpose |
|------|---------|
| `lib/roles.ts` | Role constants and helpers |
| `lib/actions/auth.ts` | register, login, getCurrentUser, logout; uses `ROLES` |
| `lib/admin-auth.ts` | `requireAdmin()` using `isAdmin()` |
| `middleware.ts` | Route protection by `session_token` |
| `app/(auth)/layout.tsx` | Redirect logged-in users by role |
| `app/(auth)/login/page.tsx` | User login; role-based redirect; link to `/admin/login` |
| `app/admin/login/page.tsx` | Admin login; uses `/api/admin/login` |
| `app/admin/layout.tsx` | Auth check for `/admin` (except `/admin/login`); header and logout |
| `app/api/auth/login/route.ts` | User login API |
| `app/api/auth/me/route.ts` | Current user with `role` |
| `app/api/auth/logout/route.ts` | Logout |
| `app/api/admin/login/route.ts` | Admin-only login API |
| `app/api/admin/auth/route.ts` | Admin session check |
| `app/api/admin/users/route.ts` | List users with `role` |
| `app/api/admin/users/[id]/route.ts` | `PATCH` to update `role` |
| `scripts/008-add-user-role.sql` | `users.role` |
| `scripts/009-add-role-constraint.sql` | `chk_users_role` |

---

## 13. Creating the First Admin

The app Last Names not expose a UI to create the first admin. Use one of:

1. **SQL** (after running 008 and 009):

   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
   ```

2. **Script**: e.g. `scripts/create-admin-*.js` or a small script that updates `users.role` for a given email (ensure it runs with the same DB and env as the app).

After that, use `/admin/login` or `/login` (will redirect to `/admin` if `role=ADMIN`) to sign in as admin.
