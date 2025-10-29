/**
 * Input validation utilities for API routes
 */

import { ValidationError } from './errors';

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export class Validator {
  /**
   * Validates that a value is a number within a range
   */
  static isNumberInRange(
    value: unknown,
    min: number,
    max: number,
    fieldName: string = 'value'
  ): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }

    if (value < min || value > max) {
      throw new ValidationError(
        `${fieldName} must be between ${min} and ${max}`,
        { value, min, max }
      );
    }

    return value;
  }

  /**
   * Validates that a value is one of the allowed values
   */
  static isOneOf<T>(
    value: unknown,
    allowedValues: T[],
    fieldName: string = 'value'
  ): T {
    if (!allowedValues.includes(value as T)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        { value, allowedValues }
      );
    }

    return value as T;
  }

  /**
   * Validates that a value is a non-empty string
   */
  static isNonEmptyString(value: unknown, fieldName: string = 'value'): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ValidationError(`${fieldName} must be a non-empty string`);
    }

    return value;
  }

  /**
   * Validates that a value is a valid email
   */
  static isEmail(value: unknown, fieldName: string = 'email'): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (typeof value !== 'string' || !emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email address`);
    }

    return value;
  }

  /**
   * Validates request body against a schema
   */
  static validateBody<T extends Record<string, unknown>>(
    body: unknown,
    requiredFields: (keyof T)[]
  ): T {
    if (!body || typeof body !== 'object') {
      throw new ValidationError('Request body must be a valid JSON object');
    }

    const missingFields = requiredFields.filter(
      field => !(field in body)
    );

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missingFields.join(', ')}`,
        { missingFields }
      );
    }

    return body as T;
  }

  /**
   * Sanitizes string input to prevent injection attacks
   */
  static sanitizeString(value: string): string {
    return value
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .slice(0, 1000); // Limit length
  }
}
