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
      await Post.create({
        id: nanoid(),
        name: input.name,
        createdAt: new Date(),
      });
    }),

  getLatest: publicProcedure.query(async () => {
    const post = await Post.findOne().sort({ createdAt: -1 });
    return post ?? null;
  }),
});
