import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Share,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "@/components/screen-container";
import { useBookmarks } from "@/lib/bookmark-context";
import { fetchOpportunity } from "@/lib/opportunities-api";
import { PageViewBadge } from "@/components/page-view-counter";
import { getCategoryMeta, getDeadlineInfo } from "@/lib/category-helpers";

interface Opportunity {
  id: number;
  title: string;
  description: string;
  category: string;
  externalLink: string | null;
  level: string;
  type: string;
  duration: string;
  tags: string[] | null;
  deadline: Date | string | null;
  submittedBy: string;
}

export default function OpportunityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);

  const opportunityId = typeof id === "string" ? parseInt(id, 10) : 0;

  // Fetch opportunity details
  const { data: opp, isLoading } = useQuery<Opportunity>({
    queryKey: ["opportunity", opportunityId],
    queryFn: () => fetchOpportunity(opportunityId),
    enabled: opportunityId > 0,
  });

  useEffect(() => {
    if (opp) {
      setOpportunity(opp as Opportunity);
    }
  }, [opp]);

  const handleOpenLink = async () => {
    if (opportunity?.externalLink) {
      try {
        await Linking.openURL(opportunity.externalLink);
      } catch (error) {
        console.error("Failed to open link:", error);
      }
    }
  };

  const handleShare = async () => {
    if (!opportunity) return;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(
          typeof window !== "undefined" ? window.location.href : (opportunity.externalLink || "")
        );
        alert("Link copied to clipboard!");
        return;
      }
      await Share.share({
        message: `Check out this student opportunity: ${opportunity.title}\n\n${opportunity.description}\n\n${opportunity.externalLink || ""}`,
        title: opportunity.title,
        url: opportunity.externalLink || undefined,
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const formatLevel = (level: string) => {
    if (level === "high_school") return "High School";
    if (level === "middle_school") return "Middle School";
    return level.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatType = (type: string) => {
    if (type === "in_person") return "In-Person";
    if (type === "online") return "Online";
    if (type === "hybrid") return "Hybrid";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDuration = (dur: string) => {
    if (dur === "short") return "Short term";
    if (dur === "medium") return "Medium term";
    if (dur === "long") return "Long term";
    return dur.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#d97706" />
        <Text className="text-muted text-sm mt-3">Loading opportunity details...</Text>
      </ScreenContainer>
    );
  }

  if (!opportunity) {
    return (
      <ScreenContainer className="p-6 items-center justify-center bg-background">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-foreground text-xl font-bold mt-3 mb-1">
          Opportunity Not Found
        </Text>
        <Text className="text-muted text-sm text-center mb-6">
          The opportunity you are looking for might have expired or been removed.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          className="bg-black border border-amber-400/40 px-6 py-3 rounded-xl shadow-xs"
        >
          <Text className="text-amber-400 font-bold">Back to Opportunities</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const categoryMeta = getCategoryMeta(opportunity.category);
  const deadlineInfo = getDeadlineInfo(opportunity.deadline);
  const isBookmarkedState = isBookmarked(opportunity.id);

  return (
    <ScreenContainer className="p-0 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8">
          {/* Top Bar: Back Link + Actions */}
          <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-border/70">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center gap-2 py-1.5 px-2.5 -ml-2.5 rounded-lg hover:bg-muted/10"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color="#d97706" />
              <Text className="text-amber-700 font-bold text-sm">
                Opportunities
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-2">
              {/* Bookmark Toggle */}
              <TouchableOpacity
                onPress={() => toggleBookmark(opportunity.id)}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                  isBookmarkedState
                    ? "bg-rose-50 border-rose-200"
                    : "bg-surface border-border"
                }`}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isBookmarkedState ? "heart" : "heart-outline"}
                  size={16}
                  color={isBookmarkedState ? "#ef4444" : "#64748b"}
                />
                <Text
                  className={`text-xs font-semibold ${
                    isBookmarkedState ? "text-rose-600" : "text-foreground"
                  }`}
                >
                  {isBookmarkedState ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>

              {/* Share */}
              <TouchableOpacity
                onPress={handleShare}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border"
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={15} color="#64748b" />
                <Text className="text-xs font-semibold text-foreground">
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Editorial Hero Header Card */}
          <View
            className="bg-surface rounded-3xl p-6 sm:p-8 border border-border mb-6 overflow-hidden"
            style={{
              borderTopWidth: 5,
              borderTopColor: categoryMeta.color,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Badges Row */}
            <View className="flex-row items-center gap-2 flex-wrap mb-4">
              <View
                className="flex-row items-center gap-1.5 px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: categoryMeta.bgColor,
                  borderColor: categoryMeta.borderColor,
                }}
              >
                <Ionicons
                  name={categoryMeta.icon}
                  size={14}
                  color={categoryMeta.textColor}
                />
                <Text
                  className="text-xs font-bold"
                  style={{ color: categoryMeta.textColor }}
                >
                  {categoryMeta.label}
                </Text>
              </View>

              <View
                className="flex-row items-center gap-1 px-3 py-1 rounded-full border"
                style={{
                  backgroundColor: deadlineInfo.bgColor,
                  borderColor: deadlineInfo.borderColor,
                }}
              >
                <Ionicons
                  name={deadlineInfo.isUrgent ? "flame" : "time-outline"}
                  size={13}
                  color={deadlineInfo.color}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: deadlineInfo.color }}
                >
                  {deadlineInfo.label}
                </Text>
              </View>

              <PageViewBadge page={`opp_${opportunity.id}`} label="views" />
            </View>

            {/* Title */}
            <Text className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3 leading-tight">
              {opportunity.title}
            </Text>

            {/* Submitted By */}
            <View className="flex-row items-center gap-2 mb-6">
              <Ionicons name="business-outline" size={16} color="#64748b" />
              <Text className="text-sm font-medium text-muted">
                Presented by{" "}
                <Text className="text-foreground font-semibold">
                  {opportunity.submittedBy || "Waterloo Region Community"}
                </Text>
              </Text>
            </View>

            {/* Primary Action Button directly in hero */}
            {opportunity.externalLink && (
              <TouchableOpacity
                onPress={handleOpenLink}
                className="bg-black border border-amber-400/50 flex-row items-center justify-center gap-2 py-3.5 px-6 rounded-2xl shadow-sm hover:opacity-95"
                activeOpacity={0.85}
              >
                <Text className="text-amber-400 text-base font-extrabold">
                  Apply / Visit Official Website
                </Text>
                <Ionicons name="open-outline" size={18} color="#fbbf24" />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Facts Grid (4 across on desktop, 2x2 on mobile) */}
          <View className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <View className="bg-surface border border-border p-4 rounded-2xl">
              <View className="flex-row items-center gap-1.5 mb-1 text-muted">
                <Ionicons name="school-outline" size={15} color="#d97706" />
                <Text className="text-xs font-semibold text-muted uppercase">
                  Level
                </Text>
              </View>
              <Text className="text-sm font-bold text-foreground">
                {formatLevel(opportunity.level)}
              </Text>
            </View>

            <View className="bg-surface border border-border p-4 rounded-2xl">
              <View className="flex-row items-center gap-1.5 mb-1 text-muted">
                <Ionicons name="location-outline" size={15} color="#d97706" />
                <Text className="text-xs font-semibold text-muted uppercase">
                  Format
                </Text>
              </View>
              <Text className="text-sm font-bold text-foreground">
                {formatType(opportunity.type)}
              </Text>
            </View>

            <View className="bg-surface border border-border p-4 rounded-2xl">
              <View className="flex-row items-center gap-1.5 mb-1 text-muted">
                <Ionicons name="time-outline" size={15} color="#d97706" />
                <Text className="text-xs font-semibold text-muted uppercase">
                  Duration
                </Text>
              </View>
              <Text className="text-sm font-bold text-foreground">
                {formatDuration(opportunity.duration)}
              </Text>
            </View>

            <View className="bg-surface border border-border p-4 rounded-2xl">
              <View className="flex-row items-center gap-1.5 mb-1 text-muted">
                <Ionicons name="calendar-outline" size={15} color="#d97706" />
                <Text className="text-xs font-semibold text-muted uppercase">
                  Deadline
                </Text>
              </View>
              <Text
                className="text-sm font-bold"
                style={{ color: deadlineInfo.color }}
              >
                {deadlineInfo.label}
              </Text>
            </View>
          </View>

          {/* About This Opportunity */}
          <View className="bg-surface rounded-3xl p-6 sm:p-8 border border-border mb-6">
            <View className="flex-row items-center gap-2 mb-4 pb-3 border-b border-border/60">
              <Ionicons name="document-text-outline" size={20} color="#d97706" />
              <Text className="text-lg font-bold text-foreground">
                About this Opportunity
              </Text>
            </View>

            <Text className="text-base sm:text-lg text-foreground leading-relaxed font-normal">
              {opportunity.description}
            </Text>

            {/* Tags Cloud */}
            {(opportunity.tags ?? []).length > 0 && (
              <View className="pt-6 mt-6 border-t border-border/60">
                <Text className="text-xs font-bold text-muted uppercase mb-3">
                  Tagged Topics
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(opportunity.tags ?? []).map((tag) => (
                    <View
                      key={tag}
                      className="bg-amber-400/10 border border-amber-400/25 px-3 py-1.5 rounded-xl"
                    >
                      <Text className="text-xs font-semibold text-amber-800">
                        #{tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Bottom Action Footer */}
          <View className="bg-surface rounded-2xl p-4 sm:p-6 border border-border flex-row items-center justify-between flex-wrap gap-4 mb-8">
            <View>
              <Text className="text-base font-bold text-foreground">
                Interested in this opportunity?
              </Text>
              <Text className="text-xs text-muted">
                Save it to your bookmarks or visit the external application page.
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => toggleBookmark(opportunity.id)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl border ${
                  isBookmarkedState
                    ? "bg-rose-50 border-rose-200"
                    : "bg-surface border-border"
                }`}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isBookmarkedState ? "heart" : "heart-outline"}
                  size={18}
                  color={isBookmarkedState ? "#ef4444" : "#64748b"}
                />
                <Text
                  className={`text-xs font-bold ${
                    isBookmarkedState ? "text-rose-600" : "text-foreground"
                  }`}
                >
                  {isBookmarkedState ? "Saved" : "Save for Later"}
                </Text>
              </TouchableOpacity>

              {opportunity.externalLink && (
                <TouchableOpacity
                  onPress={handleOpenLink}
                  className="bg-black border border-amber-400/40 flex-row items-center gap-2 px-5 py-2.5 rounded-xl shadow-xs"
                  activeOpacity={0.85}
                >
                  <Text className="text-amber-400 text-xs font-bold">
                    Apply Now
                  </Text>
                  <Ionicons name="open-outline" size={15} color="#fbbf24" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
