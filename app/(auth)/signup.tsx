import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuth();

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
      router.replace("/(tabs)");
    } catch (err) {
      console.error("Signup failed:", err);
    }
  };

  return (
    <ScreenContainer className="p-0 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center items-center px-4 py-8 sm:py-12">
          {/* Constrained Desktop Card */}
          <View className="max-w-md w-full">
            {/* Back to Browsing */}
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)" as any)}
              className="flex-row items-center gap-1.5 mb-6 self-start py-1.5 px-2 rounded-lg hover:bg-muted/10"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color="#0a7ea4" />
              <Text className="text-primary text-sm font-semibold">
                Back to Opportunities
              </Text>
            </TouchableOpacity>

            {/* Elevated Auth Card */}
            <View
              className="bg-surface rounded-3xl p-6 sm:p-8 border border-border"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              {/* Header with App Logo */}
              <View className="items-center mb-6">
                <View
                  style={{
                    borderWidth: 2.5,
                    borderColor: "#FBBF24",
                    borderRadius: 14,
                    padding: 4,
                    backgroundColor: "#ffffff",
                    marginBottom: 14,
                  }}
                >
                  <Image
                    source={require("@/assets/images/icon.png")}
                    style={{ width: 48, height: 48 }}
                    resizeMode="contain"
                  />
                </View>

                <Text className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1.5 text-center">
                  Create Student Account
                </Text>
                <Text className="text-xs sm:text-sm text-muted text-center leading-relaxed">
                  Save deadlines, sync bookmarks, and never miss an opportunity in Waterloo Region.
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex-row items-center gap-2">
                  <Ionicons name="alert-circle" size={18} color="#ef4444" />
                  <Text className="text-rose-700 text-xs font-medium flex-1">
                    {error}
                  </Text>
                </View>
              )}

              {/* Name Field */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Full Name
                </Text>
                <View className="flex-row items-center border border-border rounded-xl bg-background px-3 py-2.5">
                  <Ionicons name="person-outline" size={18} color="#94a3b8" />
                  <TextInput
                    className="flex-1 ml-2.5 text-foreground text-sm"
                    style={Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined}
                    placeholder="Jane Doe"
                    placeholderTextColor="#94a3b8"
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
                </View>
                {validationErrors.name && (
                  <Text className="text-rose-500 text-xs mt-1 font-medium">
                    {validationErrors.name}
                  </Text>
                )}
              </View>

              {/* Email Field */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Email Address
                </Text>
                <View className="flex-row items-center border border-border rounded-xl bg-background px-3 py-2.5">
                  <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                  <TextInput
                    className="flex-1 ml-2.5 text-foreground text-sm"
                    style={Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined}
                    placeholder="student@wrdsb.ca"
                    placeholderTextColor="#94a3b8"
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
                </View>
                {validationErrors.email && (
                  <Text className="text-rose-500 text-xs mt-1 font-medium">
                    {validationErrors.email}
                  </Text>
                )}
              </View>

              {/* Password Field */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Password
                </Text>
                <View className="flex-row items-center border border-border rounded-xl bg-background px-3 py-2.5">
                  <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                  <TextInput
                    className="flex-1 ml-2.5 text-foreground text-sm"
                    style={Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
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
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
                {validationErrors.password && (
                  <Text className="text-rose-500 text-xs mt-1 font-medium">
                    {validationErrors.password}
                  </Text>
                )}
                <Text className="text-[11px] text-muted mt-1 leading-tight">
                  At least 8 characters with uppercase, lowercase, and numbers
                </Text>
              </View>

              {/* Confirm Password Field */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </Text>
                <View className="flex-row items-center border border-border rounded-xl bg-background px-3 py-2.5">
                  <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                  <TextInput
                    className="flex-1 ml-2.5 text-foreground text-sm"
                    style={Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
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
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
                {validationErrors.confirmPassword && (
                  <Text className="text-rose-500 text-xs mt-1 font-medium">
                    {validationErrors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Signup Button */}
              <TouchableOpacity
                className="w-full bg-primary rounded-xl py-3.5 items-center mb-4 shadow-sm"
                onPress={handleSignup}
                disabled={isLoading}
                activeOpacity={0.85}
                style={isLoading ? { opacity: 0.7 } : {}}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-sm">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row items-center justify-center pt-2 border-t border-border/60">
                <Text className="text-muted text-xs">Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/(auth)/login" as any)}
                  disabled={isLoading}
                >
                  <Text className="text-primary font-bold text-xs">
                    Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
