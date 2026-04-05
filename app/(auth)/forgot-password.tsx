import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useColors();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch("http://127.0.0.1:3000/api/trpc/auth.requestPasswordReset", {
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

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request password reset";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center px-6">
        <View className="items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-success items-center justify-center">
            <Text className="text-3xl">✓</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Check Your Email</Text>
          <Text className="text-base text-muted text-center">
            If an account exists with this email, you will receive a password reset link. Please check your inbox and spam folder.
          </Text>
          <Text className="text-sm text-muted text-center mt-4">
            Redirecting to login in 3 seconds...
          </Text>
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
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-4xl font-bold text-foreground mb-2">Forgot Password?</Text>
            <Text className="text-base text-muted">
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-error/10 border border-error rounded-lg p-4 mb-6">
              <Text className="text-error font-semibold">{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-muted mb-2">Email Address</Text>
            <TextInput
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className="w-full bg-primary rounded-lg py-3 items-center mb-4"
            onPress={handleRequestReset}
            disabled={isLoading || !email.trim()}
            style={isLoading || !email.trim() ? { opacity: 0.6 } : {}}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Send Reset Link</Text>
            )}
          </TouchableOpacity>

          {/* Security Questions Option */}
          <View className="my-6 border-t border-border pt-6">
            <Text className="text-sm font-semibold text-foreground mb-3">Alternative Recovery Method</Text>
            <TouchableOpacity
              className="w-full bg-surface border border-border rounded-lg py-3 items-center"
              onPress={() => router.push({ pathname: "/(auth)/verify-security-questions", params: { email } })}
            >
              <Text className="text-foreground font-semibold text-base">Use Security Questions</Text>
            </TouchableOpacity>
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            className="w-full bg-surface border border-border rounded-lg py-3 items-center"
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text className="text-foreground font-semibold text-base">Back to Login</Text>
          </TouchableOpacity>

          {/* Info Box */}
          <View className="mt-8 bg-surface border border-border rounded-lg p-4">
            <Text className="text-sm font-semibold text-foreground mb-2">How it works:</Text>
            <Text className="text-sm text-muted leading-relaxed">
              1. Enter your email address{"\n"}
              2. Check your email for a reset link{"\n"}
              3. Click the link to create a new password{"\n"}
              4. You'll be logged in automatically
            </Text>
          </View>

          {/* Help Text */}
          <View className="mt-8">
            <Text className="text-xs text-muted text-center">
              Didn't receive an email? Check your spam folder or try again with a different email address.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
