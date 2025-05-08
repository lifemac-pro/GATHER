import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "@/env";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  try {
    console.log("Creating context for TRPC request");
    const context = await createTRPCContext({
      headers: req.headers,
    });
    return context;
  } catch (error) {
    console.error("Error creating context:", error);
    // Provide a fallback context for development
    if (process.env.NODE_ENV !== "production") {
      return {
        session: {
          userId: "dev-user-id",
          user: {
            id: "dev-user-id",
            email: "dev@example.com",
            firstName: "Dev",
            lastName: "User",
            role: "user"
          }
        }
      };
    }
    // Return null session for production
    return { session: null };
  }
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      try {
        return await createContext(req);
      } catch (error) {
        console.error("Error in createContext:", error);
        // Provide a fallback context for development
        if (process.env.NODE_ENV !== "production") {
          return {
            session: {
              userId: "dev-user-id",
              user: {
                id: "dev-user-id",
                email: "dev@example.com",
                firstName: "Dev",
                lastName: "User",
                role: "user"
              }
            }
          };
        }
        // Return null session for production
        return { session: null };
      }
    },
    onError: ({ path, error }) => {
      // Always log errors regardless of environment
      console.error(`❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });
    },
  });

export { handler as GET, handler as POST };
