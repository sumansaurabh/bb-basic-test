/**
 * Input validation utilities using TypeScript and runtime validation
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
}

/**
 * Base validator class
 */
abstract class BaseValidator<T> {
  protected errors: string[] = [];

  abstract validate(value: unknown): ValidationResult<T>;

  protected addError(message: string): void {
    this.errors.push(message);
  }

  protected clearErrors(): void {
    this.errors = [];
  }
}

/**
 * String validator
 */
export class StringValidator extends BaseValidator<string> {
  private minLength?: number;
  private maxLength?: number;
  private pattern?: RegExp;

  min(length: number): this {
    this.minLength = length;
    return this;
  }

  max(length: number): this {
    this.maxLength = length;
    return this;
  }

  regex(pattern: RegExp): this {
    this.pattern = pattern;
    return this;
  }

  email(): this {
    this.pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this;
  }

  validate(value: unknown): ValidationResult<string> {
    this.clearErrors();

    if (typeof value !== 'string') {
      this.addError('Value must be a string');
      return { success: false, errors: this.errors };
    }

    if (this.minLength !== undefined && value.length < this.minLength) {
      this.addError(`String must be at least ${this.minLength} characters long`);
    }

    if (this.maxLength !== undefined && value.length > this.maxLength) {
      this.addError(`String must be at most ${this.maxLength} characters long`);
    }

    if (this.pattern && !this.pattern.test(value)) {
      this.addError('String does not match required pattern');
    }

    return {
      success: this.errors.length === 0,
      data: this.errors.length === 0 ? value : undefined,
      errors: this.errors,
    };
  }
}

/**
 * Number validator
 */
export class NumberValidator extends BaseValidator<number> {
  private minValue?: number;
  private maxValue?: number;
  private isInteger = false;

  min(value: number): this {
    this.minValue = value;
    return this;
  }

  max(value: number): this {
    this.maxValue = value;
    return this;
  }

  integer(): this {
    this.isInteger = true;
    return this;
  }

  validate(value: unknown): ValidationResult<number> {
    this.clearErrors();

    if (typeof value !== 'number' || isNaN(value)) {
      this.addError('Value must be a valid number');
      return { success: false, errors: this.errors };
    }

    if (this.minValue !== undefined && value < this.minValue) {
      this.addError(`Number must be at least ${this.minValue}`);
    }

    if (this.maxValue !== undefined && value > this.maxValue) {
      this.addError(`Number must be at most ${this.maxValue}`);
    }

    if (this.isInteger && !Number.isInteger(value)) {
      this.addError('Number must be an integer');
    }

    return {
      success: this.errors.length === 0,
      data: this.errors.length === 0 ? value : undefined,
      errors: this.errors,
    };
  }
}

/**
 * Array validator
 */
export class ArrayValidator<T> extends BaseValidator<T[]> {
  private minItems?: number;
  private maxItems?: number;
  private itemValidator?: BaseValidator<T>;

  constructor(private itemType?: BaseValidator<T>) {
    super();
    this.itemValidator = itemType;
  }

  minLength(length: number): this {
    this.minItems = length;
    return this;
  }

  maxLength(length: number): this {
    this.maxItems = length;
    return this;
  }

  validate(value: unknown): ValidationResult<T[]> {
    this.clearErrors();

    if (!Array.isArray(value)) {
      this.addError('Value must be an array');
      return { success: false, errors: this.errors };
    }

    if (this.minItems !== undefined && value.length < this.minItems) {
      this.addError(`Array must have at least ${this.minItems} items`);
    }

    if (this.maxItems !== undefined && value.length > this.maxItems) {
      this.addError(`Array must have at most ${this.maxItems} items`);
    }

    const validatedItems: T[] = [];
    if (this.itemValidator) {
      for (let i = 0; i < value.length; i++) {
        const itemResult = this.itemValidator.validate(value[i]);
        if (!itemResult.success) {
          this.addError(`Item at index ${i}: ${itemResult.errors.join(', ')}`);
        } else if (itemResult.data !== undefined) {
          validatedItems.push(itemResult.data);
        }
      }
    } else {
      validatedItems.push(...(value as T[]));
    }

    return {
      success: this.errors.length === 0,
      data: this.errors.length === 0 ? validatedItems : undefined,
      errors: this.errors,
    };
  }
}

/**
 * Object validator
 */
export class ObjectValidator<T extends Record<string, any>> extends BaseValidator<T> {
  private schema: { [K in keyof T]: BaseValidator<T[K]> } = {} as any;

  shape(schema: { [K in keyof T]: BaseValidator<T[K]> }): this {
    this.schema = schema;
    return this;
  }

  validate(value: unknown): ValidationResult<T> {
    this.clearErrors();

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      this.addError('Value must be an object');
      return { success: false, errors: this.errors };
    }

    const validatedObject = {} as T;
    const obj = value as Record<string, unknown>;

    for (const [key, validator] of Object.entries(this.schema)) {
      const fieldResult = validator.validate(obj[key]);
      if (!fieldResult.success) {
        this.addError(`Field '${key}': ${fieldResult.errors.join(', ')}`);
      } else if (fieldResult.data !== undefined) {
        (validatedObject as any)[key] = fieldResult.data;
      }
    }

    return {
      success: this.errors.length === 0,
      data: this.errors.length === 0 ? validatedObject : undefined,
      errors: this.errors,
    };
  }
}

/**
 * Factory functions for creating validators
 */
export const v = {
  string: (): StringValidator => new StringValidator(),
  number: (): NumberValidator => new NumberValidator(),
  array: <T>(itemValidator?: BaseValidator<T>): ArrayValidator<T> => new ArrayValidator(itemValidator),
  object: <T extends Record<string, any>>(): ObjectValidator<T> => new ObjectValidator<T>(),
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  email: v.string().email(),
  positiveInteger: v.number().integer().min(1),
  pagination: v.object<{ page: number; limit: number }>().shape({
    page: v.number().integer().min(1),
    limit: v.number().integer().min(1).max(100),
  }),
  heavyProcessingRequest: v.object<{ iterations: number; complexity: string }>().shape({
    iterations: v.number().integer().min(1).max(50000),
    complexity: v.string().regex(/^(light|medium|heavy)$/),
  }),
};

/**
 * Validation middleware for API routes
 */
export function validateBody<T>(validator: BaseValidator<T>) {
  return (body: unknown): ValidationResult<T> => {
    return validator.validate(body);
  };
}

/**
 * Sanitization utilities
 */
export const sanitize = {
  html: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '');
  },

  filename: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9._-]/g, '');
  },

  numeric: (input: string): string => {
    return input.replace(/[^0-9.-]/g, '');
  },
};
