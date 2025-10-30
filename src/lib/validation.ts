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
    throw new ValidationError(`${fieldName} must be at least ${options.minLength} characters`);
  }

  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${options.maxLength} characters`);
  }

  if (options?.pattern && !options.pattern.test(value)) {
    throw new ValidationError(`${fieldName} has invalid format`);
  }

  if (options?.enum && !options.enum.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${options.enum.join(', ')}`);
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
    throw new ValidationError(`${fieldName} must have at least ${options.minLength} items`);
  }

  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    throw new ValidationError(`${fieldName} must have at most ${options.maxLength} items`);
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
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Validate and sanitize object with schema
 */
export function validateObject<T extends Record<string, unknown>>(
  value: unknown,
  schema: {
    [K in keyof T]: (value: unknown) => T[K];
  }
): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError('Invalid object');
  }

  const result = {} as T;
  const obj = value as Record<string, unknown>;

  for (const [key, validator] of Object.entries(schema)) {
    try {
      result[key as keyof T] = validator(obj[key]);
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw new ValidationError(`Validation failed for field: ${key}`);
    }
  }

  return result;
}

/**
 * Parse and validate JSON body
 */
export async function parseAndValidateJson<T>(
  request: Request,
  validator: (data: unknown) => T
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new ValidationError('Invalid JSON body');
  }

  return validator(body);
}
