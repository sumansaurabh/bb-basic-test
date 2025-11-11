/**
 * Input validation utilities for API endpoints
 */

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates that a value is a number within specified bounds
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  options?: { min?: number; max?: number; required?: boolean }
): number {
  if (value === undefined || value === null) {
    if (options?.required) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return options?.min ?? 0;
  }

  const num = typeof value === 'string' ? parseFloat(value) : Number(value);

  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName);
  }

  if (options?.min !== undefined && num < options.min) {
    throw new ValidationError(`${fieldName} must be at least ${options.min}`, fieldName);
  }

  if (options?.max !== undefined && num > options.max) {
    throw new ValidationError(`${fieldName} must be at most ${options.max}`, fieldName);
  }

  return num;
}

/**
 * Validates that a value is a string within specified length bounds
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options?: { minLength?: number; maxLength?: number; required?: boolean; pattern?: RegExp }
): string {
  if (value === undefined || value === null || value === '') {
    if (options?.required) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return '';
  }

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }

  if (options?.minLength !== undefined && value.length < options.minLength) {
    throw new ValidationError(`${fieldName} must be at least ${options.minLength} characters`, fieldName);
  }

  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${options.maxLength} characters`, fieldName);
  }

  if (options?.pattern && !options.pattern.test(value)) {
    throw new ValidationError(`${fieldName} has invalid format`, fieldName);
  }

  return value;
}

/**
 * Validates that a value is one of the allowed enum values
 */
export function validateEnum<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[],
  options?: { required?: boolean }
): T | undefined {
  if (value === undefined || value === null) {
    if (options?.required) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }

  if (!allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName
    );
  }

  return value as T;
}

/**
 * Safely parses JSON with error handling
 */
export async function parseJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    throw new ValidationError('Invalid JSON in request body');
  }
}
