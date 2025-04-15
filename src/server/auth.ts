import { getAuth as getClerkAuth } from "@clerk/nextjs/server";

// Extend the default session type
declare module "@trpc/server" {
  interface Context {
    db: any;
    headers: Headers;
    session: any | null;
  }
}

// This is for API route middleware
export const authHandler = (req: Request) => getClerkAuth({ request: req });

// This is for context
export const getAuth = (req: { headers: Headers }) => {
  try {
    // Create a Request object from the headers
    const request = new Request('http://localhost', {
      headers: req.headers,
    });

    // Use the request object with Clerk's getAuth
    return getClerkAuth({ request });
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
