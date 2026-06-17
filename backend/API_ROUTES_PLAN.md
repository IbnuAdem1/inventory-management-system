# API ROUTES PLAN — AutoPartsPro
> Complete REST API specification for the Express backend

---

## Base URL

```
Development:  http://localhost:3001/api/v1
Production:   https://your-backend-domain.com/api/v1
```

---

## Authentication Header

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

Routes marked 🔓 are public. Routes marked 🔒 require a valid JWT.
Routes marked 👑 additionally require `role: OWNER`.

---

## 1. Auth Routes — `/api/v1/auth`

### POST /auth/login 🔓
Login with email and password. Returns a JWT token.

**Request body:**
```json
{
  "email": "owner@autopartspro.com",
  "password": "admin123"
}
```

**Success 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "owner@autopartspro.com",
    "name": "Owner",
    "role": "OWNER"
  }
}
```

**Error 401:**
```json
{ "message": "Invalid email or password" }
```

**Rate limit:** 10 requests per 15 minutes per IP.

---

### GET /auth/me 🔒
Returns the currently authenticated user's profile. Used on app startup to validate a stored token.

**Success 200:**
```json
{
  "id": "uuid",
  "email": "owner@autopartspro.com",
  "name": "Owner",
  "role": "OWNER"
}
```

**Error 401:**
```json
{ "message": "Invalid or expired token" }
```

---

### POST /auth/logout 🔒
Logs out the user. Since JWTs are stateless, this is handled on the frontend by discarding the token. The endpoint exists for completeness and to write an AUTH activity log entry.

**Success 200:**
```json
{ "message": "Logged out successfully" }
```

---

## 2. Inventory Routes — `/api/v1/inventory`

### GET /inventory 🔒
Returns all inventory items. WORKER role receives items without `costPrice`. OWNER role receives all fields.

**Query parameters (optional):**
- `search` — filter by name, brand, or compatibility
- `lowStock` — `true` to return only items where `stock <= minStock`

**Success 200:**
```json
[
  {
    "id": "uuid",
    "name": "Brake Pads",
    "brand": "Brembo",
    "compatibility": "Toyota Camry 2018-2023",
    "costPrice": 35.00,        // omitted for WORKER role
    "sellingPrice": 85.00,
    "stock": 2,
    "minStock": 10,
    "createdAt": "2026-06-16T10:00:00Z",
    "updatedAt": "2026-06-16T10:00:00Z"
  }
]
```

---

### GET /inventory/:id 🔒
Returns a single inventory item by ID. Same role-based field filtering.

**Success 200:** Single item object (same shape as above)
**Error 404:** `{ "message": "Inventory item not found" }`

---

### POST /inventory 🔒 👑
Creates a new inventory item. Owner only.

**Request body:**
```json
{
  "name": "Brake Pads",
  "brand": "Brembo",
  "compatibility": "Toyota Camry 2018-2023",
  "costPrice": 35.00,
  "sellingPrice": 85.00,
  "stock": 10,
  "minStock": 5
}
```

**Success 201:** Created item object
**Error 400:** Validation errors
**Error 403:** Worker trying to access owner-only route

**Side effect:** Writes an activity log entry (type: STOCK).

---

### PATCH /inventory/:id 🔒 👑
Updates an existing inventory item. Owner only. Partial updates — only send fields that change.

**Request body (all fields optional):**
```json
{
  "sellingPrice": 90.00,
  "stock": 15,
  "minStock": 8
}
```

**Success 200:** Updated item object
**Error 404:** Item not found
**Error 400:** Validation errors

**Side effect:** Writes an activity log entry (type: STOCK or PRICE depending on what changed).

---

### DELETE /inventory/:id 🔒 👑
Deletes an inventory item. Owner only. Returns 409 if the item has existing sales records (to protect data integrity).

**Success 200:** `{ "message": "Item deleted successfully" }`
**Error 404:** Item not found
**Error 409:** `{ "message": "Cannot delete item with existing sales records" }`

**Side effect:** Writes an activity log entry (type: STOCK).

---

## 3. Sales Routes — `/api/v1/sales`

### GET /sales 🔒
Returns all sales. WORKER role sees only their own sales. OWNER sees all.

**Query parameters (optional):**
- `date` — filter by date string `YYYY-MM-DD`
- `workerId` — filter by worker (owner only)
- `page` — pagination page (default: 1)
- `limit` — records per page (default: 50)

**Success 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "inventoryId": "uuid",
      "workerId": "uuid",
      "itemName": "Brake Pads - Toyota Camry",
      "customer": "Walk-in",
      "quantity": 1,
      "unitPrice": 85.00,
      "amount": 85.00,
      "paymentMethod": "CASH",
      "createdAt": "2026-06-16T10:32:00Z",
      "worker": { "id": "uuid", "name": "Ahmed" }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50
}
```

---

### GET /sales/today 🔒
Returns today's sales. Used by the Dashboard.

**Success 200:**
```json
{
  "sales": [...],
  "total": 351.00,
  "count": 5
}
```

---

### GET /sales/:id 🔒
Returns a single sale. Used for invoice generation.

**Success 200:** Single sale object (full detail)
**Error 404:** Sale not found

---

### POST /sales 🔒
Records a new sale. Atomically: inserts the sale record AND decrements inventory stock in a single Prisma transaction. If stock would go below 0, the entire transaction is rolled back and a 409 is returned.

**Request body:**
```json
{
  "inventoryId": "uuid",
  "quantity": 2,
  "paymentMethod": "CASH",
  "customer": "Walk-in"
}
```

