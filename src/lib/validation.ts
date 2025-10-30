/**
 * Request validation utilities
 */

import { ValidationError } from './errors';

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

export class Validator {
  /**
   * Validates that a value is not null or undefined
   */
  static required(value: unknown, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`);
    }
  }

  /**
   * Validates that a value is a string
   */
  static isString(value: unknown, fieldName: string): void {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`);
    }
  }

  /**
   * Validates that a value is a number
   */
  static isNumber(value: unknown, fieldName: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
  }

  /**
   * Validates that a value is a positive number
   */
  static isPositive(value: number, fieldName: string): void {
    if (value <= 0) {
      throw new ValidationError(`${fieldName} must be a positive number`);
    }
  }

  /**
   * Validates that a number is within a range
   */
  static inRange(value: number, min: number, max: number, fieldName: string): void {
    if (value < min || value > max) {
      throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
    }
  }

  /**
   * Validates that a string matches a pattern
   */
  static matches(value: string, pattern: RegExp, fieldName: string): void {
    if (!pattern.test(value)) {
      throw new ValidationError(`${fieldName} has invalid format`);
    }
  }

  /**
   * Validates that a value is one of allowed values
   */
  static isOneOf<T>(value: T, allowedValues: T[], fieldName: string): void {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`
      );
    }
  }

  /**
   * Validates that a string has minimum length
   */
  static minLength(value: string, min: number, fieldName: string): void {
    if (value.length < min) {
      throw new ValidationError(`${fieldName} must be at least ${min} characters long`);
    }
  }

  /**
   * Validates that a string has maximum length
   */
  static maxLength(value: string, max: number, fieldName: string): void {
    if (value.length > max) {
      throw new ValidationError(`${fieldName} must be at most ${max} characters long`);
    }
  }

  /**
   * Validates that a value is an array
   */
  static isArray(value: unknown, fieldName: string): void {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`);
    }
  }

  /**
   * Validates that an array is not empty
   */
  static notEmpty(value: unknown[], fieldName: string): void {
    if (value.length === 0) {
      throw new ValidationError(`${fieldName} must not be empty`);
    }
  }

  /**
   * Validates email format
   */
  static isEmail(value: string, fieldName: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email address`);
    }
  }

  /**
   * Validates URL format
   */
  static isUrl(value: string, fieldName: string): void {
    try {
      new URL(value);
    } catch {
      throw new ValidationError(`${fieldName} must be a valid URL`);
    }
  }

  /**
   * Validates that a value is a boolean
   */
  static isBoolean(value: unknown, fieldName: string): void {
    if (typeof value !== 'boolean') {
      throw new ValidationError(`${fieldName} must be a boolean`);
    }
  }

  /**
   * Validates that an object has required keys
   */
  static hasKeys(obj: object, keys: string[], fieldName: string): void {
    const objKeys = Object.keys(obj);
    const missingKeys = keys.filter(key => !objKeys.includes(key));
    
    if (missingKeys.length > 0) {
      throw new ValidationError(
        `${fieldName} is missing required keys: ${missingKeys.join(', ')}`
      );
    }
  }

  /**
   * Safe JSON parsing with validation
   */
  static parseJSON<T = unknown>(value: string, fieldName: string): T {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      throw new ValidationError(`${fieldName} must be valid JSON`);
    }
  }

  /**
   * Sanitize string input (basic XSS prevention)
   */
  static sanitizeString(value: string): string {
    return value
      .replace(/[<>]/g, '') // Remove < and >
      .trim();
  }

  /**
   * Validate and sanitize integer
   */
  static sanitizeInteger(value: unknown, defaultValue: number = 0): number {
    const num = parseInt(String(value), 10);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Validate and sanitize float
   */
  static sanitizeFloat(value: unknown, defaultValue: number = 0): number {
    const num = parseFloat(String(value));
    return isNaN(num) ? defaultValue : num;
  }
}

/**
 * Schema-based validation
 */
export interface ValidationSchema {
  [key: string]: (value: any) => void;
}

export function validateSchema<T extends Record<string, any>>(
  data: T,
  schema: ValidationSchema
): void {
  for (const [key, validator] of Object.entries(schema)) {
    if (key in data) {
      validator(data[key]);
    }
  }
}
