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
    throw new ValidationError(`${fieldName} must be a valid number`, {
      [fieldName]: 'Invalid number',
    });
  }

  if (options?.integer && !Number.isInteger(value)) {
    throw new ValidationError(`${fieldName} must be an integer`, {
      [fieldName]: 'Must be an integer',
    });
  }

  if (options?.min !== undefined && value < options.min) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.min}`,
      { [fieldName]: `Minimum value is ${options.min}` }
    );
  }

  if (options?.max !== undefined && value > options.max) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.max}`,
      { [fieldName]: `Maximum value is ${options.max}` }
    );
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
  }
): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, {
      [fieldName]: 'Invalid string',
    });
  }

  if (options?.minLength !== undefined && value.length < options.minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${options.minLength} characters`,
      { [fieldName]: `Minimum length is ${options.minLength}` }
    );
  }

  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${options.maxLength} characters`,
      { [fieldName]: `Maximum length is ${options.maxLength}` }
    );
  }

  if (options?.pattern && !options.pattern.test(value)) {
    throw new ValidationError(`${fieldName} has invalid format`, {
      [fieldName]: 'Invalid format',
    });
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
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      { [fieldName]: `Allowed values: ${allowedValues.join(', ')}` }
    );
  }

  return value as T;
}

/**
 * Validate email format
 */
export function validateEmail(value: unknown, fieldName: string = 'email'): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validateString(value, fieldName, { pattern: emailRegex });
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
export function parseJSON<T = unknown>(
  value: string,
  fieldName: string = 'JSON'
): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new ValidationError(`${fieldName} is not valid JSON`, {
      [fieldName]: 'Invalid JSON format',
    });
  }
}
