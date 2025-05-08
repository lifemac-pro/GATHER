import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        retry: 1, // Only retry once
        retryDelay: 1000, // Wait 1 second before retrying
        onError: (error) => {
          console.error("Query error:", error);
        },
      },
      mutations: {
        retry: 1, // Only retry once
        retryDelay: 1000, // Wait 1 second before retrying
        onError: (error) => {
          console.error("Mutation error:", error);
        },
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
