# AUTHENTICATION PLAN — AutoPartsPro
> JWT-based authentication through the Express backend

---

## 1. Authentication Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                             │
│                                                             │
│  1. User enters email + password in React LoginPage         │
│  2. React calls POST /api/v1/auth/login                     │
│  3. Express receives request                                │
│  4. AuthService fetches user from DB by email               │
│  5. bcrypt.compare(password, user.passwordHash)             │
│  6. If mismatch → 401 Unauthorized                          │
│  7. If match → jwt.sign({ id, email, role }, JWT_SECRET)    │
│  8. Returns { token, user } to React                        │
│  9. React stores token in memory (AuthContext state)        │
│  10. React stores { user } in localStorage for UI restore   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 AUTHENTICATED REQUEST FLOW                  │
│                                                             │
│  1. React sends: GET /api/v1/inventory                      │
│     Header: Authorization: Bearer eyJhbGc...               │
│  2. authMiddleware runs                                     │
│  3. jwt.verify(token, JWT_SECRET) — validates signature     │
│  4. Decoded payload: { id, email, role, iat, exp }          │
│  5. Fetches user from DB (checks isActive)                  │
│  6. Attaches to req.user                                    │
│  7. Route handler runs normally                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      LOGOUT FLOW                            │
│                                                             │
│  1. User clicks Sign Out in DashboardLayout                 │
│  2. React calls POST /api/v1/auth/logout (optional)         │
│  3. React clears token from AuthContext state               │
│  4. React removes user from localStorage                    │
│  5. React navigates to /                                    │
│  (JWT is stateless — no server-side session to destroy)     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  APP STARTUP / PAGE REFRESH                 │
│                                                             │
│  1. React app loads                                         │
│  2. AuthContext reads user object from localStorage         │
│     (name, email, role — for UI display only)               │
│  3. AuthContext calls GET /api/v1/auth/me with stored token │
│  4. If backend confirms token is valid → user stays logged  │
│  5. If token is expired/invalid → clear localStorage,      │
│     redirect to /                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Token Storage Strategy

This is an important security decision with trade-offs:

### Option A: localStorage (current mock approach) — NOT recommended for production
- Vulnerable to XSS attacks — JavaScript can read it
- Simple to implement

### Option B: Memory (React state) — Recommended for this project
- Token lives only in `AuthContext` state
- Cleared on tab close or refresh
- NOT vulnerable to XSS (JS cannot steal it from memory of another script)
- Page refresh requires re-validation (GET /auth/me)
- **This is what we will implement**

### Option C: HttpOnly Cookie — Most secure, more complex
- Cookie is set by server, unreadable by JavaScript
- Requires CSRF protection
- More complex to implement
- Best for production, overkill for an academic project

**Decision: Option B (memory storage)**

The UI state (name, role) can still be stored in localStorage for display purposes — this is not sensitive. The actual token stays in React state and is re-validated on every app load.

---

## 3. JWT Token Design

### Payload (what's inside the token)

```json
{
  "id": "uuid-of-user",
  "email": "owner@autopartspro.com",
  "role": "OWNER",
  "iat": 1718524800,
  "exp": 1718553600
}
```

- `id` — used to fetch the user from DB in auth middleware
- `email` — convenience field
- `role` — used for authorization checks
- `iat` — issued at (Unix timestamp, set by jwt.sign automatically)
- `exp` — expiry (set via `expiresIn: "8h"`)

### What is NOT in the token
- Password or password hash
- Sensitive business data
- Full user object (minimise payload size)

### Token expiry
- **8 hours** — appropriate for a work-day business app
- Workers log in at the start of their shift, token expires at end of day
- Can be configured via `JWT_EXPIRES_IN` env variable

---

## 4. Password Hashing

**Library:** `bcryptjs` (pure JavaScript, no native dependencies — easier to install on Windows)

**Cost factor:** 12
- Cost factor 10 = ~100ms per hash (default)
- Cost factor 12 = ~400ms per hash (recommended for 2024+)
- High cost factor makes brute force attacks very slow

**Registration flow:**
```
1. Receive plaintext password from request body
2. bcrypt.hash(password, 12) → returns hash string
3. Store ONLY the hash in the database
4. Plaintext password is discarded immediately
```

**Login flow:**
```
1. Receive plaintext password from request body
2. Fetch user from DB by email
3. bcrypt.compare(plaintext, user.passwordHash)
4. Returns true/false
5. Never reveal WHICH of email/password is wrong (always "Invalid credentials")
```

---

## 5. Role-Based Access Control (RBAC)

### Roles

| Role | Can do |
|---|---|
| `OWNER` | Everything: view reports, manage workers, see cost prices, CRUD inventory |
| `WORKER` | Record sales, view inventory (selling price only), view own activity |

### Implementation

Two middleware functions:

**`authMiddleware`** — verifies any valid JWT:
```
Used on: all protected routes
Effect: attaches req.user or returns 401
```

