import { getAuth } from "@clerk/nextjs/server";

export const isAuthenticated = (req: any) => {
  const auth = getAuth(req);
  if (!auth.userId) throw new Error("Unauthorized");
  return auth.userId;
};
