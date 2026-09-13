import React from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useBookmarks } from "@/lib/bookmark-context";
import { useAuth } from "@/lib/auth-context";
import { OpportunityCard, type OpportunityItem } from "@/components/opportunity-card";
import { OpportunitySkeleton } from "@/components/opportunity-skeleton";

export default function BookmarksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  // Fetch all opportunities
  const { data: allOpps, isLoading } = trpc.opportunities.list.useQuery();

  const bookmarkedOpportunities = (allOpps ?? []).filter((opp) =>
    bookmarkedIds.has(opp.id)
  ) as OpportunityItem[];

  return (
    <ScreenContainer className="p-0 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
          {/* Header */}
          <View className="mb-6 pb-4 border-b border-border">
            <View className="flex-row items-center gap-2 mb-1">
              <View className="bg-rose-50 p-2 rounded-xl">
                <Ionicons name="heart" size={22} color="#ef4444" />
              </View>
              <Text className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Saved Opportunities
              </Text>
            </View>
            <Text className="text-sm text-muted">
              {bookmarkedOpportunities.length}{" "}
              {bookmarkedOpportunities.length === 1
                ? "opportunity"
                : "opportunities"}{" "}
              bookmarked for later review
            </Text>
          </View>

          {/* Guest Sync Prompt */}
          {!user && (
            <View className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 sm:p-5 mb-6 flex-row items-center justify-between gap-4">
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Ionicons name="sync" size={16} color="#d97706" />
                  <Text className="text-sm font-bold text-foreground">
                    Keep your bookmarks synced
                  </Text>
                </View>
                <Text className="text-xs text-muted leading-relaxed">
                  Sign up for a free student account so you don't lose your saved
                  opportunities when clearing cookies or switching devices.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup" as any)}
                className="bg-black border border-amber-400/40 px-4 py-2 rounded-xl shrink-0"
                activeOpacity={0.8}
              >
                <Text className="text-amber-400 text-xs font-bold">Sign Up Free</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading State */}
          {isLoading ? (
            <OpportunitySkeleton />
          ) : bookmarkedOpportunities.length === 0 ? (
            /* Friendly Empty State with Actions */
            <View className="bg-surface rounded-3xl border border-border p-8 sm:p-12 items-center justify-center text-center my-6">
              <View className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 items-center justify-center mb-4">
                <Ionicons name="heart-outline" size={32} color="#ef4444" />
              </View>

              <Text className="text-xl font-bold text-foreground mb-1.5">
                No saved opportunities yet
              </Text>
              <Text className="text-sm text-muted text-center max-w-md mb-6 leading-relaxed">
                As you browse internships, volunteering programs, STEM competitions, and
                grants, tap the heart icon on any card to save it here.
              </Text>

              <View className="flex-row items-center gap-3 flex-wrap justify-center">
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)")}
                  className="bg-black border border-amber-400/40 flex-row items-center gap-2 px-5 py-2.5 rounded-xl shadow-xs"
                  activeOpacity={0.85}
                >
                  <Ionicons name="compass-outline" size={16} color="#fbbf24" />
                  <Text className="text-amber-400 text-xs font-bold">
                    Browse Opportunities
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Opportunity List */
            <View className="w-full">
              {bookmarkedOpportunities.map((item) => (
                <OpportunityCard
                  key={item.id}
                  opportunity={item}
                  isBookmarked={true}
                  onToggleBookmark={toggleBookmark}
                  onPress={() => router.push(`/opportunity/${item.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
