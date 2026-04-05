import React, { createContext, useContext, useEffect, useState } from "react";
import * as Auth from "@/lib/_core/auth";
import type { User } from "@/lib/_core/auth";
import { getApiBaseUrl } from "@/constants/oauth";

export type AuthUser = User;

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  isEmailVerified: boolean;
  needsEmailVerification: boolean;
  error: string | null;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  validateResetToken: (token: string) => Promise<string>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user info on mount
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      setIsLoading(true);
      const userInfo = await Auth.getUserInfo();
      if (userInfo) {
        setUser(userInfo);
      }
    } catch (err) {
      console.error("Failed to load user info:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/trpc/auth.signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          json: { email, password, name },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Signup failed");
      }

      const data = await response.json();

      if (data.result?.data?.success) {
        const newUser: AuthUser = {
          id: data.result.data.user.id,
          openId: "",
          email: data.result.data.user.email,
          name: data.result.data.user.name,
          loginMethod: "email",
          lastSignedIn: new Date(),
        };
        setUser(newUser);
        await Auth.setUserInfo(newUser);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/trpc/auth.login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          json: { email, password },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Login failed");
      }

      const data = await response.json();

      if (data.result?.data?.success) {
        const newUser: AuthUser = {
          id: data.result.data.user.id,
          openId: "",
          email: data.result.data.user.email,
          name: data.result.data.user.name,
          loginMethod: "email",
          lastSignedIn: new Date(),
        };
        setUser(newUser);
        await Auth.setUserInfo(newUser);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      setIsLoading(true);

      const apiUrl = getApiBaseUrl();
      await fetch(`${apiUrl}/api/trpc/auth.logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ json: null }),
      });

      setUser(null);
      await Auth.clearUserInfo();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/trpc/auth.verifyEmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          json: { token },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Email verification failed");
      }

      const data = await response.json();

      if (data.result?.data?.success) {
        const verifiedUser: AuthUser = {
          id: data.result.data.user.id,
          openId: "",
          email: data.result.data.user.email,
          name: data.result.data.user.name,
          loginMethod: "email",
          lastSignedIn: new Date(),
        };
        setUser(verifiedUser);
        await Auth.setUserInfo(verifiedUser);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Email verification failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      setError(null);

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/trpc/auth.sendVerificationEmail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          json: { email },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to resend verification email");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend verification email";
      setError(message);
      throw err;
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setError(null);

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/trpc/auth.requestPasswordReset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          json: { email },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to request password reset");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request password reset";
      setError(message);
      throw err;
    }
  };

  const validateResetToken = async (token: string): Promise<string> => {
    try {
      setError(null);

      const apiUrl = getApiBaseUrl();
      const response = await fetch(
        `${apiUrl}/api/trpc/auth.validateResetToken?input=${encodeURIComponent(JSON.stringify({ token }))}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Invalid or expired token");
      }

      const data = await response.json();
      return data.result?.data?.email || "";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to validate token";
      setError(message);
      throw err;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/trpc/auth.resetPassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          json: { token, newPassword },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Password reset failed");
      }

      const data = await response.json();

      if (data.result?.data?.success) {
        const resetUser: AuthUser = {
          id: data.result.data.user.id,
          openId: "",
          email: data.result.data.user.email,
          name: data.result.data.user.name,
          loginMethod: "email",
          lastSignedIn: new Date(),
        };
        setUser(resetUser);
        await Auth.setUserInfo(resetUser);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password reset failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isSignedIn: user !== null,
    isEmailVerified: user?.emailVerified ?? false,
    needsEmailVerification: user !== null && !user.emailVerified,
    error,
    signup,
    login,
    logout,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    resetPassword,
    validateResetToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
