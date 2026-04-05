import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token: urlToken } = useLocalSearchParams<{ token?: string }>();
  const colors = useColors();

  const [token, setToken] = useState(urlToken || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(!!urlToken);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  // Validate token on mount if provided in URL
  useEffect(() => {
    if (urlToken) {
      validateToken(urlToken);
    }
  }, [urlToken]);

  const validateToken = async (resetToken: string) => {
    try {
      setIsValidating(true);
      setError("");

      const response = await fetch("http://127.0.0.1:3000/api/trpc/auth.validateResetToken", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      // For GET requests with input, we need to pass token as query param
      // This is a workaround - ideally should be POST
      const validateResponse = await fetch(
        `http://127.0.0.1:3000/api/trpc/auth.validateResetToken?input=${encodeURIComponent(JSON.stringify({ token: resetToken }))}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        throw new Error(errorData.error?.message || "Invalid or expired token");
      }

      setTokenValid(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to validate token";
      setError(message);
      setTokenValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token.trim()) {
      setError("Reset token is required");
      return;
    }

    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch("http://127.0.0.1:3000/api/trpc/auth.resetPassword", {
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

      setSuccess(true);
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password reset failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-foreground mt-4">Validating reset link...</Text>
      </ScreenContainer>
    );
  }

  if (success) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center px-6">
        <View className="items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-success items-center justify-center">
            <Text className="text-3xl">✓</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Password Reset!</Text>
          <Text className="text-base text-muted text-center">
            Your password has been successfully reset. You are now logged in.
          </Text>
          <Text className="text-sm text-muted text-center mt-4">
            Redirecting to home in 2 seconds...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!tokenValid && error) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center px-6">
        <View className="items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-error/10 border border-error items-center justify-center">
            <Text className="text-3xl">✕</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Invalid Link</Text>
          <Text className="text-base text-muted text-center">{error}</Text>
          <TouchableOpacity
            className="mt-6 bg-primary rounded-lg px-6 py-3"
            onPress={() => router.replace("/(auth)/forgot-password")}
          >
            <Text className="text-white font-semibold">Request New Link</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 px-6 py-8">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-4xl font-bold text-foreground mb-2">Reset Password</Text>
            <Text className="text-base text-muted">
              Enter your new password below to regain access to your account.
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-error/10 border border-error rounded-lg p-4 mb-6">
              <Text className="text-error font-semibold">{error}</Text>
            </View>
          )}

          {/* Token Input (hidden if from URL) */}
          {!urlToken && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-muted mb-2">Reset Token</Text>
              <TextInput
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                placeholder="Enter token from email"
                placeholderTextColor={colors.muted}
                value={token}
                onChangeText={setToken}
                editable={!isLoading}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {/* New Password Input */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-muted mb-2">New Password</Text>
            <View className="flex-row items-center bg-surface border border-border rounded-lg px-4">
              <TextInput
                className="flex-1 py-3 text-foreground"
                placeholder="At least 8 characters"
                placeholderTextColor={colors.muted}
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!isLoading}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text className="text-primary font-semibold">{showPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-muted mb-2">Confirm Password</Text>
            <View className="flex-row items-center bg-surface border border-border rounded-lg px-4">
              <TextInput
                className="flex-1 py-3 text-foreground"
                placeholder="Re-enter your password"
                placeholderTextColor={colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isLoading}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Text className="text-primary font-semibold">{showConfirmPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            className="w-full bg-primary rounded-lg py-3 items-center mb-4"
            onPress={handleResetPassword}
            disabled={isLoading || !token.trim() || !newPassword.trim() || !confirmPassword.trim()}
            style={isLoading || !token.trim() || !newPassword.trim() || !confirmPassword.trim() ? { opacity: 0.6 } : {}}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Reset Password</Text>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity
            className="w-full bg-surface border border-border rounded-lg py-3 items-center"
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text className="text-foreground font-semibold text-base">Back to Login</Text>
          </TouchableOpacity>

          {/* Password Requirements */}
          <View className="mt-8 bg-surface border border-border rounded-lg p-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Password Requirements:</Text>
            <Text className="text-sm text-muted leading-relaxed">
              • At least 8 characters{"\n"}
              • Mix of uppercase and lowercase{"\n"}
              • Include numbers or symbols for security
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
