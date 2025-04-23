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
export const authHandler = (req: Request) => {
  try {
    // Convert Request to a compatible format
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    const compatibleReq = {
      headers,
      url: req.url
    };

    return getClerkAuth(compatibleReq as any);
  } catch (error) {
    console.error('Auth handler error:', error);
    return null;
  }
};

// This is for context
export const getAuth = (req: { headers: Headers, url?: string }) => {
  try {
    // Create a compatible request object
    const compatibleReq = {
      headers: req.headers,
      url: req.url || 'http://localhost:3000'
    };

    // Use the compatible request object with Clerk's getAuth
    return getClerkAuth(compatibleReq as any);
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
