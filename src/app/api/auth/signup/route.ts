import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { User } from "@/server/db/models/user";
import { AppError, ErrorCode } from "@/utils/error-handling";
import {
  createApiRouteHandler,
  createSuccessResponse,
} from "@/utils/api-route-handler";
import { type ApiResponse, type UserResponse } from "@/types/api-responses";

// Define the request schema using Zod
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Define the request type based on the schema
type SignupRequest = z.infer<typeof signupSchema>;

// Create the route handler
export const POST = createApiRouteHandler<SignupRequest>(
  async ({ body }): Promise<Response> => {
    if (!body) {
      throw new AppError(
        ErrorCode.INVALID_INPUT,
        "Request body is required",
        400,
      );
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(body.email);

    if (existingUser) {
      throw new AppError(
        ErrorCode.ALREADY_EXISTS,
        "User with this email already exists",
        409,
      );
    }

    // Hash password
    const hashedPassword = await hash(body.password, 12);

    // Create user
    const user = await User.create({
      email: body.email,
      password: hashedPassword,
      firstName: body.firstName,
      lastName: body.lastName,
      role: "admin", // Default role
    });

    // Create response
    const response: ApiResponse<UserResponse> = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImage: user.profileImage || undefined,
        role: user.role,
      },
    };

    return createSuccessResponse(response, 201);
  },
  {
    bodySchema: signupSchema,
  },
);
