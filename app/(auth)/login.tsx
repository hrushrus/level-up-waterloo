import { ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const colors = useColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
      // Navigation will be handled by route guards
      router.replace("/(tabs)");
    } catch (err) {
      // Error is already set in context
      console.error("Login failed:", err);
    }
  };

  const handleSignupPress = () => {
    router.push("/(auth)/signup" as any);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 justify-center px-6 py-8">
          {/* Header */}
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold text-foreground mb-2">Welcome Back</Text>
            <Text className="text-base text-muted text-center">
              Sign in to your LevelUp Waterloo account
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-6 bg-error/10 border border-error rounded-lg p-4">
              <Text className="text-error text-sm font-medium">{error}</Text>
            </View>
          )}

          {/* Email Field */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
            <TextInput
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-foreground text-base"
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (validationErrors.email) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next.email;
                    return next;
                  });
                }
              }}
              editable={!isLoading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {validationErrors.email && (
              <Text className="text-error text-xs mt-1">{validationErrors.email}</Text>
            )}
          </View>

          {/* Password Field */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
            <View className="flex-row items-center border border-border rounded-lg bg-surface overflow-hidden">
              <TextInput
                className="flex-1 px-4 py-3 text-foreground text-base"
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (validationErrors.password) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.password;
                      return next;
                    });
                  }
                }}
                editable={!isLoading}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                className="px-4 py-3"
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <Text className="text-primary text-sm font-semibold">
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
            {validationErrors.password && (
              <Text className="text-error text-xs mt-1">{validationErrors.password}</Text>
            )}
          </View>

          {/* Forgot Password Link */}
          <View className="flex-row justify-end mb-6">
            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password" as any)} disabled={isLoading}>
              <Text className="text-primary font-semibold text-sm">Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className="w-full bg-primary rounded-lg py-3 items-center mb-4"
            onPress={handleLogin}
            disabled={isLoading}
            style={isLoading ? { opacity: 0.6 } : {}}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Signup Link */}
          <View className="flex-row items-center justify-center">
            <Text className="text-muted text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignupPress} disabled={isLoading}>
              <Text className="text-primary font-semibold text-sm">Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
