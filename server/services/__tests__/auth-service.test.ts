import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createUser,
  findUserByEmail,
  findUserById,
  authenticateUser,
  updateUserProfile,
  changePassword,
} from "../auth-service";

describe("Auth Service", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";
  const testName = "Test User";

  describe("Password Hashing", () => {
    it("should hash a password", async () => {
      const hash = await hashPassword(testPassword);
      expect(hash).toBeTruthy();
      expect(hash).not.toBe(testPassword);
    });

    it("should verify a correct password", async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);
      expect(isValid).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword("WrongPassword", hash);
      expect(isValid).toBe(false);
    });
  });

  describe("User Creation", () => {
    it("should create a new user with email and password", async () => {
      const user = await createUser(testEmail, testPassword, testName);
      expect(user).toBeTruthy();
      expect(user.email).toBe(testEmail);
      expect(user.name).toBe(testName);
      expect(user.passwordHash).toBeTruthy();
      expect(user.loginMethod).toBe("email");
    });

    it("should generate a unique openId for email users", async () => {
      const user1 = await createUser(
        `user1-${Date.now()}@example.com`,
        testPassword,
        "User 1"
      );
      const user2 = await createUser(
        `user2-${Date.now()}@example.com`,
        testPassword,
        "User 2"
      );
      expect(user1.openId).not.toBe(user2.openId);
    });
  });

  describe("User Lookup", () => {
    let userId: number;

    beforeEach(async () => {
      const user = await createUser(testEmail, testPassword, testName);
      userId = user.id;
    });

    it("should find user by email", async () => {
      const user = await findUserByEmail(testEmail);
      expect(user).toBeTruthy();
      expect(user?.email).toBe(testEmail);
      expect(user?.id).toBe(userId);
    });

    it("should find user by ID", async () => {
      const user = await findUserById(userId);
      expect(user).toBeTruthy();
      expect(user?.id).toBe(userId);
      expect(user?.email).toBe(testEmail);
    });

    it("should return null for non-existent user", async () => {
      const user = await findUserByEmail("nonexistent@example.com");
      expect(user).toBeNull();
    });
  });

  describe("User Authentication", () => {
    let userId: number;

    beforeEach(async () => {
      const user = await createUser(testEmail, testPassword, testName);
      userId = user.id;
    });

    it("should authenticate user with correct password", async () => {
      const user = await authenticateUser(testEmail, testPassword);
      expect(user).toBeTruthy();
      expect(user?.email).toBe(testEmail);
      expect(user?.id).toBe(userId);
    });

    it("should reject authentication with wrong password", async () => {
      const user = await authenticateUser(testEmail, "WrongPassword");
      expect(user).toBeNull();
    });

    it("should reject authentication for non-existent user", async () => {
      const user = await authenticateUser("nonexistent@example.com", testPassword);
      expect(user).toBeNull();
    });

    it("should update lastSignedIn on successful authentication", async () => {
      const userBefore = await findUserById(userId);
      const lastSignedInBefore = userBefore?.lastSignedIn;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      await authenticateUser(testEmail, testPassword);
      const userAfter = await findUserById(userId);

      expect(userAfter?.lastSignedIn.getTime()).toBeGreaterThan(
        lastSignedInBefore?.getTime() || 0
      );
    });
  });

  describe("Profile Updates", () => {
    let userId: number;

    beforeEach(async () => {
      const user = await createUser(testEmail, testPassword, testName);
      userId = user.id;
    });

    it("should update user name", async () => {
      const newName = "Updated Name";
      const user = await updateUserProfile(userId, { name: newName });
      expect(user.name).toBe(newName);

      const verifyUser = await findUserById(userId);
      expect(verifyUser?.name).toBe(newName);
    });

    it("should update user email", async () => {
      const newEmail = `updated-${Date.now()}@example.com`;
      const user = await updateUserProfile(userId, { email: newEmail });
      expect(user.email).toBe(newEmail);

      const verifyUser = await findUserByEmail(newEmail);
      expect(verifyUser?.id).toBe(userId);
    });
  });

  describe("Password Change", () => {
    let userId: number;

    beforeEach(async () => {
      const user = await createUser(testEmail, testPassword, testName);
      userId = user.id;
    });

    it("should change password with correct old password", async () => {
      const newPassword = "NewPassword123!";
      await changePassword(userId, testPassword, newPassword);

      // Old password should not work
      const oldAuth = await authenticateUser(testEmail, testPassword);
      expect(oldAuth).toBeNull();

      // New password should work
      const newAuth = await authenticateUser(testEmail, newPassword);
      expect(newAuth).toBeTruthy();
      expect(newAuth?.id).toBe(userId);
    });

    it("should reject password change with wrong old password", async () => {
      const newPassword = "NewPassword123!";
      try {
        await changePassword(userId, "WrongPassword", newPassword);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });
});
