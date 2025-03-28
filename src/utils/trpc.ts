import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/api/root"; // ✅ Import backend router

export const api = createTRPCReact<AppRouter>(); // ✅ Initialize tRPC client
