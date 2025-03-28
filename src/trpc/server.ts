import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";
import { cache } from "react";

import { createCaller, type AppRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API
 * when handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const rawHeaders = await headers(); // ✅ Fix: Await first
  const heads = new Headers(rawHeaders); // ✅ Use after awaiting
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    req: { headers: heads } as Request, // ✅ Ensure `req` is a valid `Request` object
  });
});

const getQueryClient = cache(createQueryClient);
const caller = async () => createCaller(await createContext()); // ✅ Fix: Await createContext()

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  await caller(),
  getQueryClient
);
