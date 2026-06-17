# BACKEND ARCHITECTURE — AutoPartsPro
> Node.js + Express + TypeScript + Prisma + Supabase PostgreSQL

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│              React + TypeScript + Tailwind                  │
│           @tanstack/react-query (HTTP only)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │  HTTP/JSON (REST)
                      │  Authorization: Bearer <JWT>
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXPRESS API SERVER                         │
│              Node.js + Express + TypeScript                 │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Routes  │  │Middleware│  │Controllers│  │ Services  │  │
│  │ /api/v1  │  │auth,cors,│  │Request   │  │Business   │  │
│  │          │  │validate, │  │handling  │  │Logic      │  │
│  │          │  │errors    │  │          │  │           │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                                    │                        │
│                             ┌──────────┐                   │
│                             │  Prisma  │                   │
│                             │   ORM    │                   │
│                             └──────────┘                   │
└─────────────────────────────────┬───────────────────────────┘
                                  │  Prisma Client (SQL)
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                SUPABASE PostgreSQL DATABASE                 │
│         (cloud-hosted, connection via DATABASE_URL)         │
│                                                             │
│  Tables: users, inventory, sales, activity_logs, expenses   │
└─────────────────────────────────────────────────────────────┘
```

**Key principle:** The React frontend NEVER talks to Supabase or PostgreSQL directly. It only speaks to the Express API. The API is the single gateway.

---

## 2. Architecture Decisions

### Decision 1: REST over GraphQL
REST is simpler to implement, easier to test with tools like Postman or Thunder Client, and more appropriate for a first full-stack project. Each endpoint maps cleanly to a CRUD operation.

### Decision 2: JWT (JSON Web Tokens) for Authentication
The Express backend issues a JWT when the user logs in. The React frontend stores this token and sends it with every request. The backend verifies it on every protected route. This is stateless — no sessions, no cookies.

### Decision 3: Prisma as the ORM
Prisma generates a type-safe client from your schema. TypeScript autocompletion works for all database queries. Safer than raw SQL for a learning context. Easy to run migrations.

### Decision 4: Layered Architecture (Routes → Controllers → Services → Prisma)
- **Routes** define URL paths and attach middleware
- **Controllers** receive the HTTP request, call services, send the response
- **Services** contain all business logic (calculating totals, validating stock levels, etc.)
- **Prisma** is only called from services — never directly from routes or controllers

This separation makes the code testable and maintainable.

### Decision 5: Supabase used ONLY as a PostgreSQL host
Supabase provides a managed PostgreSQL database. We use it purely for its connection string. We do NOT use the Supabase JS client, Supabase Auth, or Supabase RLS. Authentication is entirely handled by the Express backend.

### Decision 6: API versioning from the start
All routes are prefixed with `/api/v1/`. This allows a future `/api/v2/` without breaking existing clients.

---

## 3. Backend Folder Structure

```
backend/
├── package.json
├── tsconfig.json
├── .env                          (never committed)
├── .env.example
├── .gitignore
├── prisma/
│   ├── schema.prisma             (database schema + Prisma config)
│   └── migrations/               (auto-generated migration files)
│       └── 001_init/
│           └── migration.sql
├── src/
│   ├── index.ts                  (entry point — starts the server)
│   ├── app.ts                    (Express app setup, middleware, routes)
│   ├── config/
│   │   └── env.ts                (validates and exports env variables)
│   ├── lib/
│   │   └── prisma.ts             (Prisma client singleton)
│   ├── middleware/
│   │   ├── auth.middleware.ts    (JWT verification, attaches user to req)
│   │   ├── validate.middleware.ts (Zod request validation)
│   │   └── error.middleware.ts   (global error handler)
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts    (Zod validation schemas)
│   │   ├── inventory/
│   │   │   ├── inventory.routes.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts
│   │   │   └── inventory.schema.ts
│   │   ├── sales/
│   │   │   ├── sales.routes.ts
│   │   │   ├── sales.controller.ts
│   │   │   ├── sales.service.ts
│   │   │   └── sales.schema.ts
│   │   ├── reports/
│   │   │   ├── reports.routes.ts
│   │   │   ├── reports.controller.ts
│   │   │   └── reports.service.ts
│   │   └── activity/
│   │       ├── activity.routes.ts
│   │       ├── activity.controller.ts
│   │       └── activity.service.ts
│   └── types/
│       ├── express.d.ts          (extends Express Request with user property)
│       └── index.ts              (shared backend types)
```

---

## 4. Request/Response Flow (Example: Create a Sale)

```
1. React calls: POST /api/v1/sales
   Headers: { Authorization: "Bearer <token>", Content-Type: "application/json" }
   Body: { inventoryId, qty, payment, customer }

