import { ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuth();
  const colors = useColors();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = "Password must contain uppercase, lowercase, and numbers";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await signup(email, password, name);
      // Navigation will be handled by route guards
      router.replace("/(tabs)");
    } catch (err) {
      // Error is already set in context
      console.error("Signup failed:", err);
    }
  };

  const handleLoginPress = () => {
    router.back();
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 justify-center px-6 py-8">
          {/* Header */}
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold text-foreground mb-2">Create Account</Text>
            <Text className="text-base text-muted text-center">
              Join LevelUp Waterloo to discover opportunities
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-6 bg-error/10 border border-error rounded-lg p-4">
              <Text className="text-error text-sm font-medium">{error}</Text>
            </View>
          )}

          {/* Name Field */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Full Name</Text>
            <TextInput
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-foreground text-base"
              placeholder="John Doe"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (validationErrors.name) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              editable={!isLoading}
              autoCapitalize="words"
            />
            {validationErrors.name && (
              <Text className="text-error text-xs mt-1">{validationErrors.name}</Text>
            )}
          </View>

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
            <Text className="text-xs text-muted mt-2">
              At least 8 characters with uppercase, lowercase, and numbers
            </Text>
          </View>

          {/* Confirm Password Field */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Confirm Password</Text>
            <View className="flex-row items-center border border-border rounded-lg bg-surface overflow-hidden">
              <TextInput
                className="flex-1 px-4 py-3 text-foreground text-base"
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.confirmPassword;
                      return next;
                    });
                  }
                }}
                editable={!isLoading}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                className="px-4 py-3"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <Text className="text-primary text-sm font-semibold">
                  {showConfirmPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
            {validationErrors.confirmPassword && (
              <Text className="text-error text-xs mt-1">{validationErrors.confirmPassword}</Text>
            )}
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            className="w-full bg-primary rounded-lg py-3 items-center mb-4"
            onPress={handleSignup}
            disabled={isLoading}
            style={isLoading ? { opacity: 0.6 } : {}}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row items-center justify-center">
            <Text className="text-muted text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={handleLoginPress} disabled={isLoading}>
              <Text className="text-primary font-semibold text-sm">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
