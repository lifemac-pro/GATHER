import { z, ZodSchema, ZodError } from 'zod';
import { useState, useCallback } from 'react';

/**
 * Form validation error type
 */
export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Form validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: Record<string, string>;
}

/**
 * Validate data against a Zod schema
 */
export function validateWithZod<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const validData = schema.parse(data);
    return {
      success: true,
      data: validData,
      errors: {},
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string> = {};

      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });

      return {
        success: false,
        errors,
      };
    }

    // For non-Zod errors, return a generic error
    return {
      success: false,
      errors: {
        _form: 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Hook for form validation with Zod
 */
export function useZodForm<T>(schema: ZodSchema<T>, initialValues: Partial<T> = {}) {
  const [data, setData] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(<K extends keyof T>(
    key: K,
    value: T[K]
  ) => {
    setData(prev => ({
      ...prev,
      [key]: value,
    }));

    // Clear error for this field when it's updated
    if (errors[key as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key as string];
        return newErrors;
      });
    }
  }, [errors]);

  const validateField = useCallback(<K extends keyof T>(
    key: K,
    value: T[K]
  ) => {
    try {
      // Create a partial schema for just this field
      // Use a safer approach with type assertion
      const partialSchema = z.object({
        [key]: z.any()
      }) as unknown as ZodSchema<Pick<T, K>>;
      partialSchema.parse({ [key]: value });

      // Clear error for this field if validation passes
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key as string];
        return newErrors;
      });

      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        });

        setErrors(prev => ({
          ...prev,
          ...fieldErrors,
        }));

        return false;
      }

      return true;
    }
  }, [schema]);

  const validate = useCallback(() => {
    try {
      const validData = schema.parse(data);
      setErrors({});
      return {
        success: true,
        data: validData,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};

        error.errors.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });

        setErrors(newErrors);

        return {
          success: false,
          errors: newErrors,
        };
      }

      // For non-Zod errors, return a generic error
      const genericError = {
        _form: 'An unexpected error occurred',
      };

      setErrors(genericError);

      return {
        success: false,
        errors: genericError,
      };
    }
  }, [data, schema]);

  const handleSubmit = useCallback(
    (onSubmit: (data: T) => Promise<void> | void) => async (e: React.FormEvent) => {
      e.preventDefault();

      setIsSubmitting(true);

      const result = validate();

      if (result.success && result.data) {
        try {
          await onSubmit(result.data);
        } catch (error) {
          setErrors({
            _form: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
        }
      }

      setIsSubmitting(false);
    },
    [validate]
  );

  const reset = useCallback(() => {
    setData(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    data,
    errors,
    isSubmitting,
    setValue,
    validateField,
    validate,
    handleSubmit,
    reset,
  };
}

/**
 * Hook for handling form submission with API calls
 */
export function useFormSubmit<T, R = any>(
  apiCall: (data: T) => Promise<R>,
  options: {
    onSuccess?: (data: R) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (data: T) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const result = await apiCall(data);

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);

        if (options.onError) {
          options.onError(err instanceof Error ? err : new Error(errorMessage));
        }

        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [apiCall, options]
  );

  return {
    submit,
    isSubmitting,
    error,
    setError,
  };
}
