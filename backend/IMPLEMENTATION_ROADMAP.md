# IMPLEMENTATION ROADMAP — AutoPartsPro
> Beginner-friendly step-by-step guide to building the full stack
> Every step includes: WHY, exact commands, affected files, expected result, verification

---

## How to read this document

Each step follows this format:
- **WHY** — the reason this step exists
- **Commands** — exact commands to run (from which folder)
- **Files affected** — what gets created or changed
- **Expected result** — what you should see when it works
- **Verify** — how to confirm it worked before moving on
- **Rollback** — how to undo if something goes wrong

Work through steps in order. Do not skip ahead.

---

# PHASE A — BACKEND PROJECT SETUP

---

## Step A1 — Create the backend folder and initialize Node.js

**WHY:** The backend is a completely separate Node.js project. It needs its own `package.json` to track its own dependencies, separate from the frontend.

**Commands:** (run from `inventory-management-system/` root)
```
mkdir backend
cd backend
npm init -y
```

**Files affected:**
- `backend/package.json` — created with default values

**Expected result:** A `package.json` appears in the `backend/` folder with name, version, main, etc.

**Verify:** Open `backend/package.json` — it should exist with `"name": "backend"`.

**Rollback:** Delete the `backend/` folder entirely.

---

## Step A2 — Install runtime dependencies

**WHY:** These are the libraries the backend actually uses when running in production. Each one has a specific job:
- `express` — the web framework that handles HTTP requests
- `@prisma/client` — the auto-generated database query library
- `bcryptjs` — hashes passwords so they're never stored as plaintext
- `jsonwebtoken` — creates and verifies JWT tokens for authentication
- `zod` — validates request bodies (same library as the frontend)
- `cors` — allows the React frontend to call this API
- `express-rate-limit` — limits how many requests one IP can make
- `helmet` — sets secure HTTP headers automatically
- `dotenv` — loads `.env` file variables into `process.env`

**Commands:** (run from `backend/`)
```
npm install express @prisma/client bcryptjs jsonwebtoken zod cors express-rate-limit helmet dotenv
```

**Files affected:**
- `backend/package.json` — dependencies section updated
- `backend/node_modules/` — libraries downloaded

**Expected result:** All packages install without errors. `node_modules/` folder appears.

**Verify:** Run `npm list --depth=0` — all 9 packages should appear.

**Rollback:** Delete `node_modules/` and `package-lock.json`, re-run install without the problematic package.

---

## Step A3 — Install development dependencies

**WHY:** These are tools used only during development — they don't run in production:
- `typescript` — the TypeScript compiler
- `prisma` — the CLI tool for managing database migrations
- `tsx` — runs TypeScript files directly without compiling first (faster development)
- `nodemon` — watches files and restarts the server when you save
- `@types/*` — TypeScript type definitions for libraries that don't include their own
- `vitest` — test runner

**Commands:** (run from `backend/`)
```
npm install -D typescript prisma tsx nodemon @types/express @types/bcryptjs @types/jsonwebtoken @types/cors @types/node vitest
```

**Files affected:**
- `backend/package.json` — devDependencies section updated

**Expected result:** All dev packages install without errors.

**Verify:** `npm list --depth=0` shows all dev packages.

---

## Step A4 — Create TypeScript configuration

**WHY:** TypeScript needs a config file to know how to compile your code. Without this, `tsc` won't know where your source files are or where to put the compiled output.

**Commands:** (run from `backend/`)
```
npx tsc --init
```

Then immediately replace the generated content with the exact config from `EXPRESS_SETUP_PLAN.md` Section 4.

**Files affected:**
- `backend/tsconfig.json` — created

**Expected result:** A `tsconfig.json` exists with strict mode enabled, `outDir: "./dist"`, `rootDir: "./src"`.

**Verify:** Run `npx tsc --noEmit` — no errors (there's no source yet, but it shouldn't crash).

---

## Step A5 — Create the folder structure

**WHY:** Organizing files into folders from the start prevents the "everything in one folder" mess. The structure follows the module pattern described in `EXPRESS_SETUP_PLAN.md`.

**Commands:** (run from `backend/`)
```
mkdir src
mkdir src\config
mkdir src\lib
mkdir src\middleware
mkdir src\modules
mkdir src\modules\auth
mkdir src\modules\inventory
mkdir src\modules\sales
mkdir src\modules\reports
mkdir src\modules\activity
mkdir src\modules\users
mkdir src\types
mkdir prisma
```

