import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
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
      // Navigation will be handled by route guards
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 px-6 py-8">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-4xl font-bold text-foreground mb-2">Profile</Text>
            <Text className="text-base text-muted">Manage your account settings</Text>
          </View>

          {/* User Info Card */}
          {user && (
            <View className="bg-surface border border-border rounded-2xl p-6 mb-8">
              {/* Name */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-muted mb-1">Full Name</Text>
                <Text className="text-lg font-semibold text-foreground">{user.name || "Not set"}</Text>
              </View>

              {/* Email */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-muted mb-1">Email</Text>
                <Text className="text-lg font-semibold text-foreground">{user.email || "Not set"}</Text>
              </View>

              {/* Login Method */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-muted mb-1">Login Method</Text>
                <View className="bg-background rounded-lg px-3 py-2 inline-flex">
                  <Text className="text-sm font-semibold text-foreground capitalize">
                    {user.loginMethod === "email" ? "Email & Password" : user.loginMethod}
                  </Text>
                </View>
              </View>

              {/* Member Since */}
              <View>
                <Text className="text-sm font-semibold text-muted mb-1">Member Since</Text>
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

          {/* Account Actions */}
          <View className="mb-8">
            <Text className="text-sm font-semibold text-muted mb-4">Account Settings</Text>

            {/* Edit Profile Button */}
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 mb-3">
              <Text className="text-foreground font-semibold text-base">Edit Profile</Text>
            </TouchableOpacity>

            {/* Change Password Button */}
            <TouchableOpacity className="bg-surface border border-border rounded-lg py-3 px-4 mb-3">
              <Text className="text-foreground font-semibold text-base">Change Password</Text>
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="w-full bg-error rounded-lg py-3 items-center"
            onPress={handleLogout}
            disabled={isLoggingOut}
            style={isLoggingOut ? { opacity: 0.6 } : {}}
          >
            {isLoggingOut ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">Sign Out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
