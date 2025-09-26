/**
 * Result types for consistent API responses
 */

// Base result type
export interface Result<T = unknown> {
  success: boolean;
  data?: T;
  error?: DomainError;
  statusCode: number;
}

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

// Success result factory
export function ok<T>(data: T, statusCode: number = 200): Result<T> {
  return {
    success: true,
    data,
    statusCode,
  };
}

// Error result factory
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
export function unauthorized(message: string = "Unauthorized"): Result<never> {
  return fail(
    {
      code: ErrorCode.UNAUTHORIZED,
      message,
    },
    401
  );
}

export function forbidden(message: string = "Forbidden"): Result<never> {
  return fail(
    {
      code: ErrorCode.FORBIDDEN,
      message,
    },
    403
  );
}

export function notFound(
  resource: string = "Resource",
  id?: string
): Result<never> {
  const message = id 
    ? `${resource} with id '${id}' not found`
    : `${resource} not found`;
    
  return fail(
    {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message,
    },
    404
  );
}

export function validationError(
  message: string,
  field?: string,
  details?: Record<string, unknown>
): Result<never> {
  return fail(
    {
      code: ErrorCode.VALIDATION_ERROR,
      message,
      field,
      details,
    },
    400
  );
}

export function conflict(
  message: string,
  details?: Record<string, unknown>
): Result<never> {
  return fail(
    {
      code: ErrorCode.RESOURCE_ALREADY_EXISTS,
      message,
      details,
    },
    409
  );
}

export function internalError(
  message: string = "Internal server error",
  details?: Record<string, unknown>
): Result<never> {
  return fail(
    {
      code: ErrorCode.INTERNAL_ERROR,
      message,
      details,
    },
    500
  );
}

// Type guard for checking if result is successful
export function isSuccess<T>(result: Result<T>): result is Result<T> & { success: true; data: T } {
  return result.success;
}

// Type guard for checking if result is an error
export function isError<T>(result: Result<T>): result is Result<T> & { success: false; error: DomainError } {
  return !result.success;
}