**Files affected:** Folder structure created (no files yet).

**Verify:** `dir src /s /b` shows all folders exist.

---

## Step A6 — Create .gitignore and .env.example

**WHY:** `.gitignore` prevents secrets and generated files from being committed to Git. `.env.example` documents what variables are needed without revealing actual values.

**Files to create:**

`backend/.gitignore`:
```
node_modules/
dist/
.env
*.js.map
```

`backend/.env.example`:
```
NODE_ENV=
PORT=3001
DATABASE_URL=
DIRECT_URL=
JWT_SECRET=
JWT_EXPIRES_IN=8h
FRONTEND_URL=
```

**Files affected:**
- `backend/.gitignore` — created
- `backend/.env.example` — created

**Verify:** Both files exist. `.env` (when created later) will NOT appear in `git status`.

---

## Step A7 — Add npm scripts to package.json

**WHY:** These scripts give you short commands (`npm run dev`) instead of long ones (`nodemon --exec tsx src/index.ts`).

Update `backend/package.json` scripts section to match `EXPRESS_SETUP_PLAN.md` Section 5.

**Files affected:**
- `backend/package.json` — scripts section

**Verify:** `npm run` lists all scripts without errors.

---

# PHASE B — DATABASE SETUP

---

## Step B1 — Create Supabase project

**WHY:** Supabase gives us a free, cloud-hosted PostgreSQL database. We use it purely as a database host — no Supabase SDK, no Supabase auth.

**Steps (no commands — browser only):**
1. Go to https://app.supabase.com
2. Sign up / log in
3. Click "New project"
4. Enter project name: `autopartspro`
5. Set a strong database password — **save this password somewhere safe**
6. Choose the region closest to you
7. Click "Create new project"
8. Wait 2–3 minutes for the project to spin up

**Expected result:** A Supabase project dashboard is visible.

**Verify:** The project dashboard shows "Project is ready" status.

---

## Step B2 — Get Supabase connection strings

**WHY:** Prisma needs a connection string to know which database to connect to. Supabase provides two: one for queries (pooled) and one for migrations (direct).

**Steps:**
1. In Supabase dashboard → click Settings (gear icon)
2. Click "Database"
3. Scroll to "Connection string" section
4. Select "URI" tab
5. Copy the connection string for **"Transaction" mode** → this is your `DATABASE_URL`
   - It contains `?pgbouncer=true` and port `6543`
6. Copy the connection string for **"Session" mode** → this is your `DIRECT_URL`
   - It uses port `5432`
7. Replace `[YOUR-PASSWORD]` in both strings with your database password

**No commands — this is copy/paste from the browser.**

---

## Step B3 — Create the .env file

**WHY:** This is the local configuration file that stores all secrets. It's never committed to Git.

Create `backend/.env` with:
```
NODE_ENV=development
PORT=3001
DATABASE_URL="<paste your pooled connection string here>"
DIRECT_URL="<paste your direct connection string here>"
JWT_SECRET="<generate a random 32+ character string>"
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
```

To generate a secure JWT_SECRET (run in any terminal):
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Files affected:**
- `backend/.env` — created (NEVER commit this)

**Verify:** The file exists and contains all 6 variables.

---

## Step B4 — Initialize Prisma

**WHY:** `prisma init` creates the `prisma/` folder with a starter `schema.prisma` file and adds the `DATABASE_URL` variable to `.env` (we already have it).

**Commands:** (run from `backend/`)
```
npx prisma init --datasource-provider postgresql
```

**Files affected:**
- `backend/prisma/schema.prisma` — created with basic PostgreSQL config

**Expected result:** Prisma prints a success message showing the files it created.

**Verify:** `backend/prisma/schema.prisma` exists and shows `provider = "postgresql"`.

---

## Step B5 — Write the Prisma schema

**WHY:** The schema defines your database tables, their columns, relationships, and constraints. Prisma reads this to generate both the database migration SQL and the TypeScript client.

Replace the contents of `backend/prisma/schema.prisma` with the full schema from `DATABASE_SCHEMA.md` Section 2.

Key things the schema defines:
- `generator client` — tells Prisma to generate a TypeScript client
- `datasource db` — points to your PostgreSQL database
- All 5 models: User, Inventory, Sale, ActivityLog, Expense
- Enums: Role, PaymentMethod, ActivityType
- Relationships: Sale belongs to Inventory and User
- `@map` directives: TypeScript uses camelCase, database uses snake_case

