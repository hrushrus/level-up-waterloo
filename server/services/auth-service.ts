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
