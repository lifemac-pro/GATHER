import { useState, useEffect, useCallback, useRef } from "react";
import { type ApiResponse } from "@/types/api-responses";
import { AppError, ErrorCode } from "@/utils/error-handling";

/**
 * State for API hooks
 */
export interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: AppError | null;
}

/**
 * Options for useApi hook
 */
export interface UseApiOptions<T> {
  /**
   * Initial data
   */
  initialData?: T | null;

  /**
   * Whether to fetch data on mount
   */
  fetchOnMount?: boolean;

  /**
   * Dependencies for refetching
   */
  deps?: any[];

  /**
   * Callback on success
   */
  onSuccess?: (data: T) => void;

  /**
   * Callback on error
   */
  onError?: (error: AppError) => void;
}

/**
 * Hook for making API calls
 */
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {},
) {
  const {
    initialData = null,
    fetchOnMount = true,
    deps = [],
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    isLoading: fetchOnMount,
    isError: false,
    error: null,
  });

  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      isError: false,
      error: null,
    }));

    try {
      const response = await apiCall();

      if (!isMounted.current) return;

      if (response.success && response.data) {
        setState({
          data: response.data,
          isLoading: false,
          isError: false,
          error: null,
        });

        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        throw new AppError(
          ErrorCode.API_ERROR,
          "API returned success: false",
          400,
          { response },
        );
      }
    } catch (error) {
      if (!isMounted.current) return;

      const appError =
        error instanceof AppError
          ? error
          : new AppError(
              ErrorCode.UNKNOWN_ERROR,
              error instanceof Error ? error.message : "Unknown error",
              500,
            );

      setState({
        data: null,
        isLoading: false,
        isError: true,
        error: appError,
      });

      if (onError) {
        onError(appError);
      }
    }
  }, [apiCall, onSuccess, onError]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchData, fetchOnMount, ...deps]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Hook for making mutation API calls (POST, PUT, DELETE)
 */
export function useMutation<T, D = any>(
  apiCall: (data: D) => Promise<ApiResponse<T>>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: AppError) => void;
  } = {},
) {
  const { onSuccess, onError } = options;

  const [state, setState] = useState<{
    data: T | null;
    isLoading: boolean;
    isError: boolean;
    error: AppError | null;
  }>({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
  });

  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Mutation function
  const mutate = useCallback(
    async (data: D) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
      }));

      try {
        const response = await apiCall(data);

        if (!isMounted.current) return;

        if (response.success && response.data) {
          setState({
            data: response.data,
            isLoading: false,
            isError: false,
            error: null,
          });

          if (onSuccess) {
            onSuccess(response.data);
          }

          return response.data;
        } else {
          throw new AppError(
            ErrorCode.API_ERROR,
            "API returned success: false",
            400,
            { response },
          );
        }
      } catch (error) {
        if (!isMounted.current) return;

        const appError =
          error instanceof AppError
            ? error
            : new AppError(
                ErrorCode.UNKNOWN_ERROR,
                error instanceof Error ? error.message : "Unknown error",
                500,
              );

        setState({
          data: null,
          isLoading: false,
          isError: true,
          error: appError,
        });

        if (onError) {
          onError(appError);
        }

        throw appError;
      }
    },
    [apiCall, onSuccess, onError],
  );

  return {
    ...state,
    mutate,
    reset: () => {
      setState({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      });
    },
  };
}
