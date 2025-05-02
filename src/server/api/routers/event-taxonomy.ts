import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { EventCategory, EventTag } from "@/server/db/models";
import { connectToDatabase } from "@/server/db/mongo";
import { nanoid } from "nanoid";

// Helper function to create a slug from a string
const createSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const eventTaxonomyRouter = createTRPCRouter({
  // Category endpoints
  getAllCategories: protectedProcedure
    .query(async () => {
      try {
        await connectToDatabase();

        const categories = await EventCategory.findActive();

        return categories;
      } catch (error) {
        console.error("Error getting categories:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get categories",
        });
      }
    }),

  getCategoriesWithSubcategories: protectedProcedure
    .query(async () => {
      try {
        await connectToDatabase();

        const categories = await EventCategory.findWithSubcategories();

        return categories;
      } catch (error) {
        console.error("Error getting categories with subcategories:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get categories with subcategories",
        });
      }
    }),

  getCategoryBySlug: protectedProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const category = await EventCategory.findBySlug(input.slug);

        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }

        return category;
      } catch (error) {
        console.error("Error getting category by slug:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get category",
        });
      }
    }),

  createCategory: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      parentId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        // Generate slug if not provided
        const slug = input.slug || createSlug(input.name);

        // Check if slug already exists
        const existingCategory = await EventCategory.findOne({ slug });
        if (existingCategory) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A category with this slug already exists",
          });
        }

        // Check if parent category exists if parentId is provided
        if (input.parentId) {
          const parentCategory = await EventCategory.findOne({ id: input.parentId });
          if (!parentCategory) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Parent category not found",
            });
          }

          // Ensure parent doesn't have a parent (only 2 levels allowed)
          if (parentCategory.parentId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot create a subcategory of a subcategory",
            });
          }
        }

        // Create the category
        const category = await EventCategory.create({
          id: nanoid(),
          name: input.name,
          slug,
          description: input.description || "",
          icon: input.icon || "",
          color: input.color || "#000000",
          parentId: input.parentId || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return category;
      } catch (error) {
        console.error("Error creating category:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create category",
        });
      }
    }),

  updateCategory: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      parentId: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        // Check if category exists
        const category = await EventCategory.findOne({ id: input.id });
        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }

        // Check if slug already exists if changing slug
        if (input.slug && input.slug !== category.slug) {
          const existingCategory = await EventCategory.findOne({ slug: input.slug });
          if (existingCategory && existingCategory.id !== input.id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A category with this slug already exists",
            });
          }
        }

        // Check if parent category exists if parentId is provided
        if (input.parentId) {
          const parentCategory = await EventCategory.findOne({ id: input.parentId });
          if (!parentCategory) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Parent category not found",
            });
          }

          // Ensure parent doesn't have a parent (only 2 levels allowed)
          if (parentCategory.parentId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot create a subcategory of a subcategory",
            });
          }

          // Ensure we're not creating a circular reference
          if (input.parentId === input.id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A category cannot be its own parent",
            });
          }
        }

        // Update the category
        const updatedCategory = await EventCategory.findOneAndUpdate(
          { id: input.id },
          {
            $set: {
              ...(input.name && { name: input.name }),
              ...(input.slug && { slug: input.slug }),
              ...(input.description !== undefined && { description: input.description }),
              ...(input.icon !== undefined && { icon: input.icon }),
              ...(input.color && { color: input.color }),
              ...(input.parentId !== undefined && { parentId: input.parentId }),
              ...(input.isActive !== undefined && { isActive: input.isActive }),
              updatedAt: new Date(),
            },
          },
          { new: true }
        );

        return updatedCategory;
      } catch (error) {
        console.error("Error updating category:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update category",
        });
      }
    }),

  deleteCategory: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        // Check if category exists
        const category = await EventCategory.findOne({ id: input.id });
        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }

        // Check if category has subcategories
        const subcategories = await EventCategory.find({ parentId: input.id });
        if (subcategories.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Cannot delete a category with subcategories",
          });
        }

        // Delete the category
        await EventCategory.deleteOne({ id: input.id });

        return { success: true };
      } catch (error) {
        console.error("Error deleting category:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete category",
        });
      }
    }),

  // Tag endpoints
  getAllTags: protectedProcedure
    .query(async () => {
      try {
        await connectToDatabase();

        const tags = await EventTag.findActive();

        return tags;
      } catch (error) {
        console.error("Error getting tags:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get tags",
        });
      }
    }),

  getTagBySlug: protectedProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        await connectToDatabase();

        const tag = await EventTag.findBySlug(input.slug);

        if (!tag) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        return tag;
      } catch (error) {
        console.error("Error getting tag by slug:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get tag",
        });
      }
    }),

  createTag: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().optional(),
      description: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        // Generate slug if not provided
        const slug = input.slug || createSlug(input.name);

        // Check if slug already exists
        const existingTag = await EventTag.findOne({ slug });
        if (existingTag) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A tag with this slug already exists",
          });
        }

        // Create the tag
        const tag = await EventTag.create({
          id: nanoid(),
          name: input.name,
          slug,
          description: input.description || "",
          color: input.color || "#000000",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return tag;
      } catch (error) {
        console.error("Error creating tag:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create tag",
        });
      }
    }),

  updateTag: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      slug: z.string().optional(),
      description: z.string().optional(),
      color: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        // Check if tag exists
        const tag = await EventTag.findOne({ id: input.id });
        if (!tag) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        // Check if slug already exists if changing slug
        if (input.slug && input.slug !== tag.slug) {
          const existingTag = await EventTag.findOne({ slug: input.slug });
          if (existingTag && existingTag.id !== input.id) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "A tag with this slug already exists",
            });
          }
        }

        // Update the tag
        const updatedTag = await EventTag.findOneAndUpdate(
          { id: input.id },
          {
            $set: {
              ...(input.name && { name: input.name }),
              ...(input.slug && { slug: input.slug }),
              ...(input.description !== undefined && { description: input.description }),
              ...(input.color && { color: input.color }),
              ...(input.isActive !== undefined && { isActive: input.isActive }),
              updatedAt: new Date(),
            },
          },
          { new: true }
        );

        return updatedTag;
      } catch (error) {
        console.error("Error updating tag:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update tag",
        });
      }
    }),

  deleteTag: adminProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await connectToDatabase();

        // Check if tag exists
        const tag = await EventTag.findOne({ id: input.id });
        if (!tag) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tag not found",
          });
        }

        // Delete the tag
        await EventTag.deleteOne({ id: input.id });

        return { success: true };
      } catch (error) {
        console.error("Error deleting tag:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete tag",
        });
      }
    }),
});