**Files affected:**
- `backend/prisma/schema.prisma` — replaced with full schema

**Verify:** Run `npx prisma validate` — should print "The schema at prisma/schema.prisma is valid".

---

## Step B6 — Run the first migration

**WHY:** A migration translates your Prisma schema into actual SQL `CREATE TABLE` statements and runs them against the database. This creates all your tables in Supabase.

**Commands:** (run from `backend/`)
```
npx prisma migrate dev --name init
```

This command:
1. Compares your schema to the database (currently empty)
2. Generates SQL to create all tables
3. Creates `prisma/migrations/TIMESTAMP_init/migration.sql`
4. Runs the SQL against your Supabase database
5. Generates the Prisma TypeScript client

**Files affected:**
- `backend/prisma/migrations/` — migration folder created
- `backend/node_modules/.prisma/client/` — TypeScript client generated

**Expected result:** Prisma prints "Your database is now in sync with your schema."

**Verify:**
- Go to Supabase dashboard → Table Editor
- You should see 5 tables: users, inventory, sales, activity_logs, expenses

**Rollback:** `npx prisma migrate reset` (WARNING: deletes all data — only in development)

---

## Step B7 — Generate Prisma client

**WHY:** After every schema change, you must regenerate the TypeScript client so your code has accurate types. Migration does this automatically, but it's good to know the standalone command.

**Commands:** (run from `backend/`)
```
npx prisma generate
```

**Expected result:** "Generated Prisma Client" message with the output path.

**Verify:** TypeScript autocompletion in your editor shows `prisma.user`, `prisma.inventory`, etc.

---

## Step B8 — Create and run the seed script

**WHY:** The database starts empty. You need at least one owner account to log in. The seed script creates that account with a hashed password.

Create `backend/prisma/seed.ts` with:
- An owner user: `owner@autopartspro.com`, password `admin123` (hashed with bcrypt)
- Optionally: the 8 mock inventory items for demo purposes

Add to `backend/package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

**Commands:** (run from `backend/`)
```
npm run db:seed
```

**Files affected:**
- `backend/prisma/seed.ts` — created
- Database: owner user + inventory items inserted

**Expected result:** Seed script prints success messages for each record created.

**Verify:**
- Go to Supabase → Table Editor → users table
- Owner account should appear with a hashed password (not plaintext)

---

# PHASE C — EXPRESS SERVER IMPLEMENTATION

---

## Step C1 — Create env config module

**WHY:** Instead of accessing `process.env.X` scattered throughout the code, one module validates all required variables at startup and exports typed constants. If a variable is missing, the server refuses to start with a clear error message.

Create `backend/src/config/env.ts`.

**Files affected:**
- `backend/src/config/env.ts` — created

**Verify:** Import and run it — any missing variable should throw a descriptive error immediately.

---

## Step C2 — Create Prisma singleton

**WHY:** One database connection pool for the whole app. Prevents "too many connections" errors that occur when multiple instances are created during hot-reload.

Create `backend/src/lib/prisma.ts`.

**Files affected:**
- `backend/src/lib/prisma.ts` — created

**Verify:** Can be imported in a test file and `prisma.user.findMany()` runs without error.

---

## Step C3 — Create middleware files

**WHY:** Middleware is reusable logic that runs before route handlers. Creating these files before routes means routes can import them immediately.

Create in order:
1. `backend/src/types/express.d.ts` — extends `req.user` type
2. `backend/src/types/index.ts` — AppError class and shared types
3. `backend/src/middleware/auth.middleware.ts` — JWT verification
4. `backend/src/middleware/requireRole.middleware.ts` — OWNER check
5. `backend/src/middleware/validate.middleware.ts` — Zod validation
6. `backend/src/middleware/error.middleware.ts` — global error handler

**Files affected:** 6 new files created.

**Verify:** Each file compiles without TypeScript errors (`npx tsc --noEmit`).

---

## Step C4 — Create auth module

**WHY:** Authentication must exist before any other module — all other routes depend on it. Build it first and verify it works in isolation before adding inventory/sales.

Create in order:
1. `backend/src/modules/auth/auth.schema.ts` — Zod schemas for login
2. `backend/src/modules/auth/auth.service.ts` — login, getMe business logic
3. `backend/src/modules/auth/auth.controller.ts` — HTTP handlers
4. `backend/src/modules/auth/auth.routes.ts` — route definitions

**Files affected:** 4 new files.

**Verify (after Step C7):** POST /api/v1/auth/login with correct credentials returns 200 + token.

---

## Step C5 — Create inventory module

**WHY:** Inventory is the core of the app. Sales depend on it. Build it after auth.

Create in order:
1. `backend/src/modules/inventory/inventory.schema.ts`
2. `backend/src/modules/inventory/inventory.service.ts`
3. `backend/src/modules/inventory/inventory.controller.ts`
4. `backend/src/modules/inventory/inventory.routes.ts`

**Files affected:** 4 new files.

---

## Step C6 — Create sales module

**WHY:** Sales reference inventory items. The `createSale` service uses a Prisma transaction to insert the sale and decrement stock atomically.

Create in order:
1. `backend/src/modules/sales/sales.schema.ts`
2. `backend/src/modules/sales/sales.service.ts` — includes Prisma transaction
3. `backend/src/modules/sales/sales.controller.ts`
4. `backend/src/modules/sales/sales.routes.ts`

**Files affected:** 4 new files.

---

## Step C7 — Create remaining modules and wire everything in app.ts

**WHY:** Reports, activity, and users modules follow the same pattern. Once all modules exist, they're all registered in `app.ts`.

Create:
1. Reports module (4 files)
2. Activity module (4 files)  
3. Users module (4 files)
4. `backend/src/app.ts` — registers all middleware and routes
5. `backend/src/index.ts` — starts the server

**Commands:** (run from `backend/`)
```
npm run dev
```

**Expected result:**
```
Server running on http://localhost:3001
Database connected
```

**Verify:** Open browser → `http://localhost:3001/api/v1/auth/login` should return a 405 (Method Not Allowed — GET on a POST route), which confirms the server is running and routing correctly.

