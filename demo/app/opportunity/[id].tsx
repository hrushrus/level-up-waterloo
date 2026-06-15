import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Linking, Share } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useBookmarks } from "@/lib/bookmark-context";
import { useEffect, useState } from "react";

interface Opportunity {
  id: number;
  title: string;
  description: string;
  category: string;
  externalLink: string | null;
  level: string;
  type: string;
  duration: string;
  deadline: Date | null;
  submittedBy: string;
}

export default function OpportunityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);

  const opportunityId = typeof id === "string" ? parseInt(id, 10) : 0;

  // Fetch opportunity details
  const { data: opp, isLoading } = trpc.opportunities.byId.useQuery(
    { id: opportunityId },
    { enabled: opportunityId > 0 }
  );

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
      await Share.share({
        message: `Check out this opportunity: ${opportunity.title}\n\n${opportunity.description}\n\nLearn more at: ${opportunity.externalLink || "LevelUp Waterloo"}`,
        title: opportunity.title,
        url: opportunity.externalLink || undefined,
      });
    } catch (error) {
      console.error("Failed to share:", error);
    }
  };

  const formatDate = (date: Date | null | string) => {
    if (!date) return "No deadline";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const getDaysUntilDeadline = (deadline: Date | null | string) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const today = new Date();
    const diff = d.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  };

  const daysLeft = opportunity ? getDaysUntilDeadline(opportunity.deadline) : null;
  const isBookmarkedState = opportunity ? isBookmarked(opportunity.id) : false;

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  if (!opportunity) {
    return (
      <ScreenContainer className="p-4 items-center justify-center">
        <Text className="text-foreground text-lg">Opportunity not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-primary px-6 py-3 rounded-lg">
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header with back button */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-2">
              <Text className="text-primary text-lg">←</Text>
              <Text className="text-primary font-semibold">Back</Text>
            </TouchableOpacity>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => opportunity && toggleBookmark(opportunity.id)}
                className="p-2"
              >
                <Text className="text-2xl">{isBookmarkedState ? "❤️" : "🤍"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} className="p-2">
                <Text className="text-2xl">📤</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Title and Category */}
          <View className="gap-2">
            <View className="flex-row gap-2 flex-wrap">
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-xs font-medium text-primary capitalize">
                  {opportunity.category.replace("_", " ")}
                </Text>
              </View>
              {daysLeft && daysLeft <= 30 && (
                <View className="bg-warning/10 px-3 py-1 rounded-full">
                  <Text className="text-xs font-medium text-warning">
                    {daysLeft} days left
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-3xl font-bold text-foreground">{opportunity.title}</Text>
            <Text className="text-sm text-muted">Submitted by {opportunity.submittedBy}</Text>
          </View>

          {/* Metadata */}
          <View className="bg-surface rounded-lg p-4 gap-3 border border-border">
            <View className="flex-row justify-between">
              <View>
                <Text className="text-xs text-muted mb-1">Level</Text>
                <Text className="text-sm font-semibold text-foreground capitalize">
                  {opportunity.level.replace("_", " ")}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Type</Text>
                <Text className="text-sm font-semibold text-foreground capitalize">
                  {opportunity.type.replace("_", " ")}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted mb-1">Duration</Text>
                <Text className="text-sm font-semibold text-foreground capitalize">
                  {opportunity.duration}
                </Text>
              </View>
            </View>
          </View>

          {/* Deadline */}
          <View className="bg-surface rounded-lg p-4 border border-border">
            <Text className="text-xs text-muted mb-1">Deadline</Text>
            <Text className="text-lg font-semibold text-foreground">
              {formatDate(opportunity.deadline)}
            </Text>
            {daysLeft && (
              <Text className="text-sm text-muted mt-1">
                {daysLeft > 0 ? `${daysLeft} days remaining` : "Deadline passed"}
              </Text>
            )}
          </View>

          {/* Description */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">About This Opportunity</Text>
            <Text className="text-base text-foreground leading-relaxed">{opportunity.description}</Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-3 mt-4">
            {opportunity.externalLink && (
              <TouchableOpacity
                onPress={handleOpenLink}
                className="bg-primary px-6 py-4 rounded-lg items-center"
              >
                <Text className="text-white font-semibold text-lg">Learn More & Apply</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-surface border border-border px-6 py-4 rounded-lg items-center"
            >
              <Text className="text-foreground font-semibold">Back to Opportunities</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
