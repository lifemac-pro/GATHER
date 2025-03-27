import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Session } from "next-auth";
import { events } from "@/server/db/schema";


export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Simulated authentication, replace with actual logic
        if (credentials?.email === "user@email.com" && credentials?.password === "password123") {
          return { id: "1", name: "John Doe", email: credentials.email };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login", // Customize your login page if needed
  },
  callbacks: {
    async session({ session }: { session: Session }) {
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
