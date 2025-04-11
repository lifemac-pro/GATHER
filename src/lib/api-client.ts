import { ApiResponse } from '@/types/api-responses';
import { AppError, ErrorCode } from '@/utils/error-handling';

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
  /**
   * Query parameters
   */
  params?: Record<string, string | number | boolean | undefined>;
  
  /**
   * Request headers
   */
  headers?: Record<string, string>;
  
  /**
   * Whether to include credentials
   */
  withCredentials?: boolean;
  
  /**
   * Timeout in milliseconds
   */
  timeout?: number;
}

/**
 * API client for making type-safe API requests
 */
class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Make a GET request
   */
  async get<T>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }
  
  /**
   * Make a POST request
   */
  async post<T, D = any>(url: string, data?: D, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data, options);
  }
  
  /**
   * Make a PUT request
   */
  async put<T, D = any>(url: string, data?: D, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data, options);
  }
  
  /**
   * Make a PATCH request
   */
  async patch<T, D = any>(url: string, data?: D, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, data, options);
  }
  
  /**
   * Make a DELETE request
   */
  async delete<T>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }
  
  /**
   * Make a request to the API
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, headers = {}, withCredentials = true, timeout = 30000 } = options;
    
    // Build URL with query parameters
    let fullUrl = `${this.baseUrl}${url}`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }
    
    // Set up request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: withCredentials ? 'include' : 'same-origin',
    };
    
    // Add request body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD' && data !== undefined) {
      requestOptions.body = JSON.stringify(data);
    }
    
    try {
      // Set up timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      requestOptions.signal = controller.signal;
      
      // Make the request
      const response = await fetch(fullUrl, requestOptions);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Parse response
      const responseData = await response.json();
      
      // Handle API errors
      if (!response.ok) {
        const errorCode = responseData.error?.code || ErrorCode.INTERNAL_SERVER_ERROR;
        const errorMessage = responseData.error?.message || 'An unexpected error occurred';
        const errorDetails = responseData.error?.details;
        
        throw new AppError(
          errorCode,
          errorMessage,
          response.status,
          errorDetails
        );
      }
      
      return responseData as ApiResponse<T>;
    } catch (error) {
      // Handle fetch errors
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AppError(
          ErrorCode.REQUEST_TIMEOUT,
          'Request timed out',
          408
        );
      }
      
      throw new AppError(
        ErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient('/api');

/**
 * Type-safe API endpoints
 */
export const api = {
  auth: {
    signup: <T>(data: any) => apiClient.post<T>('/auth/signup', data),
    login: <T>(data: any) => apiClient.post<T>('/auth/login', data),
    logout: <T>() => apiClient.post<T>('/auth/logout'),
    resetPassword: <T>(data: any) => apiClient.post<T>('/auth/reset-password', data),
  },
  events: {
    getAll: <T>(params?: any) => apiClient.get<T>('/events', { params }),
    getById: <T>(id: string) => apiClient.get<T>(`/events/${id}`),
    create: <T>(data: any) => apiClient.post<T>('/events', data),
    update: <T>(id: string, data: any) => apiClient.put<T>(`/events/${id}`, data),
    delete: <T>(id: string) => apiClient.delete<T>(`/events/${id}`),
  },
  attendees: {
    getAll: <T>(params?: any) => apiClient.get<T>('/attendees', { params }),
    register: <T>(data: any) => apiClient.post<T>('/attendees/register', data),
    checkIn: <T>(id: string) => apiClient.post<T>(`/attendees/${id}/check-in`),
    cancel: <T>(id: string) => apiClient.post<T>(`/attendees/${id}/cancel`),
    exportToCSV: <T>(params?: any) => apiClient.get<T>('/attendees/export', { params }),
  },
  surveys: {
    submit: <T>(data: any) => apiClient.post<T>('/surveys', data),
    getByEvent: <T>(eventId: string) => apiClient.get<T>(`/surveys/event/${eventId}`),
  },
  waitlist: {
    join: <T>(data: any) => apiClient.post<T>('/waitlist/join', data),
    getStatus: <T>(eventId: string) => apiClient.get<T>(`/waitlist/status/${eventId}`),
    process: <T>(eventId: string, count: number) => 
      apiClient.post<T>(`/waitlist/process`, { eventId, count }),
  },
  notifications: {
    getAll: <T>(params?: any) => apiClient.get<T>('/notifications', { params }),
    markAsRead: <T>(ids: string[]) => apiClient.post<T>('/notifications/mark-read', { notificationIds: ids }),
    markAllAsRead: <T>() => apiClient.post<T>('/notifications/mark-all-read'),
    delete: <T>(id: string) => apiClient.delete<T>(`/notifications/${id}`),
  },
  user: {
    getProfile: <T>() => apiClient.get<T>('/user/profile'),
    updateProfile: <T>(data: any) => apiClient.put<T>('/user/profile', data),
    changePassword: <T>(data: any) => apiClient.post<T>('/user/change-password', data),
  },
  analytics: {
    getStats: <T>(params?: any) => apiClient.get<T>('/analytics/stats', { params }),
    getAttendanceData: <T>() => apiClient.get<T>('/analytics/attendance'),
    getDailyTrends: <T>(params?: any) => apiClient.get<T>('/analytics/trends/daily', { params }),
    getMonthlyStats: <T>(params?: any) => apiClient.get<T>('/analytics/trends/monthly', { params }),
  },
};
