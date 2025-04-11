import { auth } from "@clerk/nextjs/server";

// Extend the default session type
declare module "@trpc/server" {
  interface Context {
    db: any;
    headers: Headers;
    session: any | null;
  }
}

// This is for API route middleware
export const authHandler = auth();

// This is for context
export const getAuth = (req: { headers: Headers }) => {
  try {
    return auth();
  } catch (error) {
    console.error('Auth error:', error);
    // Fallback for development
    if (process.env.NODE_ENV === 'development') {
      return {
        sessionId: 'dev-session',
        userId: 'dev-user-id',
        user: {
          id: 'dev-user-id',
          firstName: 'Dev',
          lastName: 'User',
          email: 'dev@example.com'
        }
      };
    }
    return null;
  }
};
