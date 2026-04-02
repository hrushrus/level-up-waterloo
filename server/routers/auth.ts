import { z } from "zod";
import { publicProcedure, router } from "@/server/_core/trpc";
import {
  createUser,
  authenticateUser,
  updateUserProfile,
  changePassword,
} from "@/server/services/auth-service";
import { COOKIE_NAME } from "@/shared/const";

/**
 * Authentication router for email/password signup, login, and profile management
 */
export const authRouter = router({
  /**
   * Get current user (backward compatibility with OAuth)
   */
  me: publicProcedure.query((opts) => opts.ctx.user),
  /**
   * Sign up a new user with email and password
   */
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user already exists
        const existingUser = await authenticateUser(input.email, input.password);
        if (existingUser) {
          throw new Error("User with this email already exists");
        }

        // Create new user
        const user = await createUser(input.email, input.password, input.name);

        // Set session cookie
        ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${user.id}; Path=/; HttpOnly; Secure; SameSite=None`);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Signup failed";
        throw new Error(message);
      }
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Authenticate user
        const user = await authenticateUser(input.email, input.password);

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Set session cookie
        ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${user.id}; Path=/; HttpOnly; Secure; SameSite=None`);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Login failed";
        throw new Error(message);
      }
    }),

  /**
   * Logout the current user
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    // Clear session cookie
    ctx.res.clearCookie(COOKIE_NAME, {
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });

    return { success: true };
  }),

  /**
   * Get current user profile (same as me, but with explicit return)
   */
  profile: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error("Not authenticated");
    }

    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      createdAt: ctx.user.createdAt,
      lastSignedIn: ctx.user.lastSignedIn,
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").optional(),
        email: z.string().email("Invalid email address").optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }

      try {
        const updates: Record<string, string> = {};
        if (input.name) updates.name = input.name;
        if (input.email) updates.email = input.email;

        const user = await updateUserProfile(ctx.user.id, updates);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Profile update failed";
        throw new Error(message);
      }
    }),

  /**
   * Change user password
   */
  changePassword: publicProcedure
    .input(
      z.object({
        oldPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("Not authenticated");
      }

      try {
        await changePassword(ctx.user.id, input.oldPassword, input.newPassword);

        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Password change failed";
        throw new Error(message);
      }
    }),
});
