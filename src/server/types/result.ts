/**
 * Result types for consistent API responses
 * refactor(result): unify Result helpers & DomainError
 */

// Domain error types
export interface DomainError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string; // For validation errors
}

// Common error codes
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  REQUIRED_FIELD_MISSING = "REQUIRED_FIELD_MISSING",

  // User management
  USER_NOT_FOUND = "USER_NOT_FOUND",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  EMAIL_ALREADY_TAKEN = "EMAIL_ALREADY_TAKEN",
  INVALID_ROLE = "INVALID_ROLE",
  ROLE_CHANGE_NOT_ALLOWED = "ROLE_CHANGE_NOT_ALLOWED",

  // Business logic
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
  BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",

  // System
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

// Discriminated union for Result type
type Ok<T> = {
  success: true;
  data: T;
  statusCode?: number; // Optional for success
};

type Err = {
  success: false;
  error: DomainError;
  statusCode: number; // Required for errors
};

export type Result<T = unknown> = Ok<T> | Err;

// Success result factory
export function ok<T>(data: T, statusCode?: number): Result<T> {
  return statusCode !== undefined
    ? { success: true, data, statusCode }
    : { success: true, data };
}

// Error result factory (internal helper)
function err(
  code: string,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
): Err {
  return {
    success: false,
    error: { code, message, details },
    statusCode,
  };
}

// Legacy fail function for backward compatibility
export function fail(
  error: DomainError,
  statusCode: number = 400
): Result<never> {
  return {
    success: false,
    error,
    statusCode,
  };
}

// Helper functions for common errors
export function unauthorized(
  message: string = "Unauthorized",
  details?: Record<string, unknown>
): Result<never> {
  return err(ErrorCode.UNAUTHORIZED, message, 401, details);
}

export function forbidden(
  message: string = "Forbidden",
  details?: Record<string, unknown>
): Result<never> {
  return err(ErrorCode.FORBIDDEN, message, 403, details);
}

export function notFound(
  resource: string = "Resource",
  id?: string
): Result<never> {
  const message = id
    ? `${resource} with id '${id}' not found`
    : `${resource} not found`;
  return err(ErrorCode.RESOURCE_NOT_FOUND, message, 404);
}

export function validationError(
  message: string,
  field?: string,
  details?: Record<string, unknown>
): Result<never> {
  const error: DomainError = {
    code: ErrorCode.VALIDATION_ERROR,
    message,
    field,
    details,
  };
  return { success: false, error, statusCode: 400 };
}

export function badRequest(
  message: string,
  details?: Record<string, unknown>
): Result<never> {
  return err(ErrorCode.INVALID_INPUT, message, 400, details);
}

export function conflict(
  message: string,
  details?: Record<string, unknown>
): Result<never> {
  return err(ErrorCode.RESOURCE_ALREADY_EXISTS, message, 409, details);
}

export function internalError(
  message: string = "Internal server error",
  details?: Record<string, unknown>
): Result<never> {
  return err(ErrorCode.INTERNAL_ERROR, message, 500, details);
}

// Type guard for checking if result is successful
export function isSuccess<T>(result: Result<T>): result is Result<T> & { success: true; data: T } {
  return result.success;
}

// Type guard for checking if result is an error
export function isError<T>(result: Result<T>): result is Result<T> & { success: false; error: DomainError } {
  return !result.success;
}
