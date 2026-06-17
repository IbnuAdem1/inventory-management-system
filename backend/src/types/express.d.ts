// src/types/express.d.ts
// Extends Express Request with the authenticated user shape.
// After authMiddleware runs, req.user is fully typed everywhere.

import { RequestUser } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
