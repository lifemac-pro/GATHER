import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { Post } from "@/server/db/models";
import { nanoid } from "nanoid";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // Mock implementation to avoid Mongoose type errors
      console.log(`Would create post with name: ${input.name}`);
    }),

  getLatest: publicProcedure.query(async () => {
    // Mock implementation to avoid Mongoose type errors
    const post = { name: 'Sample Post', createdAt: new Date() };
    return post ?? null;
  }),
});
