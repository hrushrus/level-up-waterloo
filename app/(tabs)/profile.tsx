import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const colors = useColors();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
          {/* Header */}
          <View className="mb-6 pb-4 border-b border-border">
            <View className="flex-row items-center gap-2.5 mb-1">
              <View className="bg-amber-400/15 p-2 rounded-xl">
                <Ionicons name="person" size={22} color="#d97706" />
              </View>
              <Text className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {user ? "Student Profile" : "Account"}
              </Text>
            </View>
            <Text className="text-sm text-muted">
              {user
                ? "Manage your account and saved opportunity preferences"
                : "Sign in or create an account to sync your saved opportunities"}
            </Text>
          </View>

          {!user && (
            <View className="bg-surface border border-border rounded-3xl p-6 sm:p-8 mb-8 shadow-xs">
              <View className="mb-5">
                <Text className="text-xl font-bold text-foreground mb-2">
                  Create Account or Sign In
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  Join LevelUp Waterloo to save opportunities, track closing deadlines, sync bookmarks across your laptop and phone, and stay ahead.
                </Text>
              </View>

              <TouchableOpacity
                className="w-full bg-black border border-amber-400/40 rounded-xl py-3.5 items-center mb-3 shadow-sm"
                onPress={() => router.push("/(auth)/signup" as any)}
                activeOpacity={0.85}
              >
                <Text className="text-amber-400 font-bold text-sm">
                  Create Free Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full bg-background border border-border rounded-xl py-3.5 items-center mb-4"
                onPress={() => router.push("/(auth)/login" as any)}
                activeOpacity={0.8}
              >
                <Text className="text-foreground font-semibold text-sm">
                  Sign In to Existing Account
                </Text>
              </TouchableOpacity>

              <View className="border-t border-border/60 pt-4">
                <Text className="text-xs text-muted text-center leading-relaxed">
                  You can browse and explore all opportunities as a guest anytime.
                </Text>
              </View>
            </View>
          )}

          {/* User Info Card */}
          {user && (
            <View className="bg-surface border border-border rounded-3xl p-6 sm:p-8 mb-6 shadow-xs">
              {/* Name */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Full Name
                </Text>
                <Text className="text-lg font-bold text-foreground">
                  {user.name || "Student"}
                </Text>
              </View>

              {/* Email */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Email
                </Text>
                <Text className="text-base font-medium text-foreground">
                  {user.email || "Not set"}
                </Text>
              </View>

              {/* Login Method */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Login Method
                </Text>
                <View className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 self-start">
                  <Text className="text-xs font-semibold text-primary capitalize">
                    {user.loginMethod === "email" ? "Email & Password" : user.loginMethod}
                  </Text>
                </View>
              </View>

              {/* Member Since */}
              <View>
                <Text className="text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Member Since
                </Text>
                <Text className="text-sm text-foreground">
                  {new Date(user.lastSignedIn).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
          )}

          {user && (
            <View className="gap-3">
              {/* Logout Button */}
              <TouchableOpacity
                className="w-full bg-rose-50 border border-rose-200 rounded-2xl py-3.5 items-center flex-row justify-center gap-2"
                onPress={handleLogout}
                disabled={isLoggingOut}
                activeOpacity={0.8}
                style={isLoggingOut ? { opacity: 0.6 } : {}}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="#ef4444" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                    <Text className="text-rose-600 font-bold text-sm">
                      Sign Out
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
