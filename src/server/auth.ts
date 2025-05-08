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
      url: req.url,
    };

    return getClerkAuth(compatibleReq as any);
  } catch (error) {
    console.error("Auth handler error:", error);
    return null;
  }
};

// This is for context
export const getAuth = async (req: { headers: Headers; url?: string }) => {
  try {
    // Check if we have authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.log("No authorization header found, using development fallback");
      // Use development fallback if no auth header
      if (process.env.NODE_ENV !== "production") {
        return {
          sessionId: "dev-session",
          userId: "dev-user-id",
          user: {
            id: "dev-user-id",
            firstName: "Dev",
            lastName: "User",
            email: "dev@example.com",
            // FORCE USER ROLE: Always set to "user" for development
            publicMetadata: {
              role: "user"
            }
          },
        };
      }
      return null;
    }

    // Create a compatible request object
    const compatibleReq = {
      headers: req.headers,
      url: req.url || "http://localhost:3000",
    };

    // Use the compatible request object with Clerk's getAuth
    const auth = await getClerkAuth(compatibleReq as any);

    // If auth is null or undefined, use development fallback
    if (!auth && process.env.NODE_ENV !== "production") {
      console.log("Auth is null, using development fallback");
      return {
        sessionId: "dev-session",
        userId: "dev-user-id",
        user: {
          id: "dev-user-id",
          firstName: "Dev",
          lastName: "User",
          email: "dev@example.com",
          // FORCE USER ROLE: Always set to "user" for development
          publicMetadata: {
            role: "user"
          }
        },
      };
    }

    // FORCE USER ROLE: Override any existing role to ensure it's always "user"
    if (auth) {
      console.log("FORCE USER ROLE: Overriding auth role to 'user'");
      // @ts-ignore - We're intentionally modifying the auth object
      auth.publicMetadata = { role: "user" };
    }

    return auth;
  } catch (error) {
    console.error("Auth error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Fallback for development
    if (process.env.NODE_ENV !== "production") {
      console.log("Error in auth, using development fallback");
      return {
        sessionId: "dev-session",
        userId: "dev-user-id",
        user: {
          id: "dev-user-id",
          firstName: "Dev",
          lastName: "User",
          email: "dev@example.com",
          // FORCE USER ROLE: Always set to "user" for development
          publicMetadata: {
            role: "user"
          }
        },
      };
    }
    return null;
  }
};
