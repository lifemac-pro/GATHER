import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { z } from 'zod';
import { validateWithZod, useZodForm, useFormSubmit } from '@/utils/form-validation';

describe('validateWithZod', () => {
  const schema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    age: z.number().min(18, 'Must be at least 18 years old').optional(),
  });
  
  it('should return success and data for valid input', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    };
    
    const result = validateWithZod(schema, data);
    
    expect(result.success).toBe(true);
    expect(result.data).toEqual(data);
    expect(result.errors).toEqual({});
  });
  
  it('should return validation errors for invalid input', () => {
    const data = {
      name: 'Jo',
      email: 'invalid-email',
      age: 16,
    };
    
    const result = validateWithZod(schema, data);
    
    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toHaveProperty('name');
    expect(result.errors).toHaveProperty('email');
    expect(result.errors).toHaveProperty('age');
  });
  
  it('should handle non-Zod errors', () => {
    const mockSchema = {
      parse: () => {
        throw new Error('Not a Zod error');
      },
    };
    
    const result = validateWithZod(mockSchema as any, {});
    
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('_form', 'An unexpected error occurred');
  });
});

describe('useZodForm', () => {
  const schema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
  });
  
  it('should initialize with default values', () => {
    const initialValues = { name: 'John', email: '' };
    
    const { result } = renderHook(() => useZodForm(schema, initialValues));
    
    expect(result.current.data).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });
  
  it('should update values correctly', () => {
    const { result } = renderHook(() => useZodForm(schema));
    
    act(() => {
      result.current.setValue('name', 'John Doe');
    });
    
    expect(result.current.data.name).toBe('John Doe');
  });
  
  it('should validate a single field', () => {
    const { result } = renderHook(() => useZodForm(schema));
    
    act(() => {
      const isValid = result.current.validateField('name', 'Jo');
      expect(isValid).toBe(false);
    });
    
    expect(result.current.errors).toHaveProperty('name');
    
    act(() => {
      const isValid = result.current.validateField('name', 'John');
      expect(isValid).toBe(true);
    });
    
    expect(result.current.errors).not.toHaveProperty('name');
  });
  
  it('should validate the entire form', () => {
    const { result } = renderHook(() => useZodForm(schema));
    
    act(() => {
      result.current.setValue('name', 'Jo');
      result.current.setValue('email', 'invalid-email');
    });
    
    act(() => {
      const validationResult = result.current.validate();
      expect(validationResult.success).toBe(false);
    });
    
    expect(result.current.errors).toHaveProperty('name');
    expect(result.current.errors).toHaveProperty('email');
    
    act(() => {
      result.current.setValue('name', 'John Doe');
      result.current.setValue('email', 'john@example.com');
    });
    
    act(() => {
      const validationResult = result.current.validate();
      expect(validationResult.success).toBe(true);
    });
    
    expect(result.current.errors).toEqual({});
  });
  
  it('should handle form submission', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useZodForm(schema));
    
    act(() => {
      result.current.setValue('name', 'John Doe');
      result.current.setValue('email', 'john@example.com');
    });
    
    const mockEvent = {
      preventDefault: vi.fn(),
    };
    
    await act(async () => {
      await result.current.handleSubmit(onSubmit)(mockEvent as any);
    });
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
    });
  });
  
  it('should not submit if validation fails', async () => {
    const onSubmit = vi.fn();
    const { result } = renderHook(() => useZodForm(schema));
    
    act(() => {
      result.current.setValue('name', 'Jo');
      result.current.setValue('email', 'invalid-email');
    });
    
    const mockEvent = {
      preventDefault: vi.fn(),
    };
    
    await act(async () => {
      await result.current.handleSubmit(onSubmit)(mockEvent as any);
    });
    
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors).toHaveProperty('name');
    expect(result.current.errors).toHaveProperty('email');
  });
  
  it('should handle submission errors', async () => {
    const error = new Error('Submission failed');
    const onSubmit = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useZodForm(schema));
    
    act(() => {
      result.current.setValue('name', 'John Doe');
      result.current.setValue('email', 'john@example.com');
    });
    
    const mockEvent = {
      preventDefault: vi.fn(),
    };
    
    await act(async () => {
      await result.current.handleSubmit(onSubmit)(mockEvent as any);
    });
    
    expect(onSubmit).toHaveBeenCalled();
    expect(result.current.errors).toHaveProperty('_form', 'Submission failed');
  });
  
  it('should reset the form', () => {
    const initialValues = { name: 'John', email: '' };
    
    const { result } = renderHook(() => useZodForm(schema, initialValues));
    
    act(() => {
      result.current.setValue('name', 'Jane');
      result.current.setValue('email', 'invalid-email');
      result.current.validateField('email', 'invalid-email');
    });
    
    expect(result.current.data.name).toBe('Jane');
    expect(result.current.errors).toHaveProperty('email');
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.data).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
  });
});

describe('useFormSubmit', () => {
  it('should handle successful submission', async () => {
    const apiCall = vi.fn().mockResolvedValue({ id: '123' });
    const onSuccess = vi.fn();
    
    const { result } = renderHook(() => useFormSubmit(apiCall, { onSuccess }));
    
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
    
    await act(async () => {
      const response = await result.current.submit({ name: 'Test' });
      expect(response).toEqual({ id: '123' });
    });
    
    expect(apiCall).toHaveBeenCalledWith({ name: 'Test' });
    expect(onSuccess).toHaveBeenCalledWith({ id: '123' });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();
  });
  
  it('should handle submission errors', async () => {
    const error = new Error('API call failed');
    const apiCall = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();
    
    const { result } = renderHook(() => useFormSubmit(apiCall, { onError }));
    
    await act(async () => {
      try {
        await result.current.submit({ name: 'Test' });
      } catch (e) {
        expect(e).toBe(error);
      }
    });
    
    expect(apiCall).toHaveBeenCalledWith({ name: 'Test' });
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBe('API call failed');
  });
  
  it('should handle non-Error objects', async () => {
    const apiCall = vi.fn().mockRejectedValue('String error');
    
    const { result } = renderHook(() => useFormSubmit(apiCall));
    
    await act(async () => {
      try {
        await result.current.submit({ name: 'Test' });
      } catch (e) {
        expect(e).toBe('String error');
      }
    });
    
    expect(result.current.error).toBe('An unexpected error occurred');
  });
  
  it('should allow setting error manually', () => {
    const apiCall = vi.fn();
    
    const { result } = renderHook(() => useFormSubmit(apiCall));
    
    act(() => {
      result.current.setError('Manual error');
    });
    
    expect(result.current.error).toBe('Manual error');
  });
});
