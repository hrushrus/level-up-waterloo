import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/lib/auth-context";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token: urlToken } = useLocalSearchParams<{ token?: string }>();
  const colors = useColors();
  const { user } = useAuth();

  const [token, setToken] = useState(urlToken || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Auto-verify if token is provided in URL
  useEffect(() => {
    if (urlToken && urlToken.length > 0) {
      handleVerify(urlToken);
    }
  }, [urlToken]);

  const handleVerify = async (verificationToken: string) => {
    if (!verificationToken.trim()) {
      setError("Please enter or provide a verification token");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch("http://127.0.0.1:3000/api/trpc/auth.verifyEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          json: { token: verificationToken },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Verification failed");
      }

      const data = await response.json();

      if (data.result?.data?.success) {
        setSuccess(true);
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 2000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email) {
      setError("Email address not found");
      return;
    }

    try {
      setError("");
      setResendLoading(true);

      const response = await fetch("http://127.0.0.1:3000/api/trpc/auth.sendVerificationEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          json: { email: user.email },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to resend email");
      }

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend email";
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center px-6">
        <View className="items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-success items-center justify-center">
            <Text className="text-3xl">✓</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Email Verified!</Text>
          <Text className="text-base text-muted text-center">
            Your email has been successfully verified. Redirecting to home...
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
            <Text className="text-4xl font-bold text-foreground mb-2">Verify Email</Text>
            <Text className="text-base text-muted">
              Enter the verification code sent to your email address
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-error/10 border border-error rounded-lg p-4 mb-6">
              <Text className="text-error font-semibold">{error}</Text>
            </View>
          )}

          {/* Resend Success Message */}
          {resendSuccess && (
            <View className="bg-success/10 border border-success rounded-lg p-4 mb-6">
              <Text className="text-success font-semibold">
                Verification email sent! Check your inbox.
              </Text>
            </View>
          )}

          {/* Token Input */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-muted mb-2">Verification Code</Text>
            <TextInput
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="Enter verification code"
              placeholderTextColor={colors.muted}
              value={token}
              onChangeText={setToken}
              editable={!isLoading}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            className="w-full bg-primary rounded-lg py-3 items-center mb-4"
            onPress={() => handleVerify(token)}
            disabled={isLoading || !token.trim()}
            style={isLoading || !token.trim() ? { opacity: 0.6 } : {}}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Verify Email</Text>
            )}
          </TouchableOpacity>

          {/* Resend Email Button */}
          <TouchableOpacity
            className="w-full bg-surface border border-border rounded-lg py-3 items-center"
            onPress={handleResendEmail}
            disabled={resendLoading}
            style={resendLoading ? { opacity: 0.6 } : {}}
          >
            {resendLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text className="text-primary font-semibold text-base">Resend Code</Text>
            )}
          </TouchableOpacity>

          {/* Info Box */}
          <View className="mt-8 bg-surface border border-border rounded-lg p-4">
            <Text className="text-sm font-semibold text-foreground mb-2">How it works:</Text>
            <Text className="text-sm text-muted leading-relaxed">
              1. Check your email for a verification code{"\n"}
              2. Enter the code above{"\n"}
              3. Your account will be verified and you can start using LevelUp Waterloo
            </Text>
          </View>

          {/* Help Text */}
          <View className="mt-8">
            <Text className="text-xs text-muted text-center">
              Didn't receive an email? Check your spam folder or click "Resend Code" above.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
