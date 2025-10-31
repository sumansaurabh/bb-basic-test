/**
 * Request validation utilities
 */

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  field?: string;
}

/**
 * Validates and sanitizes numeric input with bounds
 */
export function validateNumber(
  value: unknown,
  options: {
    min?: number;
    max?: number;
    defaultValue?: number;
    fieldName?: string;
  } = {}
): ValidationResult<number> {
  const { min, max, defaultValue, fieldName = 'value' } = options;

  // Handle undefined/null with default
  if (value === undefined || value === null) {
    if (defaultValue !== undefined) {
      return { success: true, data: defaultValue };
    }
    return { 
      success: false, 
      error: `${fieldName} is required`,
      field: fieldName 
    };
  }

  // Convert to number
  const num = typeof value === 'number' ? value : Number(value);

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return { 
      success: false, 
      error: `${fieldName} must be a valid number`,
      field: fieldName 
    };
  }

  // Check bounds
  if (min !== undefined && num < min) {
    return { 
      success: false, 
      error: `${fieldName} must be at least ${min}`,
      field: fieldName 
    };
  }

  if (max !== undefined && num > max) {
    return { 
      success: false, 
      error: `${fieldName} must be at most ${max}`,
      field: fieldName 
    };
  }

  return { success: true, data: num };
}

/**
 * Validates string input with length constraints
 */
export function validateString(
  value: unknown,
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowedValues?: string[];
    fieldName?: string;
  } = {}
): ValidationResult<string> {
  const { minLength, maxLength, pattern, allowedValues, fieldName = 'value' } = options;

  if (typeof value !== 'string') {
    return { 
      success: false, 
      error: `${fieldName} must be a string`,
      field: fieldName 
    };
  }

  if (minLength !== undefined && value.length < minLength) {
    return { 
      success: false, 
      error: `${fieldName} must be at least ${minLength} characters`,
      field: fieldName 
    };
  }

  if (maxLength !== undefined && value.length > maxLength) {
    return { 
      success: false, 
      error: `${fieldName} must be at most ${maxLength} characters`,
      field: fieldName 
    };
  }

  if (pattern && !pattern.test(value)) {
    return { 
      success: false, 
      error: `${fieldName} has invalid format`,
      field: fieldName 
    };
  }

  if (allowedValues && !allowedValues.includes(value)) {
    return { 
      success: false, 
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      field: fieldName 
    };
  }

  return { success: true, data: value };
}

/**
 * Safely parse JSON with error handling
 */
export async function safeParseJSON<T = unknown>(
  request: Request
): Promise<ValidationResult<T>> {
  try {
    const contentType = request.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      return {
        success: false,
        error: 'Content-Type must be application/json',
      };
    }

    const data = await request.json();
    return { success: true, data: data as T };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}
