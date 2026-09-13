import React from "react";
import { View, Text, TouchableOpacity, Image, Platform } from "react-native";
import { useRouter, useSegments } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/lib/auth-context";
import { useBookmarks } from "@/lib/bookmark-context";
import { useColors } from "@/hooks/use-colors";

export function TopNavbar() {
  const router = useRouter();
  const segments = useSegments();
  const { user, logout } = useAuth();
  const { bookmarkedIds } = useBookmarks();
  const colors = useColors();

  // Determine current active tab
  // segments for tabs are usually ["(tabs)"] or ["(tabs)", "bookmarks"] or ["(tabs)", "profile"]
  const currentTab = (segments[1] as string) || "index";
  const isHome = currentTab === "index";
  const isBookmarks = currentTab === "bookmarks";
  const isSuggest = currentTab === "suggest";
  const isDonate = currentTab === "donate";
  const isProfile = currentTab === "profile";

  return (
    <View
      className="w-full bg-background border-b border-border z-50"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View className="max-w-6xl mx-auto w-full px-4 py-2.5 flex-row items-center justify-between">
        {/* Left: Brand / Logo */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)" as any)}
          className="flex-row items-center gap-2.5"
          activeOpacity={0.8}
        >
          <View
            style={{
              borderWidth: 2,
              borderColor: "#FBBF24",
              borderRadius: 10,
              padding: 2,
              backgroundColor: "#ffffff",
            }}
          >
            <Image
              source={require("@/assets/images/icon.png")}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text className="text-base font-bold text-foreground tracking-tight">
              LevelUp <Text className="text-amber-500 font-black">Waterloo</Text>
            </Text>
          </View>
        </TouchableOpacity>

        {/* Center: Navigation Links */}
        <View className="flex-row items-center gap-1 sm:gap-2">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)" as any)}
            className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${
              isHome ? "bg-amber-400/15" : ""
            }`}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isHome ? "compass" : "compass-outline"}
              size={15}
              color={isHome ? "#d97706" : "#71717a"}
            />
            <Text
              className={`text-sm font-semibold ${
                isHome ? "text-amber-700 font-bold" : "text-muted"
              }`}
            >
              Opportunities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/bookmarks" as any)}
            className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${
              isBookmarks ? "bg-amber-400/15" : ""
            }`}
            activeOpacity={0.7}
          >
            <Ionicons
              name={bookmarkedIds.size > 0 ? "heart" : "heart-outline"}
              size={15}
              color={bookmarkedIds.size > 0 ? "#ef4444" : isBookmarks ? "#d97706" : "#71717a"}
            />
            <Text
              className={`text-sm font-semibold ${
                isBookmarks ? "text-amber-700 font-bold" : "text-muted"
              }`}
            >
              Saved{bookmarkedIds.size > 0 ? ` (${bookmarkedIds.size})` : ""}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!user) {
                router.push("/(auth)/login" as any);
              } else {
                router.push("/(tabs)/suggest" as any);
              }
            }}
            className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${
              isSuggest ? "bg-amber-400/15" : ""
            }`}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSuggest ? "bulb" : "bulb-outline"}
              size={15}
              color={isSuggest ? "#d97706" : "#71717a"}
            />
            <Text
              className={`text-sm font-semibold ${
                isSuggest ? "text-amber-700 font-bold" : "text-muted"
              }`}
            >
              Suggest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/donate" as any)}
            className={`px-3 py-1.5 rounded-full flex-row items-center gap-1.5 ${
              isDonate ? "bg-amber-400/15" : ""
            }`}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDonate ? "gift" : "gift-outline"}
              size={15}
              color={isDonate ? "#d97706" : "#71717a"}
            />
            <Text
              className={`text-sm font-semibold ${
                isDonate ? "text-amber-700 font-bold" : "text-muted"
              }`}
            >
              Support
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right: Integrated Auth / Account */}
        <View className="flex-row items-center gap-2">
          {user?.role === "admin" && (
            <TouchableOpacity
              onPress={() => router.push("/admin" as any)}
              className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400 flex-row items-center gap-1"
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark" size={13} color="#d97706" />
              <Text className="text-xs font-bold text-amber-800">Admin</Text>
            </TouchableOpacity>
          )}

          {user ? (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile" as any)}
                className={`flex-row items-center px-3 py-1.5 rounded-full border gap-1.5 ${
                  isProfile
                    ? "bg-amber-400/15 border-amber-400"
                    : "bg-surface border-border"
                }`}
                activeOpacity={0.7}
              >
                <Ionicons name="person-circle-outline" size={17} color="#d97706" />
                <Text
                  className="text-xs font-semibold text-foreground"
                  numberOfLines={1}
                >
                  {user.name ? user.name.split(" ")[0] : "Account"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await logout();
                    router.replace("/(tabs)");
                  } catch (e) {
                    console.error("Logout error:", e);
                  }
                }}
                className="px-2.5 py-1.5 rounded-full"
                activeOpacity={0.7}
              >
                <Text className="text-xs text-muted font-medium">Log out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login" as any)}
                className="px-3 py-1.5 rounded-full"
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-muted">Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup" as any)}
                className="bg-black border border-amber-400/40 px-4 py-1.5 rounded-full shadow-xs"
                activeOpacity={0.8}
              >
                <Text className="text-sm font-bold text-amber-400">Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
