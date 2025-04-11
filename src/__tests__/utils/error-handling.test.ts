import { describe, it, expect, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { ZodError, z } from 'zod';
import {
  AppError,
  ErrorCode,
  handleZodError,
  handleMongooseError,
  apiErrorHandler,
  trpcErrorHandler
} from '@/utils/error-handling';

describe('AppError', () => {
  it('should create an instance with the correct properties', () => {
    const error = new AppError(
      ErrorCode.NOT_FOUND,
      'Resource not found',
      404,
      { resourceId: '123' }
    );

    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('Resource not found');
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual({ resourceId: '123' });
    expect(error.name).toBe('AppError');
  });

  it('should convert to API error format', () => {
    const error = new AppError(
      ErrorCode.NOT_FOUND,
      'Resource not found',
      404,
      { resourceId: '123' }
    );

    const apiError = error.toApiError();

    expect(apiError).toEqual({
      code: ErrorCode.NOT_FOUND,
      message: 'Resource not found',
      details: { resourceId: '123' },
    });
  });

  it('should convert to TRPC error', () => {
    const error = new AppError(
      ErrorCode.NOT_FOUND,
      'Resource not found',
      404
    );

    const trpcError = error.toTRPCError();

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('NOT_FOUND');
    expect(trpcError.message).toBe('Resource not found');
    expect(trpcError.cause).toBe(error);
  });

  it('should map application error codes to TRPC error codes', () => {
    const testCases = [
      { appCode: ErrorCode.UNAUTHORIZED, trpcCode: 'UNAUTHORIZED' },
      { appCode: ErrorCode.FORBIDDEN, trpcCode: 'FORBIDDEN' },
      { appCode: ErrorCode.NOT_FOUND, trpcCode: 'NOT_FOUND' },
      { appCode: ErrorCode.INVALID_INPUT, trpcCode: 'BAD_REQUEST' },
      { appCode: ErrorCode.INTERNAL_SERVER_ERROR, trpcCode: 'INTERNAL_SERVER_ERROR' },
      { appCode: ErrorCode.TOO_MANY_REQUESTS, trpcCode: 'TOO_MANY_REQUESTS' },
    ];

    testCases.forEach(({ appCode, trpcCode }) => {
      const error = new AppError(appCode, 'Test message');
      const trpcError = error.toTRPCError();

      expect(trpcError.code).toBe(trpcCode);
    });
  });
});

describe('handleZodError', () => {
  it('should convert Zod errors to AppError', () => {
    const schema = z.object({
      name: z.string().min(3),
      email: z.string().email(),
    });

    try {
      schema.parse({ name: 'ab', email: 'invalid-email' });
      expect(true).toBe(false); // This line should not be reached
    } catch (error) {
      if (error instanceof ZodError) {
        const appError = handleZodError(error);

        expect(appError).toBeInstanceOf(AppError);
        expect(appError.code).toBe(ErrorCode.INVALID_INPUT);
        expect(appError.statusCode).toBe(400);
        expect(appError.details).toHaveProperty('validationErrors');
        expect(appError.details?.validationErrors).toHaveLength(2);

        const validationErrors = appError.details?.validationErrors;
        expect(validationErrors?.[0]).toHaveProperty('path');
        expect(validationErrors?.[0]).toHaveProperty('message');
      } else {
        expect(true).toBe(false); // This line should not be reached
      }
    }
  });
});

describe('handleMongooseError', () => {
  it('should handle duplicate key errors', () => {
    const mongooseError = {
      code: 11000,
      keyValue: { email: 'test@example.com' },
    };

    const appError = handleMongooseError(mongooseError);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.code).toBe(ErrorCode.ALREADY_EXISTS);
    expect(appError.statusCode).toBe(409);
    expect(appError.details).toEqual({
      field: 'email',
      value: 'test@example.com',
    });
  });

  it('should handle validation errors', () => {
    const mongooseError = {
      name: 'ValidationError',
      errors: {
        name: { message: 'Name is required' },
        email: { message: 'Email is invalid' },
      },
    };

    const appError = handleMongooseError(mongooseError);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.code).toBe(ErrorCode.INVALID_INPUT);
    expect(appError.statusCode).toBe(400);
    expect(appError.details).toHaveProperty('validationErrors');
    expect(appError.details?.validationErrors).toHaveLength(2);
  });

  it('should handle other database errors', () => {
    const mongooseError = {
      name: 'MongoError',
      message: 'Connection failed',
    };

    const appError = handleMongooseError(mongooseError);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.code).toBe(ErrorCode.DATABASE_ERROR);
    expect(appError.statusCode).toBe(500);
    expect(appError.details).toEqual({
      originalError: 'Connection failed',
    });
  });
});

