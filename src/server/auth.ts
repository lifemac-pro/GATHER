import type { Session, User } from "next-auth";

export const authCallbacks = {
  async session({ session, token }: { session: Session; token: any }) {
    if (token) {
      return {
        ...session,
        user: {
          id: token.id,
          email: token.email,
          name: token.name,
        },
      };
    }
    return session;
  },
};
