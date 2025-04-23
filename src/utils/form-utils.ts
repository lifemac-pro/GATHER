import { z } from "zod";

/**
 * Parse form data into an object
 */
export function parseFormData<T extends Record<string, any>>(
  formData: FormData,
): T {
  const data: Record<string, any> = {};

  formData.forEach((value, key) => {
    // Handle array fields (e.g., "tags[]")
    if (key.endsWith("[]")) {
      const arrayKey = key.slice(0, -2);
      if (!data[arrayKey]) {
        data[arrayKey] = [];
      }
      data[arrayKey].push(value);
    } else {
      data[key] = value;
    }
  });

  return data as T;
}

/**
 * Convert an object to FormData
 */
export function objectToFormData(obj: Record<string, any>): FormData {
  const formData = new FormData();

  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        formData.append(`${key}[]`, item);
      });
    } else if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === "object" && !(value instanceof Date)) {
      formData.append(key, JSON.stringify(value));
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

/**
 * Validate form data against a Zod schema
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData,
): { success: boolean; data?: T; errors?: Record<string, string> } {
  const data = parseFormData(formData);

  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};

      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });

      return { success: false, errors };
    }

    throw error;
  }
}

/**
 * Get form field error
 */
export function getFieldError(
  errors: Record<string, string> | undefined,
  name: string,
): string | undefined {
  return errors?.[name];
}

/**
 * Check if a form field has an error
 */
export function hasFieldError(
  errors: Record<string, string> | undefined,
  name: string,
): boolean {
  return !!getFieldError(errors, name);
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(
  errors: Record<string, string> | undefined,
): string[] {
  if (!errors) return [];
  return Object.values(errors);
}

/**
 * Create a form submission handler with validation
 */
export function createFormSubmitHandler<T>(
  schema: z.ZodSchema<T>,
  onSubmit: (data: T) => Promise<void> | void,
): (event: React.FormEvent<HTMLFormElement>) => Promise<void> {
  return async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const result = validateFormData(schema, formData);

    if (result.success && result.data) {
      await onSubmit(result.data);
    } else {
      // You can handle validation errors here
      console.error("Validation errors:", result.errors);
    }
  };
}