2. Express receives request
   → cors middleware: checks origin is allowed
   → express.json(): parses body
   → authMiddleware: verifies JWT, attaches req.user = { id, email, role }

3. Router matches POST /sales → SalesController.createSale

4. SalesController:
   → Calls validate middleware with SaleCreateSchema (Zod)
   → If invalid: returns 400 with validation errors
   → Calls SalesService.createSale(req.body, req.user)

5. SalesService:
   → Checks inventory item exists
   → Checks stock is sufficient (throws 409 if not)
   → Uses Prisma transaction:
       a. INSERT into sales
       b. UPDATE inventory SET stock = stock - qty
       c. INSERT into activity_logs
   → Returns created sale

6. SalesController:
   → Sends 201 JSON response with created sale

7. React receives JSON
   → React Query invalidates ['sales'] and ['inventory'] caches
   → UI updates automatically
```

---

## 5. Security Considerations

| Threat | Mitigation |
|---|---|
| Unauthorized access | JWT on every protected route, verified server-side |
| Password exposure | bcrypt hashing (cost factor 12) — never store plaintext |
| SQL injection | Prisma parameterizes all queries — immune by design |
| CORS abuse | Explicit CORS origin whitelist (only allow frontend URL) |
| Sensitive data exposure | Cost prices hidden from worker-role responses in service layer |
| Brute force login | Rate limiting on POST /auth/login (express-rate-limit) |
| Token theft | Short expiry (8h), store in memory (not localStorage) on frontend |
| Request flooding | General rate limiting on all routes |
| Unhandled errors | Global error handler catches everything, never leaks stack traces |
| Environment secrets | All secrets in .env, .env in .gitignore, never in source code |

---

## 6. Backend Dependencies

```json
"dependencies": {
  "express": "^4.18.2",
  "@prisma/client": "^5.10.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "zod": "^3.22.4",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.2.0",
  "helmet": "^7.1.0",
  "dotenv": "^16.4.5"
}

"devDependencies": {
  "typescript": "^5.4.2",
  "prisma": "^5.10.0",
  "ts-node": "^10.9.2",
  "tsx": "^4.7.1",
  "nodemon": "^3.1.0",
  "@types/express": "^4.17.21",
  "@types/bcryptjs": "^2.4.6",
  "@types/jsonwebtoken": "^9.0.6",
  "@types/cors": "^2.8.17",
  "@types/node": "^20.11.28",
  "vitest": "^1.4.0"
}
```

---

## 7. Testing Strategy

| Layer | What to test | Tool |
|---|---|---|
| Services | Business logic (stock guard, total calculation, role checks) | Vitest + mock Prisma |
| Controllers | HTTP status codes, response shapes | Supertest |
| Middleware | JWT verification, validation rejection | Supertest |
| Integration | Full flow: login → add sale → stock decremented | Supertest + test DB |

Testing priority for grading: at least unit tests for all service functions.

---

## 8. Risks and Rollback

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Supabase connection string changes | Low | High | Store in .env; easy to update |
| JWT secret exposed | Low | Critical | Rotate secret; all tokens invalidated immediately |
| Prisma migration failure | Medium | High | Always `prisma migrate dev` in dev first; never run in prod without backup |
| Port conflict (3001 in use) | Low | Low | Set PORT in .env; easy to change |
| CORS misconfiguration | Medium | Medium | Test from frontend immediately after setup |

**Rollback plan:** Each phase is committed separately. `git revert` or `git reset --hard <commit>` restores a working state. The frontend continues to work with mock data until backend is fully wired.
