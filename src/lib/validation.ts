/**
 * Input validation utilities for API endpoints
 */

import { ValidationError } from './errors';

export type ValidationRule<T> = {
  field: keyof T;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean;
  message?: string;
};

/**
 * Validate request body against rules
 */
export function validateBody<T extends Record<string, unknown>>(
  body: unknown,
  rules: ValidationRule<T>[]
): T {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be an object');
  }

  const data = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const field = String(rule.field);
    const value = data[field];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = rule.message || `${field} is required`;
      continue;
    }

    // Skip validation if not required and value is missing
    if (!rule.required && (value === undefined || value === null)) {
      continue;
    }

    // Check type
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors[field] = rule.message || `${field} must be of type ${rule.type}`;
        continue;
      }
    }

    // Check min/max for numbers
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors[field] = rule.message || `${field} must be at least ${rule.min}`;
        continue;
      }
      if (rule.max !== undefined && value > rule.max) {
        errors[field] = rule.message || `${field} must be at most ${rule.max}`;
        continue;
      }
    }

    // Check min/max for strings
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.min !== undefined && value.length < rule.min) {
        errors[field] = rule.message || `${field} must be at least ${rule.min} characters`;
        continue;
      }
      if (rule.max !== undefined && value.length > rule.max) {
        errors[field] = rule.message || `${field} must be at most ${rule.max} characters`;
        continue;
      }
    }

    // Check pattern for strings
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        errors[field] = rule.message || `${field} has invalid format`;
        continue;
      }
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      errors[field] = rule.message || `${field} failed custom validation`;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return data as T;
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(
  input: unknown,
  min?: number,
  max?: number,
  defaultValue?: number
): number {
  const num = Number(input);
  
  if (isNaN(num)) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new ValidationError('Invalid number');
  }

  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
