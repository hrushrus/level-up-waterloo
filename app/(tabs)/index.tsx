import React, { useState, useEffect, useMemo } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "@/components/screen-container";
import { useBookmarks } from "@/lib/bookmark-context";
import { useAuth } from "@/lib/auth-context";
import {
  OPPORTUNITY_TAGS,
  type OpportunityTag,
} from "@/shared/opportunity-tags";
import { fetchOpportunities } from "@/lib/opportunities-api";
import { PageViewBadge } from "@/components/page-view-counter";
import { OpportunityCard, type OpportunityItem } from "@/components/opportunity-card";
import { OpportunitySkeleton } from "@/components/opportunity-skeleton";
import {
  CATEGORIES_CONFIG,
  getCategoryMeta,
} from "@/lib/category-helpers";

const LEVELS = [
  { id: "both", label: "All Levels" },
  { id: "middle_school", label: "Middle School" },
  { id: "high_school", label: "High School" },
];

const TYPES = [
  { id: "in_person", label: "In-Person" },
  { id: "online", label: "Online" },
  { id: "hybrid", label: "Hybrid" },
];

const DURATIONS = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
];

const QUICK_SHORTCUTS = [
  { id: "closing_soon", label: "Closing Soon", icon: "flame" as const, color: "#ef4444" },
  { id: "volunteering", label: "Volunteering", icon: "people" as const, color: "#10b981" },
  { id: "stem_competition", label: "STEM & Tech", icon: "code-slash" as const, color: "#6366f1" },
  { id: "grant", label: "Grants & Awards", icon: "ribbon" as const, color: "#f59e0b" },
  { id: "extracurricular", label: "Clubs", icon: "trophy" as const, color: "#8b5cf6" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [showSignupBanner, setShowSignupBanner] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("both");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<OpportunityTag[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "deadline" | "alphabetical">("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch opportunities query
  const {
    data: allOpps,
    isLoading,
    error: queryError,
    refetch: refetchAllOpps,
  } = useQuery<OpportunityItem[]>({
    queryKey: ["opportunities"],
    queryFn: fetchOpportunities,
  });

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!allOpps) return counts;
    counts.all = allOpps.length;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    counts.closing_soon = allOpps.filter((opp) => {
      if (!opp.deadline) return false;
      const d = new Date(opp.deadline);
      return d <= thirtyDaysFromNow && d >= now;
    }).length;

    for (const opp of allOpps) {
      counts[opp.category] = (counts[opp.category] || 0) + 1;
    }
    return counts;
  }, [allOpps]);

  // Filter and sort opportunities
  const filteredAndSorted = useMemo(() => {
    if (!allOpps) return [];
    let filtered = [...allOpps];

    // Category filter
    if (selectedCategory === "closing_soon") {
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      filtered = filtered.filter((opp) => {
        if (!opp.deadline) return false;
        const d = new Date(opp.deadline);
        return d <= thirtyDays && d >= now;
      });
    } else if (selectedCategory !== "all") {
      filtered = filtered.filter((opp) => opp.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((opp) => {
        const titleMatch = opp.title.toLowerCase().includes(q);
        const descMatch = opp.description.toLowerCase().includes(q);
        const tagMatch = (opp.tags ?? []).some((t) => t.toLowerCase().includes(q));
        const catMatch = opp.category.toLowerCase().includes(q);
        const submitterMatch = (opp.submittedBy ?? "").toLowerCase().includes(q);
        return titleMatch || descMatch || tagMatch || catMatch || submitterMatch;
      });
    }

    // Level filter
    if (selectedLevel !== "both") {
      filtered = filtered.filter(
        (opp) => opp.level === selectedLevel || opp.level === "both"
      );
    }

    // Type filter
    if (selectedType !== null) {
      filtered = filtered.filter((opp) => opp.type === selectedType);
    }

    // Duration filter
    if (selectedDuration !== null) {
      filtered = filtered.filter((opp) => opp.duration === selectedDuration);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((opp) =>
        selectedTags.some((tag) => (opp.tags ?? []).includes(tag))
      );
    }

    // Sort
    if (sortBy === "deadline") {
      filtered.sort((a, b) => {
        const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return aTime - bTime;
      });
    } else if (sortBy === "alphabetical") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [
    allOpps,
    selectedCategory,
    searchQuery,
    selectedLevel,
    selectedType,
    selectedDuration,
    selectedTags,
    sortBy,
  ]);

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedLevel !== "both" ||
    selectedType !== null ||
    selectedDuration !== null ||
    selectedTags.length > 0 ||
    searchQuery.trim().length > 0;

  const resetAllFilters = () => {
    setSelectedCategory("all");
    setSelectedLevel("both");
    setSelectedType(null);
    setSelectedDuration(null);
    setSelectedTags([]);
    setSearchQuery("");
  };

  return (
    <ScreenContainer className="p-0 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Constrained Layout */}
        <View className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
          {/* Action-Oriented Hero & Search Area */}
          <View
            className="rounded-3xl p-6 sm:p-8 mb-6 border border-zinc-800 overflow-hidden"
            style={{
              backgroundColor: "#121316",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {/* Top Badge */}
            <View className="flex-row items-center gap-2 mb-3">
              <View className="bg-amber-400/15 border border-amber-400/30 px-3 py-1 rounded-full flex-row items-center gap-1.5">
                <Ionicons name="sparkles" size={13} color="#f59e0b" />
                <Text className="text-xs font-bold text-amber-400 tracking-wide">
                  Waterloo Region Student Hub
                </Text>
              </View>
            </View>

            {/* Headline & Subtitle */}
            <Text className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              Level up your high school journey.
            </Text>
            <Text className="text-sm sm:text-base text-zinc-300 max-w-2xl mb-6 leading-relaxed">
              Discover internships, volunteer hours, STEM competitions, scholarships,
              and extracurricular programs designed for students in Waterloo Region.
            </Text>

            {/* Search Input Bar */}
            <View
              className="bg-white rounded-2xl border border-zinc-200 p-2 sm:p-2.5 flex-row items-center mb-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <View className="pl-3 pr-2">
                <Ionicons name="search-outline" size={20} color="#d97706" />
              </View>
              <TextInput
                placeholder="Search opportunities by title, topic, or tags..."
                placeholderTextColor="#71717a"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-base text-zinc-900 py-2 outline-none"
                style={Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : undefined}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  className="p-2"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color="#71717a" />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Filter Shortcuts */}
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-xs font-semibold text-zinc-400 mr-1">
                Quick search:
              </Text>
              {QUICK_SHORTCUTS.map((shortcut) => {
                const isActive = selectedCategory === shortcut.id;
                return (
                  <TouchableOpacity
                    key={shortcut.id}
                    onPress={() =>
                      setSelectedCategory(isActive ? "all" : shortcut.id)
                    }
                    className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                      isActive
                        ? "bg-amber-400 border-amber-300"
                        : "bg-zinc-900/90 border-zinc-700"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={shortcut.icon}
                      size={13}
                      color={isActive ? "#000000" : shortcut.id === "closing_soon" ? "#fbbf24" : "#e4e4e7"}
                    />
                    <Text
                      className={`text-xs font-bold ${
                        isActive ? "text-black" : "text-zinc-200"
                      }`}
                    >
                      {shortcut.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Guest Sign Up Callout Banner */}
          {!user && showSignupBanner && (
            <View className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 sm:p-5 mb-6">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Ionicons name="bookmark" size={16} color="#d97706" />
                    <Text className="text-base font-bold text-foreground">
                      Never lose an application deadline
                    </Text>
                  </View>
                  <Text className="text-sm text-muted mb-3 leading-snug">
                    Create a free student account to save your favorite opportunities, sync bookmarks, and keep track of closing dates across devices.
                  </Text>
                  <View className="flex-row items-center gap-2.5">
                    <TouchableOpacity
                      onPress={() => router.push("/(auth)/signup" as any)}
                      className="bg-black border border-amber-400/40 px-4 py-2 rounded-xl shadow-xs"
                      activeOpacity={0.8}
                    >
                      <Text className="text-amber-400 text-xs font-bold">
                        Create Free Account
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push("/(auth)/login" as any)}
                      className="bg-surface border border-border px-3.5 py-2 rounded-xl"
                      activeOpacity={0.8}
                    >
                      <Text className="text-foreground text-xs font-semibold">
                        Sign In
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowSignupBanner(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  className="p-1"
                >
                  <Ionicons name="close" size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Main Two-Column or Stacked Responsive Layout */}
          <View className={isDesktop ? "flex-row gap-8 items-start" : "flex-col gap-4"}>
            {/* LEFT COLUMN: Sidebar Filters on Desktop */}
            {isDesktop ? (
              <View className="w-72 shrink-0 gap-6 sticky top-4">
                {/* Categories Card */}
                <View className="bg-surface border border-border rounded-2xl p-4">
                  <View className="flex-row items-center justify-between mb-3 pb-2 border-b border-border/60">
                    <Text className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Categories
                    </Text>
                    {selectedCategory !== "all" && (
                      <TouchableOpacity onPress={() => setSelectedCategory("all")}>
                        <Text className="text-xs text-amber-700 font-bold">
                          View All
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="gap-1">
                    {CATEGORIES_CONFIG.map((cat) => {
                      const isActive = selectedCategory === cat.id;
                      const count = categoryCounts[cat.id] ?? 0;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => setSelectedCategory(cat.id)}
                          className={`flex-row items-center justify-between px-3 py-2 rounded-xl border ${
                            isActive
                              ? "bg-black border-amber-400/50 shadow-xs"
                              : "border-transparent hover:bg-muted/10"
                          }`}
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                            <Ionicons
                              name={cat.icon}
                              size={16}
                              color={isActive ? "#fbbf24" : cat.color}
                            />
                            <Text
                              className={`text-sm ${
                                isActive ? "text-amber-400 font-bold" : "text-foreground font-medium"
                              }`}
                              numberOfLines={1}
                            >
                              {cat.shortLabel}
                            </Text>
                          </View>
                          <View
                            className={`px-2 py-0.5 rounded-full ${
                              isActive ? "bg-amber-400/20" : "bg-muted/15"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                isActive ? "text-amber-400" : "text-muted"
                              }`}
                            >
                              {count}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Filter Options Card (Level, Format, Duration, Tags) */}
                <View className="bg-surface border border-border rounded-2xl p-4 gap-4">
                  <View className="flex-row items-center justify-between pb-2 border-b border-border/60">
                    <Text className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Filters
                    </Text>
                    {hasActiveFilters && (
                      <TouchableOpacity onPress={resetAllFilters}>
                        <Text className="text-xs text-amber-700 font-bold">
                          Reset
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Level */}
                  <View className="gap-2">
                    <Text className="text-xs font-semibold text-muted uppercase">
                      Student Level
                    </Text>
                    <View className="gap-1">
                      {LEVELS.map((lvl) => (
                        <TouchableOpacity
                          key={lvl.id}
                          onPress={() => setSelectedLevel(lvl.id)}
                          className={`px-3 py-1.5 rounded-lg flex-row items-center justify-between ${
                            selectedLevel === lvl.id
                              ? "bg-amber-400/15 border border-amber-400/40"
                              : "bg-surface border border-transparent"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              selectedLevel === lvl.id
                                ? "text-amber-800 font-bold"
                                : "text-foreground font-medium"
                            }`}
                          >
                            {lvl.label}
                          </Text>
                          {selectedLevel === lvl.id && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color="#d97706"
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Type / Format */}
                  <View className="gap-2 pt-2 border-t border-border/60">
                    <Text className="text-xs font-semibold text-muted uppercase">
                      Format
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      <TouchableOpacity
                        onPress={() => setSelectedType(null)}
                        className={`px-2.5 py-1 rounded-full border ${
                          selectedType === null
                            ? "bg-black border-amber-400/40"
                            : "bg-surface border-border"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            selectedType === null ? "text-amber-400" : "text-foreground"
                          }`}
                        >
                          All
                        </Text>
                      </TouchableOpacity>
                      {TYPES.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() =>
                            setSelectedType(selectedType === t.id ? null : t.id)
                          }
                          className={`px-2.5 py-1 rounded-full border ${
                            selectedType === t.id
                              ? "bg-black border-amber-400/40"
                              : "bg-surface border-border"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              selectedType === t.id
                                ? "text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Duration */}
                  <View className="gap-2 pt-2 border-t border-border/60">
                    <Text className="text-xs font-semibold text-muted uppercase">
                      Commitment
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      <TouchableOpacity
                        onPress={() => setSelectedDuration(null)}
                        className={`px-2.5 py-1 rounded-full border ${
                          selectedDuration === null
                            ? "bg-black border-amber-400/40"
                            : "bg-surface border-border"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            selectedDuration === null
                              ? "text-amber-400"
                              : "text-foreground"
                          }`}
                        >
                          All
                        </Text>
                      </TouchableOpacity>
                      {DURATIONS.map((dur) => (
                        <TouchableOpacity
                          key={dur.id}
                          onPress={() =>
                            setSelectedDuration(
                              selectedDuration === dur.id ? null : dur.id
                            )
                          }
                          className={`px-2.5 py-1 rounded-full border ${
                            selectedDuration === dur.id
                              ? "bg-black border-amber-400/40"
                              : "bg-surface border-border"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              selectedDuration === dur.id
                                ? "text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {dur.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Tags */}
                  <View className="gap-2 pt-2 border-t border-border/60">
                    <Text className="text-xs font-semibold text-muted uppercase">
                      Popular Tags
                    </Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {OPPORTUNITY_TAGS.map((tag) => {
                        const selected = selectedTags.includes(tag);
                        return (
                          <TouchableOpacity
                            key={tag}
                            onPress={() =>
                              setSelectedTags(
                                selected
                                  ? selectedTags.filter((t) => t !== tag)
                                  : [...selectedTags, tag]
                              )
                            }
                            className={`px-2 py-0.5 rounded-md border ${
                              selected
                                ? "bg-black border-amber-400/40"
                                : "bg-surface border-border"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                selected
                                  ? "text-amber-400"
                                  : "text-muted"
                              }`}
                            >
                              #{tag}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            {/* RIGHT COLUMN: Opportunity Feed */}
            <View className="flex-1 min-w-0">
              {/* Mobile Horizontal Category Scroller */}
              {!isDesktop && (
                <View className="mb-4">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="gap-2"
                  >
                    <View className="flex-row gap-2">
                      {CATEGORIES_CONFIG.map((cat) => {
                        const isActive = selectedCategory === cat.id;
                        const count = categoryCounts[cat.id] ?? 0;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            className={`flex-row items-center gap-1.5 px-3.5 py-2 rounded-full border ${
                              isActive
                                ? "bg-black border-amber-400/50 shadow-xs"
                                : "bg-surface border-border"
                            }`}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={cat.icon}
                              size={14}
                              color={isActive ? "#fbbf24" : cat.color}
                            />
                            <Text
                              className={`text-xs font-semibold ${
                                isActive ? "text-amber-400 font-bold" : "text-foreground"
                              }`}
                            >
                              {cat.shortLabel}
                            </Text>
                            <View
                              className={`px-1.5 py-0.2 rounded-full ${
                                isActive ? "bg-amber-400/20" : "bg-muted/15"
                              }`}
                            >
                              <Text
                                className={`text-[10px] font-bold ${
                                  isActive ? "text-amber-400" : "text-muted"
                                }`}
                              >
                                {count}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Mobile Filter Toggle & Sort Bar */}
              {!isDesktop && (
                <View className="flex-row gap-2 mb-4">
                  <TouchableOpacity
                    onPress={() => setShowMobileFilters(!showMobileFilters)}
                    className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border ${
                      hasActiveFilters
                        ? "bg-amber-400/15 border-amber-400/30"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Ionicons
                      name="options-outline"
                      size={16}
                      color={hasActiveFilters ? "#d97706" : "#71717a"}
                    />
                    <Text
                      className={`text-xs font-semibold ${
                        hasActiveFilters ? "text-amber-800 font-bold" : "text-foreground"
                      }`}
                    >
                      {showMobileFilters ? "Hide Filters" : "Filters"}
                      {hasActiveFilters ? " (active)" : ""}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      setSortBy(
                        sortBy === "newest"
                          ? "deadline"
                          : sortBy === "deadline"
                          ? "alphabetical"
                          : "newest"
                      )
                    }
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-surface border border-border"
                  >
                    <Ionicons
                      name="swap-vertical-outline"
                      size={16}
                      color="#71717a"
                    />
                    <Text className="text-xs font-semibold text-foreground">
                      Sort:{" "}
                      {sortBy === "newest"
                        ? "Newest"
                        : sortBy === "deadline"
                        ? "Deadline"
                        : "A-Z"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Mobile Expanded Filters Panel */}
              {!isDesktop && showMobileFilters && (
                <View className="bg-surface rounded-2xl p-4 border border-border gap-3.5 mb-4">
                  <View className="flex-row items-center justify-between pb-2 border-b border-border/60">
                    <Text className="text-xs font-bold text-foreground uppercase">
                      Filter Options
                    </Text>
                    {hasActiveFilters && (
                      <TouchableOpacity onPress={resetAllFilters}>
                        <Text className="text-xs text-amber-700 font-bold">
                          Reset All
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Level */}
                  <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-muted">Level</Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {LEVELS.map((lvl) => (
                        <TouchableOpacity
                          key={lvl.id}
                          onPress={() => setSelectedLevel(lvl.id)}
                          className={`px-3 py-1 rounded-full border ${
                            selectedLevel === lvl.id
                              ? "bg-black border-amber-400/40"
                              : "bg-surface border-border"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              selectedLevel === lvl.id
                                ? "text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {lvl.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Type */}
                  <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-muted">Format</Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      <TouchableOpacity
                        onPress={() => setSelectedType(null)}
                        className={`px-3 py-1 rounded-full border ${
                          selectedType === null
                            ? "bg-black border-amber-400/40"
                            : "bg-surface border-border"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            selectedType === null ? "text-amber-400" : "text-foreground"
                          }`}
                        >
                          All
                        </Text>
                      </TouchableOpacity>
                      {TYPES.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() =>
                            setSelectedType(selectedType === t.id ? null : t.id)
                          }
                          className={`px-3 py-1 rounded-full border ${
                            selectedType === t.id
                              ? "bg-black border-amber-400/40"
                              : "bg-surface border-border"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              selectedType === t.id
                                ? "text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Duration */}
                  <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-muted">Duration</Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      <TouchableOpacity
                        onPress={() => setSelectedDuration(null)}
                        className={`px-3 py-1 rounded-full border ${
                          selectedDuration === null
                            ? "bg-black border-amber-400/40"
                            : "bg-surface border-border"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            selectedDuration === null
                              ? "text-amber-400"
                              : "text-foreground"
                          }`}
                        >
                          All
                        </Text>
                      </TouchableOpacity>
                      {DURATIONS.map((dur) => (
                        <TouchableOpacity
                          key={dur.id}
                          onPress={() =>
                            setSelectedDuration(
                              selectedDuration === dur.id ? null : dur.id
                            )
                          }
                          className={`px-3 py-1 rounded-full border ${
                            selectedDuration === dur.id
                              ? "bg-black border-amber-400/40"
                              : "bg-surface border-border"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              selectedDuration === dur.id
                                ? "text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            {dur.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Feed Header (Title + Count + Sort on Desktop) */}
              <View className="flex-row items-center justify-between mb-4 flex-wrap gap-2">
                <View>
                  <Text className="text-xl font-bold text-foreground">
                    {getCategoryMeta(selectedCategory).label}
                  </Text>
                  <Text className="text-xs text-muted">
                    Showing {filteredAndSorted.length}{" "}
                    {filteredAndSorted.length === 1
                      ? "opportunity"
                      : "opportunities"}
                    {searchQuery ? ` matching "${searchQuery}"` : ""}
                  </Text>
                </View>

                {isDesktop && (
                  <View className="flex-row items-center gap-1.5 bg-surface border border-border p-1 rounded-xl">
                    <Text className="text-xs text-muted px-2 font-medium">
                      Sort by:
                    </Text>
                    {(
                      [
                        { id: "newest", label: "Newest" },
                        { id: "deadline", label: "Deadline" },
                        { id: "alphabetical", label: "A-Z" },
                      ] as const
                    ).map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setSortBy(opt.id)}
                        className={`px-3 py-1 rounded-lg ${
                          sortBy === opt.id
                            ? "bg-black border border-amber-400/50 shadow-xs"
                            : "hover:bg-muted/10"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            sortBy === opt.id ? "text-amber-400" : "text-foreground"
                          }`}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Active Filter Pills Bar */}
              {(selectedLevel !== "both" ||
                selectedType !== null ||
                selectedDuration !== null ||
                selectedTags.length > 0) && (
                <View className="flex-row flex-wrap items-center gap-1.5 mb-4">
                  {selectedLevel !== "both" && (
                    <View className="bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                      <Text className="text-xs text-amber-900 font-semibold">
                        Level: {LEVELS.find((l) => l.id === selectedLevel)?.label}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedLevel("both")}>
                        <Ionicons name="close" size={13} color="#d97706" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedType !== null && (
                    <View className="bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                      <Text className="text-xs text-amber-900 font-semibold">
                        Format: {TYPES.find((t) => t.id === selectedType)?.label}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedType(null)}>
                        <Ionicons name="close" size={13} color="#d97706" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedDuration !== null && (
                    <View className="bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                      <Text className="text-xs text-amber-900 font-semibold">
                        Duration: {DURATIONS.find((d) => d.id === selectedDuration)?.label}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedDuration(null)}>
                        <Ionicons name="close" size={13} color="#d97706" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedTags.map((tag) => (
                    <View
                      key={tag}
                      className="bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-full flex-row items-center gap-1"
                    >
                      <Text className="text-xs text-amber-900 font-semibold">
                        #{tag}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setSelectedTags(selectedTags.filter((t) => t !== tag))
                        }
                      >
                        <Ionicons name="close" size={13} color="#d97706" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity onPress={resetAllFilters} className="ml-1">
                    <Text className="text-xs text-muted underline">
                      Clear filters
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Feed Content: Loading Skeletons, Error, Empty, or Cards */}
              {isLoading ? (
                <OpportunitySkeleton />
              ) : queryError ? (
                <View className="bg-surface rounded-2xl border border-border p-8 items-center justify-center">
                  <Ionicons name="alert-circle-outline" size={36} color="#ef4444" />
                  <Text className="text-base font-semibold text-foreground mt-2 mb-1">
                    Unable to load opportunities
                  </Text>
                  <Text className="text-xs text-muted text-center max-w-sm mb-4">
                    Please check your internet connection and try again.
                  </Text>
                  <TouchableOpacity
                    onPress={() => void refetchAllOpps()}
                    className="bg-black border border-amber-400/40 px-5 py-2.5 rounded-xl shadow-xs"
                  >
                    <Text className="text-amber-400 text-xs font-bold">
                      Retry Loading
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : filteredAndSorted.length > 0 ? (
                <View className="w-full">
                  {filteredAndSorted.map((item) => (
                    <OpportunityCard
                      key={item.id}
                      opportunity={item}
                      isBookmarked={isBookmarked(item.id)}
                      onToggleBookmark={toggleBookmark}
                      onPress={() => router.push(`/opportunity/${item.id}`)}
                    />
                  ))}
                </View>
              ) : (
                <View className="bg-surface rounded-2xl border border-border p-8 sm:p-12 items-center justify-center">
                  <View className="w-16 h-16 rounded-full bg-amber-400/15 items-center justify-center mb-3">
                    <Ionicons name="search" size={28} color="#d97706" />
                  </View>
                  <Text className="text-lg font-bold text-foreground mb-1">
                    No matching opportunities
                  </Text>
                  <Text className="text-sm text-muted text-center max-w-sm mb-5 leading-relaxed">
                    We couldn't find any opportunities matching your current filters or search query.
                  </Text>
                  <View className="flex-row flex-wrap gap-2.5 justify-center">
                    <TouchableOpacity
                      onPress={resetAllFilters}
                      className="bg-black border border-amber-400/40 px-5 py-2.5 rounded-xl shadow-xs"
                      activeOpacity={0.8}
                    >
                      <Text className="text-amber-400 text-xs font-bold">
                        Clear Filters & Search
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
                      className="bg-amber-400 border border-amber-500 px-5 py-2.5 rounded-xl shadow-xs flex-row items-center gap-1.5"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="bulb" size={14} color="#000" />
                      <Text className="text-black text-xs font-bold">
                        Suggest an Opportunity
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Supporter Banner & Footer */}
              <View className="items-center justify-center py-10 mt-8 border-t border-border">
                <Text className="text-xs uppercase tracking-wider text-muted font-bold mb-3">
                  Supported by
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL("https://youthcreativityfund.ca/")}
                  className="items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-bold text-primary mb-2.5">
                    Youth Creativity Fund
                  </Text>
                  <Image
                    source={require("@/assets/images/youth-creativity-fund.svg")}
                    style={{ width: 180, height: 60 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                {/* Page View Counter all the way down at the bottom */}
                <View className="mt-8 pt-6 border-t border-border/60 items-center w-full">
                  <PageViewBadge page="home" showTotal={true} label="visits" />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
