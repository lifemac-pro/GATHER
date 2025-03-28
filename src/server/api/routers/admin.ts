import {z} from 'zod'

import {createTRPCRouter, publicProcedure} from '@/server/api/trpc'

export const adminRouter = createTRPCRouter({
  getAllUsers: publicProcedure.query(async ({ctx}) => {
    const users = await ctx.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })
    return users
  })