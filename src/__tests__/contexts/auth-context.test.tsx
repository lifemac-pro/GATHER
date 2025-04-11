import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api-client';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  api: {
    user: {
      getProfile: vi.fn(),
    },
    auth: {
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    },
  },
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Test component that uses the auth context
function TestComponent() {
  const { user, isLoading, isAuthenticated, error, login, signup, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button onClick={() => signup({ email: 'test@example.com', password: 'password', firstName: 'Test', lastName: 'User' })}>
        Signup
      </button>
      <button onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should check auth status on mount', async () => {
    // Mock successful auth check
    (api.user.getProfile as any).mockResolvedValue({
      success: true,
      data: { id: '123', email: 'test@example.com' },
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');
    
    // After auth check completes
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).not.toBe('no-user');
    });
    
    expect(api.user.getProfile).toHaveBeenCalledTimes(1);
  });
  
  it('should handle failed auth check', async () => {
    // Mock failed auth check
    (api.user.getProfile as any).mockRejectedValue(new Error('Auth check failed'));
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // After auth check fails
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('no-user');
    });
  });
  
  it('should handle login', async () => {
    // Mock successful login
    (api.auth.login as any).mockResolvedValue({
      success: true,
      data: { user: { id: '123', email: 'test@example.com' } },
    });
    
    // Mock initial auth check
    (api.user.getProfile as any).mockResolvedValue({
      success: false,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Perform login
    const user = userEvent.setup();
    await user.click(screen.getByText('Login'));
    
    // After login completes
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).not.toBe('no-user');
    });
    
    expect(api.auth.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
  });
  
  it('should handle login error', async () => {
    // Mock failed login
    (api.auth.login as any).mockRejectedValue(new Error('Invalid credentials'));
    
    // Mock initial auth check
    (api.user.getProfile as any).mockResolvedValue({
      success: false,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Perform login
    const user = userEvent.setup();
    await act(async () => {
      try {
        await user.click(screen.getByText('Login'));
      } catch (error) {
        // Expected to throw
      }
    });
    
    // After login fails
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.getByTestId('error').textContent).not.toBe('no-error');
    });
  });
  
  it('should handle signup', async () => {
    // Mock successful signup
    (api.auth.signup as any).mockResolvedValue({
      success: true,
      data: { user: { id: '123', email: 'test@example.com' } },
    });
    
    // Mock initial auth check
    (api.user.getProfile as any).mockResolvedValue({
      success: false,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    
    // Perform signup
    const user = userEvent.setup();
    await user.click(screen.getByText('Signup'));
    
    // After signup completes
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).not.toBe('no-user');
    });
    
    expect(api.auth.signup).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
    });
  });
  
  it('should handle logout', async () => {
    // Mock successful logout
    (api.auth.logout as any).mockResolvedValue({
      success: true,
    });
    
    // Mock initial auth check with authenticated user
    (api.user.getProfile as any).mockResolvedValue({
      success: true,
      data: { id: '123', email: 'test@example.com' },
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });
    
    // Perform logout
    const user = userEvent.setup();
    await user.click(screen.getByText('Logout'));
    
    // After logout completes
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('no-user');
    });
    
    expect(api.auth.logout).toHaveBeenCalled();
  });
});
