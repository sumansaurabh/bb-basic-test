/**
 * Request validation utilities
 */

import { ValidationError } from './errors';

/**
 * Validate that a value is a number within a range
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
 * Validate that a value is a string with optional length constraints
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
 * Validate that an object has required fields
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  obj: unknown,
  requiredFields: string[]
): T {
  if (!obj || typeof obj !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const missingFields = requiredFields.filter(
    (field) => !(field in obj) || (obj as Record<string, unknown>)[field] === undefined
  );

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }

  return obj as T;
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Validate and parse JSON safely
 */
export function parseJsonSafely<T = unknown>(
  jsonString: string,
  fieldName: string = 'JSON'
): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    throw new ValidationError(`${fieldName} must be valid JSON`);
  }
}

/**
 * Create a validator function for a specific schema
 */
export function createValidator<T>(
  schema: Record<string, (value: unknown) => unknown>
): (data: unknown) => T {
  return (data: unknown): T => {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Data must be an object');
    }

    const validated: Record<string, unknown> = {};

    for (const [key, validator] of Object.entries(schema)) {
      const value = (data as Record<string, unknown>)[key];
      validated[key] = validator(value);
    }

    return validated as T;
  };
}
