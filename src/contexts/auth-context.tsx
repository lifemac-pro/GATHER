"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { type UserResponse } from "@/types/api-responses";
import { type LoginRequest, type SignupRequest } from "@/types/api-requests";
import { AppError, ErrorCode } from "@/utils/error-handling";

/**
 * Auth context state
 */
interface AuthContextState {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  clearError: () => {},
});

/**
 * Auth provider props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth provider component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.user.getProfile<UserResponse>();

      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.auth.login<{ user: UserResponse }>(data);

      if (response.success && response.data) {
        setUser(response.data.user);
        router.push("/dashboard");
      } else {
        throw new AppError(
          ErrorCode.INVALID_CREDENTIALS,
          "Invalid credentials",
          401,
        );
      }
    } catch (error) {
      setError(
        error instanceof AppError
          ? error.message
          : "An error occurred during login",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (data: SignupRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.auth.signup<{ user: UserResponse }>(data);

      if (response.success && response.data) {
        setUser(response.data.user);
        router.push("/dashboard");
      } else {
        throw new AppError(ErrorCode.INVALID_INPUT, "Signup failed", 400);
      }
    } catch (error) {
      setError(
        error instanceof AppError
          ? error.message
          : "An error occurred during signup",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await api.auth.logout();
      setUser(null);
      router.push("/login");
    } catch (error) {
      setError("An error occurred during logout");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value: AuthContextState = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
