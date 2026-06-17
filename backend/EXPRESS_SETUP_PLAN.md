# EXPRESS SETUP PLAN — AutoPartsPro
> Node.js + Express + TypeScript backend configuration

---

## 1. Project Initialization

The backend lives in its own folder alongside the frontend:

```
inventory-management-system/
├── frontend/     ← existing React app
└── backend/      ← new Express API (created in Phase 4)
```

Both are independent Node.js projects with their own `package.json`. They are NOT a monorepo — no shared packages, no workspace config. This keeps them simple and independently deployable.

---

## 2. Entry Points

### `src/index.ts` — Server start
```
Responsible for:
- Importing the Express app from app.ts
- Reading PORT from environment
- Calling app.listen()
- Logging "Server running on port X"
```

### `src/app.ts` — App configuration
```
Responsible for:
- Creating the Express app instance
- Registering all middleware (helmet, cors, rate limit, json parser)
- Mounting all route modules under /api/v1
- Registering the global error handler (must be last)
- Exporting the app (for testing without starting a server)
```

Separating these two files means tests can import `app` directly without binding to a port.

---

## 3. Middleware Stack (in order)

Every request passes through these in sequence:

```
Request
   │
   ▼
1. helmet()
   Sets secure HTTP headers automatically.
   Prevents clickjacking, sniffing, XSS via headers.
   No configuration needed for basic use.
   │
   ▼
2. cors({ origin: process.env.FRONTEND_URL })
   Only allows requests from the React frontend URL.
   In development: http://localhost:5173
   In production: your Vercel URL
   Blocks requests from unknown origins.
   │
   ▼
3. express.json({ limit: "10kb" })
   Parses JSON request bodies.
   10kb limit prevents extremely large payloads.
   │
   ▼
4. generalRateLimit (express-rate-limit)
   100 requests per 15 minutes per IP on all routes.
   Protects against scraping and abuse.
   │
   ▼
5. Route handlers (see routes below)
   └── authRateLimit on POST /auth/login only
       10 requests per 15 minutes — tighter for login
   │
   ▼
6. 404 handler
   Catches any request that didn't match a route.
   Returns: { "message": "Route not found" }
   │
   ▼
7. Global error handler
   Catches any error thrown anywhere in the app.
   Logs the full error server-side.
   Returns sanitized JSON to the client (never leaks stack traces).
```

---

## 4. TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

Key decisions:
- `"module": "CommonJS"` — Node.js native module format (no ESM complications)
- `"outDir": "./dist"` — compiled JS goes here, never committed
- `"strict": true` — same strictness as the frontend
- `"sourceMap": true` — enables readable stack traces in production errors

---

## 5. Package Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/**/*.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  }
}
```

- `dev` — runs TypeScript directly via `tsx`, restarts on file changes via `nodemon`
- `build` — compiles TypeScript to `dist/` for production
- `start` — runs compiled JavaScript (production only)
- `db:migrate` — creates + applies a new migration
- `db:seed` — populates DB with initial data
- `db:studio` — opens Prisma Studio (visual DB browser)

---

## 6. Environment Variables

**File: `backend/.env`** (never committed)

```bash
# Server
NODE_ENV=development
PORT=3001

# Database (from Supabase dashboard → Settings → Database)
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<password>@db.<ref>.supabase.co:5432/postgres"

# Authentication
JWT_SECRET="change-this-to-a-long-random-string-minimum-32-chars"
JWT_EXPIRES_IN="8h"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

**File: `backend/.env.example`** (committed — documents required variables)

```bash
NODE_ENV=
PORT=3001
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
JWT_EXPIRES_IN=8h
FRONTEND_URL=
```

**File: `src/config/env.ts`** — validates all required variables at startup:
```
- Reads from process.env
- Throws a descriptive error if any required variable is missing
- Exports typed constants so the rest of the app imports from here
- Prevents the server from starting with a broken config
```

---

## 7. Prisma Client Singleton

**File: `src/lib/prisma.ts`**

```
- Creates ONE PrismaClient instance for the entire app
- In development: logs all SQL queries to console
- In production: no query logging (performance + security)
- The singleton pattern prevents "too many connections" errors
  that happen when hot-reloading creates a new client every save
```

---

## 8. Module Structure (one module = one feature)

Each feature (auth, inventory, sales, reports, activity, users) lives in its own folder under `src/modules/`. Every module has the same four files:

