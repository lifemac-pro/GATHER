// @ts-nocheck
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'test-user-id' }),
  currentUser: () => ({ id: 'test-user-id', name: 'Test User' }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      fullName: 'Test User',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    },
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
  }),
  ClerkProvider: ({ children }) => <>{children}</>,
  SignedIn: ({ children }) => <>{children}</>,
  SignedOut: () => null,
}));

// Mock MongoDB
jest.mock('@/server/db/mongo', () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
  mockData: {
    events: [],
    attendees: [],
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock-key';
process.env.CLERK_SECRET_KEY = 'sk_test_mock-key';
process.env.DATABASE_URL = 'mongodb://localhost:27017/test';

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Warning: React.createElement') ||
      args[0].includes('Error: Uncaught [Error: expected'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