---

## Step C8 — Test all API routes manually

**WHY:** Before connecting the frontend, verify every route works correctly using a REST client. This isolates backend bugs from frontend bugs.

**Tool:** Use VS Code extension "Thunder Client" or install Postman.

Test sequence:
1. POST /auth/login → get token
2. GET /auth/me (with token) → get user
3. GET /inventory (with token) → get all items
4. POST /inventory (with token, owner) → create item
5. PATCH /inventory/:id → edit item
6. DELETE /inventory/:id → delete item
7. POST /sales → create sale, verify inventory stock decremented
8. GET /sales → list sales
9. GET /reports/summary → financial summary
10. GET /activity → activity logs

**Expected result:** Every route returns the correct HTTP status and JSON shape defined in `API_ROUTES_PLAN.md`.

---

# PHASE D — FRONTEND API INTEGRATION

---

## Step D1 — Add frontend environment variable

**WHY:** The frontend needs to know the backend URL. Hardcoding `localhost:3001` everywhere means it breaks in production. Environment variables make it configurable.

Create `frontend/.env` (if it doesn't exist):
```
VITE_API_URL=http://localhost:3001/api/v1
```

Create `frontend/.env.example`:
```
VITE_API_URL=
```

**Files affected:**
- `frontend/.env` — created
- `frontend/.env.example` — created

**Verify:** In any frontend file, `import.meta.env.VITE_API_URL` should equal `http://localhost:3001/api/v1`.

---

## Step D2 — Create the API client

**WHY:** Every React Query hook will call the backend. A centralized `api.ts` file handles the Authorization header, base URL, and error parsing in one place — so individual hooks stay clean.

Create `frontend/src/lib/api.ts`.

This file exports functions like:
```typescript
api.get("/inventory")          // GET with auth header
api.post("/sales", body)       // POST with auth header + body
api.patch("/inventory/id", body)
api.delete("/inventory/id")
```

Internally each function:
1. Reads the token from the module-level variable (set on login)
2. Calls `fetch(VITE_API_URL + path, { headers: { Authorization: "Bearer " + token } })`
3. Parses JSON
4. Throws on non-2xx responses (so React Query catches it)

**Files affected:**
- `frontend/src/lib/api.ts` — created

**Verify:** Can import `api` and call `api.get("/inventory")` — returns a Promise.

---

## Step D3 — Rewrite AuthContext

**WHY:** The current `AuthContext.tsx` uses hardcoded mock credentials. Replace the internals to call the Express API. The public interface (`useAuth()`, `user`, `login()`, `logout()`) stays identical so no pages need to change.

**Files affected:**
- `frontend/src/contexts/AuthContext.tsx` — internal logic rewritten

Changes summary (from `AUTHENTICATION_PLAN.md` Section 6):
- `login()` → calls `POST /api/v1/auth/login`
- `logout()` → calls `POST /api/v1/auth/logout` + clears state
- `useEffect` startup → calls `GET /api/v1/auth/me` to validate stored token

**Verify:**
1. Start both servers (frontend + backend)
2. Open the app at `http://localhost:5173`
3. Login with `owner@autopartspro.com` / `admin123`
4. Dashboard loads
5. Refresh page → still logged in (token re-validated via /auth/me)
6. Sign out → returns to login

---

## Step D4 — Create React Query hooks for inventory

**WHY:** React Query manages fetching, caching, loading states, and refetching automatically. Each hook wraps one API call.

Create `frontend/src/hooks/useInventory.ts`:
- `useInventoryList()` — `useQuery` calling `GET /api/v1/inventory`
- `useCreateInventory()` — `useMutation` calling `POST /api/v1/inventory`
- `useUpdateInventory()` — `useMutation` calling `PATCH /api/v1/inventory/:id`
- `useDeleteInventory()` — `useMutation` calling `DELETE /api/v1/inventory/:id`

Each mutation invalidates `['inventory']` query on success so the list refreshes.

**Files affected:**
- `frontend/src/hooks/useInventory.ts` — created

---

## Step D5 — Create React Query hooks for sales

Create `frontend/src/hooks/useSales.ts`:
- `useSalesList()` — `useQuery` calling `GET /api/v1/sales`
- `useTodaySales()` — `useQuery` calling `GET /api/v1/sales/today`
- `useCreateSale()` — `useMutation` calling `POST /api/v1/sales`
  - On success: invalidates `['sales']` AND `['inventory']` (stock changed)

**Files affected:**
- `frontend/src/hooks/useSales.ts` — created

---

## Step D6 — Update InventoryContext to use real data

**WHY:** The existing `InventoryContext.tsx` uses `useState(mockInventory)`. Replace the state with React Query. The context's public interface stays the same.

Changes:
- Remove `useState(mockInventory)`
- Call `useInventoryList()` for data
- Call `useCreateInventory()`, `useUpdateInventory()`, `useDeleteInventory()` for mutations
- `isLoading` and `isError` passed through context for skeleton/error states
- `decrementStock()` is no longer needed client-side (server handles it atomically)

**Files affected:**
- `frontend/src/contexts/InventoryContext.tsx` — internals updated

**Verify:** InventoryPage shows real data from the database. Add a part → it persists on refresh.

---

## Step D7 — Update SalesContext to use real data

Similar to D6 for sales.

Changes:
- Remove `useState(mockSales)`
- Call `useTodaySales()` for dashboard, `useSalesList()` for sales page
- Call `useCreateSale()` for new sales
- `addSale()` no longer calls `decrementStock()` (server handles it)

**Files affected:**
- `frontend/src/contexts/SalesContext.tsx` — internals updated

**Verify:** New Sale form saves to database. Inventory stock decrements correctly. Dashboard stats reflect real data.

---

## Step D8 — Add loading and error states

**WHY:** Now that data comes from the network, there will be a brief loading period. Without skeleton loaders, the page looks broken. Without error states, network failures silently show nothing.

For each data-fetching page:
- Show a `TableSkeleton` component while `isLoading === true`
- Show an error message with a retry button when `isError === true`

**Files affected:**
- `frontend/src/components/TableSkeleton.tsx` — new component
- `frontend/src/pages/InventoryPage.tsx` — add loading/error handling
- `frontend/src/pages/SalesPage.tsx` — add loading/error handling
- `frontend/src/pages/DashboardPage.tsx` — add loading state for stat cards

**Verify:** In browser DevTools → Network tab → throttle to Slow 3G → skeletons should be visible while loading.

---

## Step D9 — Wire up remaining pages

Connect Reports, Activity, and Settings pages to the API:

- **ReportsPage** — call `GET /reports/summary`, add recharts bar chart
- **ActivityPage** — call `GET /activity`, live data replaces mock logs
- **SettingsPage** — call `GET /users`, `POST /users`, `PATCH /users/:id/password`

**Files affected:**
- `frontend/src/pages/ReportsPage.tsx`
- `frontend/src/pages/ActivityPage.tsx`
- `frontend/src/pages/SettingsPage.tsx`
- `frontend/src/hooks/useReports.ts` — new
- `frontend/src/hooks/useActivity.ts` — new
- `frontend/src/hooks/useUsers.ts` — new

---

# PHASE E — TESTING

---

## Step E1 — Backend unit tests

**WHY:** Service functions contain all business logic. Unit tests verify correctness without needing a real database.

Test files to create in `backend/src/modules/*/`:
- `auth.service.test.ts` — test login logic, password comparison
- `inventory.service.test.ts` — test CRUD, role-based field filtering
- `sales.service.test.ts` — test stock guard (should reject overselling)

**Commands:** (run from `backend/`)
```
npm run test
```

**Expected result:** All tests pass, stock guard test confirms a 409 is thrown when qty > stock.

---

## Step E2 — Backend integration tests

Test full HTTP request/response cycles using Supertest:

Key tests:
- POST /auth/login → 200 with token
- POST /auth/login bad credentials → 401
- GET /inventory without token → 401
- POST /inventory as worker → 403
- POST /sales with stock=1, qty=2 → 409

---

## Step E3 — Frontend tests

Update existing `frontend/src/test/example.test.ts` and add:
- Test that `InventoryPage` renders skeleton while loading
- Test that search filter works
- Test form validation (empty fields, negative prices)

---

# PHASE F — DEPLOYMENT

---

## Step F1 — Prepare backend for production build

**WHY:** The dev server uses `tsx` to run TypeScript directly. Production runs compiled JavaScript via `node dist/index.js`.

**Commands:** (run from `backend/`)
```
npm run build
```

**Expected result:** `backend/dist/` folder created with compiled `.js` files.

**Verify:** `node dist/index.js` starts the server (after setting `NODE_ENV=production` and providing env vars).

---

## Step F2 — Deploy backend to Render (recommended free tier)

**WHY:** Render is a free cloud platform for Node.js servers. It connects to GitHub and redeploys automatically on push.

Steps:
1. Push the `backend/` folder to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set root directory: `backend`
5. Build command: `npm install && npm run build && npx prisma migrate deploy`
6. Start command: `npm run start`
7. Add all environment variables from `.env` in Render's dashboard
8. Deploy

**Expected result:** Backend URL like `https://autopartspro-api.onrender.com`

---

## Step F3 — Update frontend environment for production

Update `frontend/.env.production` (or Vercel env vars):
```
VITE_API_URL=https://autopartspro-api.onrender.com/api/v1
```

---

## Step F4 — Deploy frontend to Vercel

Follow the existing `DEPLOYMENT_GUIDE.md`. The only new step is adding `VITE_API_URL` to Vercel's environment variables.

---

# SUMMARY TABLE

| Phase | Steps | Estimated time | Status |
|---|---|---|---|
| A — Backend project setup | A1–A7 | 45 minutes | ⬜ Not started |
| B — Database setup | B1–B8 | 60 minutes | ⬜ Not started |
| C — Express server | C1–C8 | 3–4 hours | ⬜ Not started |
| D — Frontend integration | D1–D9 | 3–4 hours | ⬜ Not started |
| E — Testing | E1–E3 | 2–3 hours | ⬜ Not started |
| F — Deployment | F1–F4 | 1–2 hours | ⬜ Not started |
| **Total** | **38 steps** | **~12 hours** | |

---

# IMPORTANT: What changes vs the old plan

The original `MASTER_IMPLEMENTATION_PLAN.md` assumed direct Supabase integration from the frontend. That approach is **replaced entirely** by this roadmap. Key differences:

| Old plan (direct Supabase) | New plan (Express + Prisma) |
|---|---|
| `src/lib/supabase.ts` in frontend | `src/lib/prisma.ts` in backend only |
| `supabase.auth.signInWithPassword()` | `POST /api/v1/auth/login` |
| Frontend RLS policies | Backend middleware (authMiddleware, requireOwner) |
| Direct table queries from React | React Query hooks → Express API |
| Supabase JS client in frontend | `fetch()` via `api.ts` in frontend |
| No business logic layer | Express services contain all logic |

The frontend mock data (`src/data/mockData.ts`) and contexts remain the architecture until Step D6/D7 when they are replaced with real API hooks.
