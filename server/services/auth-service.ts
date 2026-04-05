import { hash, compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { users, type User } from "@/drizzle/schema";

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain password with a hashed password
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return compare(password, passwordHash);
}

/**
 * Create a new user with email and password
 */
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const passwordHash = await hashPassword(password);

  // Generate a unique openId for email-based users
  const openId = `email_${email}_${Date.now()}`;

  await db.insert(users).values({
    openId,
    email,
    passwordHash,
    name,
    loginMethod: "email",
  });

  // Get the inserted user
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("Failed to create user");
  }

  return user;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Find user by ID
 */
export async function findUserById(id: number): Promise<User | null> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = await findUserByEmail(email);

  if (!user || !user.passwordHash) {
    return null;
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    return null;
  }

  // Update last signed in timestamp
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  updates: Partial<{
    name: string;
    email: string;
  }>
): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  await db.update(users).set(updates).where(eq(users.id, userId));

  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Change user password
 */
export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const user = await findUserById(userId);

  if (!user || !user.passwordHash) {
    throw new Error("User not found or has no password");
  }

  const isPasswordValid = await verifyPassword(oldPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  const newPasswordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash: newPasswordHash })
    .where(eq(users.id, userId));
}


/**
 * Generate a random verification token
 */
function generateVerificationToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Send verification email to user
 * In production, this would integrate with an email service like SendGrid or Resend
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  userName?: string
): Promise<void> {
  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  // For now, just log the token
  console.log(`[EMAIL] Verification email sent to ${email}`);
  console.log(`[EMAIL] Verification token: ${verificationToken}`);
  console.log(`[EMAIL] Verification link: ${process.env.APP_URL}/verify-email?token=${verificationToken}`);
}

/**
 * Create verification token for user
 */
export async function createVerificationToken(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db
    .update(users)
    .set({
      emailVerificationToken: token,
      emailVerificationTokenExpiresAt: expiresAt,
    })
    .where(eq(users.id, userId));

  return token;
}

/**
 * Verify email with token
 */
export async function verifyEmailWithToken(token: string): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(users)
    .where(eq(users.emailVerificationToken, token))
    .limit(1);

  const user = result.length > 0 ? result[0] : null;

  if (!user) {
    throw new Error("Invalid verification token");
  }

  // Check if token has expired
  if (user.emailVerificationTokenExpiresAt && user.emailVerificationTokenExpiresAt < new Date()) {
    throw new Error("Verification token has expired");
  }

  // Mark email as verified
  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  return user;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  const token = await createVerificationToken(user.id);
  await sendVerificationEmail(email, token, user.name || undefined);
}


/**
 * Generate a random password reset token
 */
function generatePasswordResetToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Send password reset email to user
 * In production, this would integrate with an email service like SendGrid or Resend
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string
): Promise<void> {
  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  // For now, just log the token
  console.log(`[EMAIL] Password reset email sent to ${email}`);
  console.log(`[EMAIL] Reset token: ${resetToken}`);
  console.log(`[EMAIL] Reset link: ${process.env.APP_URL}/reset-password?token=${resetToken}`);
}

/**
 * Request password reset - generates token and sends email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const user = await findUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists for security
    throw new Error("If this email is registered, you will receive a password reset link");
  }

  // Generate reset token with 1-hour expiration
  const token = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db
    .update(users)
    .set({
      passwordResetToken: token,
      passwordResetTokenExpiresAt: expiresAt,
    })
    .where(eq(users.id, user.id));

  // Send email with reset link
  await sendPasswordResetEmail(email, token, user.name || undefined);
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);

  const user = result.length > 0 ? result[0] : null;

  if (!user) {
    throw new Error("Invalid or expired reset token");
  }

  // Check if token has expired
  if (user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt < new Date()) {
    throw new Error("Reset token has expired");
  }

  // Hash new password and update
  const newPasswordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
    })
    .where(eq(users.id, user.id));

  return user;
}

/**
 * Validate password reset token
 */
export async function validatePasswordResetToken(token: string): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);

  const user = result.length > 0 ? result[0] : null;

  if (!user) {
    throw new Error("Invalid reset token");
  }

  // Check if token has expired
  if (user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt < new Date()) {
    throw new Error("Reset token has expired");
  }

  return user;
}