```
auth.routes.ts      — URL paths, middleware chains, calls controller methods
auth.controller.ts  — extracts req data, calls service, sends res
auth.service.ts     — ALL business logic, ALL database access via Prisma
auth.schema.ts      — Zod schemas for validating request bodies
```

**Why this separation:**
- Routes never contain logic — just wiring
- Controllers never touch Prisma — just HTTP handling
- Services are pure TypeScript functions — easy to unit test
- Schemas are reusable — same Zod schema validates in middleware AND in TypeScript type inference

---

## 9. Global Error Handler

**File: `src/middleware/error.middleware.ts`**

Catches all errors thrown anywhere. Handles:

| Error type | HTTP status | Client message |
|---|---|---|
| Zod ValidationError | 400 | Field-level error messages |
| Prisma P2025 (not found) | 404 | "Resource not found" |
| Prisma P2002 (unique constraint) | 409 | "Already exists" |
| Custom AppError (thrown by services) | As specified | As specified |
| Everything else | 500 | "Internal server error" |

The actual error and stack trace are always logged to console (for debugging) but never sent to the client.

---

## 10. Custom AppError Class

**File: `src/types/index.ts`**

A simple class that extends `Error` and carries an HTTP status code:

```
class AppError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number)
}
```

Services throw `new AppError("Insufficient stock", 409)`. The error handler catches it and uses `statusCode` to set the response.

---

## 11. Request Validation Middleware

**File: `src/middleware/validate.middleware.ts`**

A higher-order function that takes a Zod schema and returns an Express middleware:

```
validate(schema) → middleware that:
  1. Parses req.body through the Zod schema
  2. If valid: attaches parsed data to req.body (with types)
  3. If invalid: calls next(error) with Zod error (caught by error handler → 400)
```

Usage in routes:
```
router.post("/inventory", authMiddleware, requireOwner, validate(InventoryCreateSchema), controller.create)
```

---

## 12. Auth Middleware

**File: `src/middleware/auth.middleware.ts`**

Verifies the JWT on every protected route:

```
1. Reads Authorization header
2. Extracts "Bearer <token>"
3. Calls jwt.verify(token, JWT_SECRET)
4. If valid: fetches user from DB, attaches to req.user
5. If invalid/expired: throws AppError("Invalid or expired token", 401)
```

**File: `src/middleware/requireRole.middleware.ts`**

Checks that `req.user.role === "OWNER"`:
```
If not OWNER: throws AppError("Forbidden", 403)
```

---

## 13. Express Type Extension

**File: `src/types/express.d.ts`**

TypeScript doesn't know that `req.user` exists by default. This file extends Express's `Request` interface:

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: "OWNER" | "WORKER";
      };
    }
  }
}
```

After this, `req.user` is fully typed everywhere in the codebase.

---

## 14. Folder Creation Order

When setting up the backend, create folders in this order:
1. `backend/` — root
2. `backend/src/` — source
3. `backend/src/config/`
4. `backend/src/lib/`
5. `backend/src/middleware/`
6. `backend/src/modules/auth/`
7. `backend/src/modules/inventory/`
8. `backend/src/modules/sales/`
9. `backend/src/modules/reports/`
10. `backend/src/modules/activity/`
11. `backend/src/modules/users/`
12. `backend/src/types/`
13. `backend/prisma/`

---

## 15. Development Workflow

```
Terminal 1 (backend):
  cd backend
  npm run dev
  → Server starts on http://localhost:3001
  → Restarts automatically on file save

Terminal 2 (frontend):
  cd frontend
  npm run dev
  → Vite starts on http://localhost:5173
  → Communicates with backend at http://localhost:3001

Terminal 3 (optional):
  cd backend
  npm run db:studio
  → Opens Prisma Studio at http://localhost:5555
  → Visual DB browser for inspecting data
```

---

## 16. Security Checklist for Express Setup

- [ ] `helmet()` is first middleware registered
- [ ] CORS origin is set to exact frontend URL (not `*`)
- [ ] Rate limiting is on all routes, tighter on auth routes
- [ ] `express.json()` has a size limit (`10kb`)
- [ ] JWT_SECRET is at least 32 random characters
- [ ] `.env` is in `.gitignore`
- [ ] Error handler never returns stack traces
- [ ] Prisma client is a singleton (one instance)
- [ ] All routes are versioned under `/api/v1`
- [ ] TypeScript strict mode is ON
