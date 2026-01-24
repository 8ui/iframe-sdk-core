import type { BaseError } from '../types';

/**
 * Create a standardized error object
 */
export const createError = (
  code: string,
  message: string,
  details?: Record<string, unknown>
): BaseError => {
  const error: BaseError = {
    code,
    message,
    timestamp: new Date().toISOString(),
  };

  if (details) {
    error.details = details;
  }

  return error;
};

/**
 * Check if an object is a BaseError
 */
export const isBaseError = (obj: any): obj is BaseError => {
  return (
    obj != null &&
    typeof obj === 'object' &&
    typeof obj.code === 'string' &&
    typeof obj.message === 'string'
  );
};

/**
 * Create a configuration error
 */
export const createConfigError = (
  field: string,
  reason: string
): BaseError => {
  return createError(
    'INVALID_CONFIG',
    `Configuration error: ${field} - ${reason}`,
    { field, reason }
  );
};

/**
 * Create a validation error
 */
export const createValidationError = (
  field: string,
  value: any,
  expected: string
): BaseError => {
  return createError(
    'VALIDATION_ERROR',
    `Validation failed for ${field}: expected ${expected}, got ${typeof value}`,
    { field, value, expected }
  );
};
