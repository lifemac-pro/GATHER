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
  return auth();
};
