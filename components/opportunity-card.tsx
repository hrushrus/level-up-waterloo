import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { getCategoryMeta, getDeadlineInfo } from "@/lib/category-helpers";
import type { OpportunityTag } from "@/shared/opportunity-tags";
import { ShareModal } from "@/components/share-modal";
import { getOpportunityShareUrl } from "@/lib/share-utils";

export interface OpportunityItem {
  id: number;
  title: string;
  description: string;
  category: string;
  externalLink: string | null;
  level: string;
  type: string;
  duration: string;
  tags: OpportunityTag[] | null;
  deadline: Date | string | null;
  submittedBy?: string | null;
}

interface OpportunityCardProps {
  opportunity: OpportunityItem;
  isBookmarked: boolean;
  onToggleBookmark: (id: number) => void;
  onPress: () => void;
}

export function OpportunityCard({
  opportunity,
  isBookmarked,
  onToggleBookmark,
  onPress,
}: OpportunityCardProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const categoryMeta = getCategoryMeta(opportunity.category);
  const deadlineInfo = getDeadlineInfo(opportunity.deadline);

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

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="w-full mb-3.5 group"
      style={
        Platform.OS === "web"
          ? ({
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            } as any)
          : undefined
      }
    >
      <View
        className="bg-surface rounded-2xl border border-border overflow-hidden"
        style={{
          borderLeftWidth: 4,
          borderLeftColor: categoryMeta.color,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        <View className="p-4 sm:p-5">
          {/* Top Row: Category + Deadline + Bookmark */}
          <View className="flex-row items-center justify-between gap-2 mb-2.5">
            <View className="flex-row items-center gap-2 flex-wrap flex-1">
              {/* Category Pill */}
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: categoryMeta.bgColor,
                  borderColor: categoryMeta.borderColor,
                }}
              >
                <Ionicons
                  name={categoryMeta.icon}
                  size={13}
                  color={categoryMeta.textColor}
                />
                <Text
                  className="text-xs font-semibold"
                  style={{ color: categoryMeta.textColor }}
                >
                  {categoryMeta.shortLabel}
                </Text>
              </View>

              {/* Deadline Badge */}
              <View
                className="flex-row items-center gap-1 px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: deadlineInfo.bgColor,
                  borderColor: deadlineInfo.borderColor,
                }}
              >
                <Ionicons
                  name={deadlineInfo.isUrgent ? "flame" : "time-outline"}
                  size={12}
                  color={deadlineInfo.color}
                />
                <Text
                  className="text-xs font-medium"
                  style={{ color: deadlineInfo.color }}
                >
                  {deadlineInfo.label}
                </Text>
              </View>
            </View>

            {/* Action Buttons: Share + Bookmark */}
            <View className="flex-row items-center gap-0.5">
              <TouchableOpacity
                onPress={(event) => {
                  event.stopPropagation();
                  setShareModalOpen(true);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-1.5 rounded-full hover:bg-black/5"
                activeOpacity={0.7}
                accessibilityLabel="Share opportunity"
              >
                <Ionicons name="share-social-outline" size={18} color="#71717a" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={(event) => {
                  event.stopPropagation();
                  onToggleBookmark(opportunity.id);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-1.5 rounded-full hover:bg-black/5"
                activeOpacity={0.7}
                accessibilityLabel={
                  isBookmarked ? "Remove from bookmarks" : "Save opportunity"
                }
              >
                <Ionicons
                  name={isBookmarked ? "heart" : "heart-outline"}
                  size={20}
                  color={isBookmarked ? "#ef4444" : "#94a3b8"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title */}
          <Text className="text-lg sm:text-xl font-bold text-foreground mb-1.5 leading-snug">
            {opportunity.title}
          </Text>

          {/* Description Excerpt */}
          <Text
            className="text-sm text-muted leading-relaxed mb-3.5"
            numberOfLines={2}
          >
            {opportunity.description}
          </Text>

          {/* Metadata Chips */}
          <View className="flex-row flex-wrap items-center gap-2 mb-3.5">
            {/* Level */}
            <View className="flex-row items-center gap-1 bg-surface border border-border/80 px-2.5 py-1 rounded-lg">
              <Ionicons name="school-outline" size={13} color="#64748b" />
              <Text className="text-xs text-foreground font-medium">
                {formatLevel(opportunity.level)}
              </Text>
            </View>

            {/* Type */}
            <View className="flex-row items-center gap-1 bg-surface border border-border/80 px-2.5 py-1 rounded-lg">
              <Ionicons name="location-outline" size={13} color="#64748b" />
              <Text className="text-xs text-foreground font-medium">
                {formatType(opportunity.type)}
              </Text>
            </View>

            {/* Duration */}
            <View className="flex-row items-center gap-1 bg-surface border border-border/80 px-2.5 py-1 rounded-lg">
              <Ionicons name="time-outline" size={13} color="#64748b" />
              <Text className="text-xs text-foreground font-medium">
                {formatDuration(opportunity.duration)}
              </Text>
            </View>

            {/* Tags */}
            {(opportunity.tags ?? []).slice(0, 3).map((tag) => (
              <View
                key={tag}
                className="bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md"
              >
                <Text className="text-xs font-semibold text-amber-800">#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Footer Action Row */}
          <View className="pt-3 border-t border-border/60 flex-row items-center justify-between">
            <Text className="text-xs text-muted font-medium">
              {opportunity.submittedBy
                ? `by ${opportunity.submittedBy}`
                : "Waterloo Region"}
            </Text>

            <View className="flex-row items-center gap-1">
              <Text className="text-xs font-bold text-amber-700">
                View Details
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#d97706" />
            </View>
          </View>
        </View>
      </View>

      <ShareModal
        visible={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={opportunity.title}
        summary={opportunity.description}
        url={getOpportunityShareUrl(opportunity.id)}
        type="opportunity"
        category={categoryMeta.shortLabel}
      />
    </TouchableOpacity>
  );
}
