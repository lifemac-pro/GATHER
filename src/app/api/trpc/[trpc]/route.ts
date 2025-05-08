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
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
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
