/**
 * Input validation utilities
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
 * Validate that a value is a non-empty string
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  }
): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  if (value.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }

  if (options?.minLength && value.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.minLength} characters`
    );
  }

  if (options?.maxLength && value.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.maxLength} characters`
    );
  }

  if (options?.pattern && !options.pattern.test(value)) {
    throw new ValidationError(`${fieldName} has invalid format`);
  }

  return value;
}

/**
 * Validate that a value is one of the allowed values
 */
export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): T {
  if (typeof value !== 'string' || !allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }

  return value as T;
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
export function validateJSON<T = unknown>(
  value: string,
  fieldName: string = 'JSON data'
): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new ValidationError(`${fieldName} must be valid JSON`);
  }
}
