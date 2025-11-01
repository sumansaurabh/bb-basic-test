import { z } from 'zod';

/**
 * Validation schema for heavy processing POST request
 */
export const heavyProcessingSchema = z.object({
  iterations: z.number()
    .int('Iterations must be an integer')
    .min(1, 'Iterations must be at least 1')
    .max(50000, 'Iterations cannot exceed 50000')
    .optional()
    .default(1000),
  
  complexity: z.enum(['light', 'medium', 'heavy'], {
    message: 'Complexity must be one of: light, medium, heavy',
  })
    .optional()
    .default('medium'),
});

export type HeavyProcessingInput = z.infer<typeof heavyProcessingSchema>;

/**
 * Generic API error response schema
 */
export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  timestamp: z.string(),
  validationErrors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

/**
 * Validate request body against a schema
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod validation errors for API response
 * @param error Zod validation error
 * @returns Formatted validation errors
 */
export function formatValidationErrors(error: z.ZodError) {
  return error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
