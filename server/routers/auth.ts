import { z } from "zod";
import { publicProcedure, router } from "@/server/_core/trpc";
import {
  createUser,
  authenticateUser,
  updateUserProfile,
  changePassword,
  createVerificationToken,
  verifyEmailWithToken,
  resendVerificationEmail,
  requestPasswordReset,
  resetPasswordWithToken,
  validatePasswordResetToken,
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

        // Create verification token and send email
        const token = await createVerificationToken(user.id);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
          },
          message: "Signup successful. Please check your email to verify your account.",
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

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
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
            emailVerified: user.emailVerified,
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
      emailVerified: ctx.user.emailVerified,
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
            emailVerified: user.emailVerified,
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

  /**
   * Send verification email to user
   */
  sendVerificationEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await resendVerificationEmail(input.email);
        return { success: true, message: "Verification email sent" };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to send verification email";
        throw new Error(message);
      }
    }),

  /**
   * Verify email with token
   */
  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Verification token is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await verifyEmailWithToken(input.token);

        // Set session cookie
        ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${user.id}; Path=/; HttpOnly; Secure; SameSite=None`);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
          },
          message: "Email verified successfully",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Email verification failed";
        throw new Error(message);
      }
    }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await requestPasswordReset(input.email);
        return {
          success: true,
          message: "If this email is registered, you will receive a password reset link",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to request password reset";
        throw new Error(message);
      }
    }),

  /**
   * Validate password reset token
   */
  validateResetToken: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Reset token is required"),
      })
    )
    .query(async ({ input }) => {
      try {
        const user = await validatePasswordResetToken(input.token);
        return {
          success: true,
          email: user.email,
          message: "Token is valid",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid or expired token";
        throw new Error(message);
      }
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await resetPasswordWithToken(input.token, input.newPassword);

        // Set session cookie to auto-login after password reset
        ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${user.id}; Path=/; HttpOnly; Secure; SameSite=None`);

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          message: "Password reset successfully",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Password reset failed";
        throw new Error(message);
      }
    }),
});
