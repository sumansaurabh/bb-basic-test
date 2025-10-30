/**
 * Request validation utilities
 */

import { ValidationError } from './errors';

/**
 * Validate that a value is a number within range
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  options?: {
    min?: number;
    max?: number;
    integer?: boolean;
  }
): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }

  if (options?.integer && !Number.isInteger(value)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }

  if (options?.min !== undefined && value < options.min) {
    throw new ValidationError(`${fieldName} must be at least ${options.min}`);
  }

  if (options?.max !== undefined && value > options.max) {
    throw new ValidationError(`${fieldName} must be at most ${options.max}`);
  }

  return value;
}

/**
 * Validate that a value is a string with length constraints
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: string[];
  }
): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  if (options?.minLength !== undefined && value.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.minLength} characters`
    );
  }

  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.maxLength} characters`
    );
  }

  if (options?.pattern && !options.pattern.test(value)) {
    throw new ValidationError(`${fieldName} has invalid format`);
  }

  if (options?.enum && !options.enum.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${options.enum.join(', ')}`
    );
  }

  return value;
}

/**
 * Validate that a value is a boolean
 */
export function validateBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${fieldName} must be a boolean`);
  }
  return value;
}

/**
 * Validate that a value is an array
 */
export function validateArray<T>(
  value: unknown,
  fieldName: string,
  options?: {
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: unknown, index: number) => T;
  }
): T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }

  if (options?.minLength !== undefined && value.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must have at least ${options.minLength} items`
    );
  }

  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must have at most ${options.maxLength} items`
    );
  }

  if (options?.itemValidator) {
    return value.map((item, index) => options.itemValidator!(item, index));
  }

  return value as T[];
}

/**
 * Validate email format
 */
export function validateEmail(value: unknown, fieldName: string = 'email'): string {
  const email = validateString(value, fieldName);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new ValidationError(`${fieldName} must be a valid email address`);
  }

  return email;
}

/**
 * Validate URL format
 */
export function validateUrl(value: unknown, fieldName: string = 'url'): string {
  const url = validateString(value, fieldName);

  try {
    new URL(url);
    return url;
  } catch {
    throw new ValidationError(`${fieldName} must be a valid URL`);
  }
}

/**
 * Validate object has required fields
 */
export function validateObject<T extends Record<string, unknown>>(
  value: unknown,
  fieldName: string,
  requiredFields?: string[]
): T {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an object`);
  }

  if (requiredFields) {
    const obj = value as Record<string, unknown>;
    for (const field of requiredFields) {
      if (!(field in obj)) {
        throw new ValidationError(`${fieldName}.${field} is required`);
      }
    }
  }

  return value as T;
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Validate and sanitize JSON body
 */
export async function validateJsonBody<T>(
  request: Request,
  validator: (body: unknown) => T
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Invalid JSON body');
  }

  return validator(body);
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  /**
   * Validate pagination parameters
   */
  pagination: (params: unknown) => {
    const obj = validateObject(params, 'pagination');
    
    return {
      page: obj.page !== undefined
        ? validateNumber(obj.page, 'page', { min: 1, integer: true })
        : 1,
      limit: obj.limit !== undefined
        ? validateNumber(obj.limit, 'limit', { min: 1, max: 100, integer: true })
        : 10,
    };
  },

  /**
   * Validate sort parameters
   */
  sort: (params: unknown) => {
    const obj = validateObject(params, 'sort');
    
    return {
      field: obj.field !== undefined
        ? validateString(obj.field, 'field', { maxLength: 50 })
        : undefined,
      order: obj.order !== undefined
        ? validateString(obj.order, 'order', { enum: ['asc', 'desc'] })
        : 'asc',
    };
  },
};