**Success 201:**
```json
{
  "id": "uuid",
  "itemName": "Brake Pads - Toyota Camry",
  "quantity": 2,
  "unitPrice": 85.00,
  "amount": 170.00,
  "paymentMethod": "CASH",
  "customer": "Walk-in",
  "createdAt": "2026-06-16T10:32:00Z"
}
```

**Error 400:** Validation errors
**Error 404:** Inventory item not found
**Error 409:** `{ "message": "Insufficient stock. Available: 1, requested: 2" }`

**Side effects:**
- Decrements `inventory.stock` by `quantity`
- Writes activity log entry (type: SALE)

---

## 4. Reports Routes — `/api/v1/reports`

All report routes are OWNER only (👑).

### GET /reports/summary 🔒 👑
Returns aggregated financial data computed by the database.

**Query parameters:**
- `year` — 4-digit year (default: current year)

**Success 200:**
```json
{
  "year": 2026,
  "months": [
    {
      "month": 1,
      "monthName": "January",
      "revenue": 18200.00,
      "totalSales": 214,
      "expenses": 4500.00,
      "profit": 13700.00
    }
  ],
  "yearToDate": {
    "revenue": 64500.00,
    "totalSales": 628,
    "profit": 41400.00
  }
}
```

---

### GET /reports/top-items 🔒 👑
Returns top-selling inventory items by revenue.

**Query parameters:**
- `limit` — number of items (default: 5)
- `period` — `today`, `week`, `month`, `year` (default: `month`)

**Success 200:**
```json
[
  {
    "inventoryId": "uuid",
    "name": "Brake Pads",
    "brand": "Brembo",
    "totalSold": 42,
    "totalRevenue": 3570.00
  }
]
```

---

### GET /reports/payment-breakdown 🔒 👑
Returns sales totals grouped by payment method.

**Success 200:**
```json
{
  "CASH": 12400.00,
  "TRANSFER": 8900.00,
  "CREDIT": 3300.00
}
```

---

## 5. Activity Routes — `/api/v1/activity`

### GET /activity 🔒
Returns activity log entries. Workers see only their own. Owners see all.

**Query parameters (optional):**
- `date` — filter by date (default: today)
- `workerId` — filter by worker (owner only)
- `type` — filter by activity type (`SALE`, `STOCK`, `AUTH`, `PRICE`)
- `page`, `limit` — pagination

**Success 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "workerId": "uuid",
      "workerName": "Ahmed",
      "action": "Recorded sale",
      "detail": "Brake Pads x2 — $170.00",
      "type": "SALE",
      "createdAt": "2026-06-16T10:32:00Z"
    }
  ],
  "total": 87
}
```

---

## 6. Users Routes — `/api/v1/users`

All user management routes are OWNER only (👑).

### GET /users 🔒 👑
Returns all user accounts (workers + owner).

**Success 200:**
```json
[
  {
    "id": "uuid",
    "email": "ahmed@autopartspro.com",
    "name": "Ahmed",
    "role": "WORKER",
    "isActive": true,
    "createdAt": "2026-06-01T08:00:00Z"
  }
]
```

---

### POST /users 🔒 👑
Creates a new worker account.

**Request body:**
```json
{
  "email": "worker@autopartspro.com",
  "name": "New Worker",
  "password": "securePassword123",
  "role": "WORKER"
}
```

**Success 201:** User object (no passwordHash in response)
**Error 409:** `{ "message": "Email already in use" }`

---

### PATCH /users/:id 🔒 👑
Updates a user (name, email, role, isActive).

**Success 200:** Updated user object

---

### PATCH /users/:id/password 🔒
Workers can change their own password. Owners can change any user's password.

**Request body:**
```json
{
  "currentPassword": "old123",
  "newPassword": "new456"
}
```

**Success 200:** `{ "message": "Password updated successfully" }`

---

## 7. Standard Error Response Shape

All errors return JSON in this format:

```json
{
  "message": "Human-readable error description",
  "errors": [
    {
      "field": "sellingPrice",
      "message": "Selling price must be greater than 0"
    }
  ]
}
```

`errors` array is only present for validation errors (400).

---

## 8. HTTP Status Codes Used

| Code | When |
|---|---|
| 200 | Successful GET, PATCH, DELETE, POST /auth/logout |
| 201 | Successful POST (resource created) |
| 400 | Validation error (bad request body) |
| 401 | Missing or invalid JWT |
| 403 | Authenticated but insufficient role (worker accessing owner route) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, insufficient stock, delete with dependencies) |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error (logged, not leaked to client) |

---

## 9. Frontend Integration Map

| Frontend feature | API call |
|---|---|
| Login | POST /auth/login |
| App startup (restore session) | GET /auth/me |
| Sign out | POST /auth/logout + discard token |
| Dashboard stat cards | GET /sales/today + GET /inventory |
| Inventory table | GET /inventory |
| Add Part | POST /inventory |
| Edit Part | PATCH /inventory/:id |
| Delete Part | DELETE /inventory/:id |
| Low Stock Alerts | GET /inventory?lowStock=true |
| Sales table | GET /sales |
| Today's sales (dashboard) | GET /sales/today |
| New Sale | POST /sales |
| Invoice view | GET /sales/:id |
| Reports page | GET /reports/summary + GET /reports/top-items |
| Activity page | GET /activity |
| Worker list (NewSaleForm) | GET /users |
| Settings: manage workers | GET /users + POST /users + PATCH /users/:id |
| Settings: change password | PATCH /users/:id/password |