describe('apiErrorHandler', () => {
  it('should return the result of the function if no error is thrown', async () => {
    const fn = vi.fn().mockResolvedValue({ success: true, data: 'test' });

    const result = await apiErrorHandler(fn);

    expect(fn).toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: 'test' });
  });

  it('should handle AppError', async () => {
    const error = new AppError(
      ErrorCode.NOT_FOUND,
      'Resource not found',
      404
    );

    const fn = vi.fn().mockRejectedValue(error);

    const result = await apiErrorHandler(fn);

    expect(fn).toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: error.toApiError(),
    });
  });

  it('should handle ZodError', async () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    const fn = vi.fn().mockImplementation(() => {
      return schema.parse({ name: 'ab' });
    });

    const result = await apiErrorHandler(fn);

    expect(fn).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty('code', ErrorCode.INVALID_INPUT);
  });

  it('should handle generic Error', async () => {
    const error = new Error('Something went wrong');

    const fn = vi.fn().mockRejectedValue(error);

    const result = await apiErrorHandler(fn);

    expect(fn).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty('code', ErrorCode.INTERNAL_SERVER_ERROR);
    expect(result.error).toHaveProperty('message', 'Something went wrong');
  });

  it('should handle unknown errors', async () => {
    const fn = vi.fn().mockRejectedValue('Not an error object');

    const result = await apiErrorHandler(fn);

    expect(fn).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toHaveProperty('code', ErrorCode.INTERNAL_SERVER_ERROR);
    expect(result.error).toHaveProperty('message', 'An unexpected error occurred');
  });
});

describe('trpcErrorHandler', () => {
  it('should pass through if no error is thrown', async () => {
    const next = vi.fn().mockResolvedValue({ result: 'success' });
    const middleware = trpcErrorHandler();

    const result = await middleware({ next });

    expect(next).toHaveBeenCalled();
    expect(result).toEqual({ result: 'success' });
  });

  it('should handle AppError', async () => {
    const error = new AppError(
      ErrorCode.NOT_FOUND,
      'Resource not found',
      404
    );

    const next = vi.fn().mockRejectedValue(error);
    const middleware = trpcErrorHandler();

    await expect(middleware({ next })).rejects.toThrow(TRPCError);

    try {
      await middleware({ next });
    } catch (e) {
      expect(e).toBeInstanceOf(TRPCError);
      expect((e as TRPCError).code).toBe('NOT_FOUND');
      expect((e as TRPCError).message).toBe('Resource not found');
    }
  });

  it('should handle ZodError', async () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    const next = vi.fn().mockImplementation(() => {
      return schema.parse({ name: 'ab' });
    });

    const middleware = trpcErrorHandler();

    await expect(middleware({ next })).rejects.toThrow(TRPCError);

    try {
      await middleware({ next });
    } catch (e) {
      expect(e).toBeInstanceOf(TRPCError);
      expect((e as TRPCError).code).toBe('BAD_REQUEST');
    }
  });

  it('should pass through TRPCError', async () => {
    const error = new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });

    const next = vi.fn().mockRejectedValue(error);
    const middleware = trpcErrorHandler();

    await expect(middleware({ next })).rejects.toThrow(TRPCError);

    try {
      await middleware({ next });
    } catch (e) {
      expect(e).toBe(error);
    }
  });
});
