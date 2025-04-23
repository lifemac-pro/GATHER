import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useApi, useMutation } from "@/hooks/use-api";
import { AppError, ErrorCode } from "@/utils/error-handling";

describe("useApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch data successfully", async () => {
    const mockData = { id: "123", name: "Test" };
    const mockApiCall = vi.fn().mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result, rerender } = renderHook(() => useApi(mockApiCall));

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();

    // Wait for the API call to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // After successful API call
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();

    // Test refetch
    mockApiCall.mockResolvedValue({
      success: true,
      data: { ...mockData, name: "Updated" },
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual({ ...mockData, name: "Updated" });
  });

  it("should handle API errors", async () => {
    const mockError = new AppError(
      ErrorCode.NOT_FOUND,
      "Resource not found",
      404,
    );
    const mockApiCall = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApi(mockApiCall));

    // Wait for the API call to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // After failed API call
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });

  it("should handle non-AppError errors", async () => {
    const mockError = new Error("Network error");
    const mockApiCall = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useApi(mockApiCall));

    // Wait for the API call to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // After failed API call
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeInstanceOf(AppError);
    expect(result.current.error?.message).toBe("Network error");
  });

  it("should call onSuccess callback when API call succeeds", async () => {
    const mockData = { id: "123", name: "Test" };
    const mockApiCall = vi.fn().mockResolvedValue({
      success: true,
      data: mockData,
    });
    const onSuccess = vi.fn();

    renderHook(() => useApi(mockApiCall, { onSuccess }));

    // Wait for the API call to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });

  it("should call onError callback when API call fails", async () => {
    const mockError = new AppError(
      ErrorCode.NOT_FOUND,
      "Resource not found",
      404,
    );
    const mockApiCall = vi.fn().mockRejectedValue(mockError);
    const onError = vi.fn();

    renderHook(() => useApi(mockApiCall, { onError }));

    // Wait for the API call to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it("should not fetch on mount if fetchOnMount is false", async () => {
    const mockApiCall = vi.fn().mockResolvedValue({
      success: true,
      data: { id: "123" },
    });

    const { result } = renderHook(() =>
      useApi(mockApiCall, { fetchOnMount: false }),
    );

    // Initial state
    expect(result.current.isLoading).toBe(false);
    expect(mockApiCall).not.toHaveBeenCalled();

    // Manually trigger fetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(mockApiCall).toHaveBeenCalledTimes(1);
  });
});

describe("useMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should mutate data successfully", async () => {
    const mockData = { id: "123", name: "Test" };
    const mockApiCall = vi.fn().mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useMutation(mockApiCall));

    // Initial state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();

    // Perform mutation
    let returnedData;
    await act(async () => {
      returnedData = await result.current.mutate({ name: "Test" });
    });

    // After successful mutation
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(returnedData).toEqual(mockData);
    expect(mockApiCall).toHaveBeenCalledWith({ name: "Test" });
  });

  it("should handle mutation errors", async () => {
    const mockError = new AppError(
      ErrorCode.INVALID_INPUT,
      "Invalid input",
      400,
    );
    const mockApiCall = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useMutation(mockApiCall));

    // Perform mutation
    await act(async () => {
      try {
        await result.current.mutate({ name: "Test" });
      } catch (error) {
        // Expected to throw
      }
    });

    // After failed mutation
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });

  it("should call onSuccess callback when mutation succeeds", async () => {
    const mockData = { id: "123", name: "Test" };
    const mockApiCall = vi.fn().mockResolvedValue({
      success: true,
      data: mockData,
    });
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useMutation(mockApiCall, { onSuccess }),
    );

    // Perform mutation
    await act(async () => {
      await result.current.mutate({ name: "Test" });
    });

    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });

  it("should call onError callback when mutation fails", async () => {
    const mockError = new AppError(
      ErrorCode.INVALID_INPUT,
      "Invalid input",
      400,
    );
    const mockApiCall = vi.fn().mockRejectedValue(mockError);
    const onError = vi.fn();

    const { result } = renderHook(() => useMutation(mockApiCall, { onError }));

    // Perform mutation
    await act(async () => {
      try {
        await result.current.mutate({ name: "Test" });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it("should reset state", async () => {
    const mockData = { id: "123", name: "Test" };
    const mockApiCall = vi.fn().mockResolvedValue({
      success: true,
      data: mockData,
    });

    const { result } = renderHook(() => useMutation(mockApiCall));

    // Perform mutation
    await act(async () => {
      await result.current.mutate({ name: "Test" });
    });

    expect(result.current.data).toEqual(mockData);

    // Reset state
    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
