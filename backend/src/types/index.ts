// src/types/index.ts
// Shared backend types used across modules.

// Custom error class — services throw this with a specific HTTP status code.
// The global error handler catches it and sends the right response.
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Shape attached to req.user after JWT verification
export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "WORKER";
}