**`requireOwner`** — additionally checks role:
```
Used on: owner-only routes (POST/PATCH/DELETE inventory, all reports, user management)
Effect: returns 403 if req.user.role !== "OWNER"
```

Route examples:
```typescript
// Any authenticated user
router.get("/inventory", authMiddleware, controller.getAll)

// Owner only
router.post("/inventory", authMiddleware, requireOwner, validate(schema), controller.create)
router.delete("/inventory/:id", authMiddleware, requireOwner, controller.delete)
```

### Role-based data filtering

Some endpoints return different data depending on role. This happens in the service layer, not the route:

```typescript
// inventory.service.ts
async getAll(user: RequestUser) {
  const items = await prisma.inventory.findMany()
  
  if (user.role === "WORKER") {
    // Strip cost prices — workers shouldn't see purchase prices
    return items.map(({ costPrice, ...rest }) => rest)
  }
  
  return items  // Owner sees everything
}
```

---

## 6. Frontend AuthContext Changes

The current `AuthContext.tsx` uses mock credentials. It needs the following changes to work with the Express backend:

### What changes

| Current (mock) | New (Express API) |
|---|---|
| Hardcoded `MOCK_CREDENTIALS` | Removed entirely |
| `login()` — string comparison | `fetch("POST /api/v1/auth/login")` |
| `logout()` — localStorage.removeItem | `fetch("POST /api/v1/auth/logout")` + clear state |
| `useEffect` — localStorage.getItem | `fetch("GET /api/v1/auth/me")` to validate stored token |
| `user` stored in localStorage | Token in state, user object in localStorage (display only) |

### What stays the same

- `useAuth()` hook interface — `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`
- `ProtectedRoute` component — unchanged
- All pages using `useAuth()` — unchanged
- `DashboardLayout` — unchanged

The contract that pages rely on is preserved. Only the internals of `AuthContext.tsx` change.

### New `AuthContext` behavior

```
On login():
  1. POST /api/v1/auth/login → receives { token, user }
  2. Store token in state (memory only — not localStorage)
  3. Store user object in localStorage (name, email, role — for UI restore)
  4. Set user state

On app startup (useEffect):
  1. Read user object from localStorage → set for immediate UI display
  2. If user object exists → call GET /api/v1/auth/me with stored token
  3. If /me returns 200 → token is valid, stay logged in
  4. If /me returns 401 → token expired, clear localStorage, set user to null

On logout():
  1. POST /api/v1/auth/logout (fire-and-forget)
  2. Clear token from state
  3. Clear user from localStorage
  4. Set user to null
```

---

## 7. API Client Setup on the Frontend

A centralized API client is needed so every fetch call automatically includes the Authorization header. This replaces scattered fetch calls.

**File: `frontend/src/lib/api.ts`** (new file)

```
Responsibilities:
- Base URL from environment variable (VITE_API_URL)
- Automatically attaches Authorization: Bearer <token> to every request
- Handles 401 responses globally (redirect to login)
- Consistent JSON parsing and error handling
- Used by all React Query hooks
```

**Environment variable (frontend .env):**
```
VITE_API_URL=http://localhost:3001/api/v1
```

---

## 8. Session Security Considerations

| Concern | Handling |
|---|---|
| Token replay after logout | Tokens expire after 8h; server-side blacklist not implemented (acceptable for academic scope) |
| Deactivated worker still has valid token | `authMiddleware` checks `user.isActive` from DB on every request |
| JWT secret rotation | Requires all users to re-login; acceptable for maintenance windows |
| Concurrent sessions | Multiple tabs/devices allowed — no device management implemented |
| Password reset | Not implemented — owner manually resets via PATCH /users/:id/password |

---

## 9. First User (Owner Account) Creation

The database starts empty. The owner account must be created via a seed script — there is no public registration endpoint.

**`prisma/seed.ts` creates:**
```
email:    owner@autopartspro.com
password: (hashed via bcrypt, plaintext set in seed.ts — change after first login)
name:     Owner
role:     OWNER
```

After seeding, the owner logs in via the normal login page and changes their password via Settings.

**There is no public sign-up endpoint.** New worker accounts are created only by the owner through the Settings page.

---

## 10. Authentication Testing Plan

| Test | What to verify |
|---|---|
| POST /login with correct credentials | Returns 200 with token and user |
| POST /login with wrong password | Returns 401 |
| POST /login with unknown email | Returns 401 (same message — no email enumeration) |
| POST /login with missing fields | Returns 400 with validation errors |
| GET /me with valid token | Returns 200 with user |
| GET /me with expired token | Returns 401 |
| GET /me with no token | Returns 401 |
| GET /me with malformed token | Returns 401 |
| GET /inventory as WORKER | Returns 200, no costPrice field |
| POST /inventory as WORKER | Returns 403 |
| POST /inventory as OWNER | Returns 201 |
| POST /login rate limiting | 11th attempt returns 429 |
