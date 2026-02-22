import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useBookmarks } from "@/lib/bookmark-context";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "closing_soon", label: "Closing Soon" },
  { id: "extracurricular", label: "Extracurricular" },
  { id: "sports", label: "Sports" },
  { id: "volunteering", label: "Volunteering" },
  { id: "grant", label: "Grants" },
  { id: "stem_competition", label: "STEM" },
  { id: "other", label: "Other" },
];

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

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "deadline", label: "Deadline" },
  { id: "alphabetical", label: "A-Z" },
];

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
}

export default function HomeScreen() {
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("both");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all opportunities
  const { data: allOpps, isLoading: allOppsLoading } = trpc.opportunities.list.useQuery();

  // Fetch opportunities by category
  const { data: categoryOpps, isLoading: categoryOppsLoading } = trpc.opportunities.byCategory.useQuery(
    { category: selectedCategory },
    { enabled: selectedCategory !== "all" && selectedCategory !== "closing_soon" }
  );

  useEffect(() => {
    setLoading(allOppsLoading || categoryOppsLoading);
  }, [allOppsLoading, categoryOppsLoading]);

  // Filter and sort opportunities
  const filteredAndSorted = useMemo(() => {
    let filtered: Opportunity[] = [];

    if (selectedCategory === "all" && allOpps) {
      filtered = allOpps;
    } else if (selectedCategory === "closing_soon" && allOpps) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      filtered = allOpps.filter((opp) => {
        if (!opp.deadline) return false;
        const deadline = new Date(opp.deadline);
        return deadline <= thirtyDaysFromNow && deadline > new Date();
      });
    } else if (categoryOpps) {
      filtered = categoryOpps;
    }

    // Apply level filter
    if (selectedLevel !== "both") {
      filtered = filtered.filter((opp) => opp.level === selectedLevel || opp.level === "both");
    }

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter((opp) => opp.type === selectedType);
    }

    // Apply duration filter
    if (selectedDuration) {
      filtered = filtered.filter((opp) => opp.duration === selectedDuration);
    }

    // Apply sorting
    const sorted = [...filtered];
    if (sortBy === "deadline") {
      sorted.sort((a, b) => {
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return aDeadline - bDeadline;
      });
    } else if (sortBy === "alphabetical") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // newest (default, already in order)
    }

    return sorted;
  }, [selectedCategory, selectedLevel, selectedType, selectedDuration, sortBy, allOpps, categoryOpps]);

  useEffect(() => {
    setOpportunities(filteredAndSorted);
  }, [filteredAndSorted]);

  const renderOpportunityCard = ({ item }: { item: Opportunity }) => {
    const isBookmarkedState = isBookmarked(item.id);
    return (
      <TouchableOpacity
        onPress={() => router.push(`/opportunity/${item.id}`)}
        activeOpacity={0.7}
      >
        <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-lg font-semibold text-foreground flex-1">{item.title}</Text>
            <TouchableOpacity
              onPress={() => toggleBookmark(item.id)}
              className="ml-2"
            >
              <Text className="text-xl">{isBookmarkedState ? "❤️" : "🤍"}</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-muted mb-3 leading-relaxed" numberOfLines={2}>
            {item.description}
          </Text>
          <View className="flex-row gap-2 mb-3 flex-wrap">
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium text-primary">{item.level}</Text>
            </View>
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium text-primary">{item.type}</Text>
            </View>
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium text-primary">{item.duration}</Text>
            </View>
          </View>
          <TouchableOpacity className="bg-primary px-4 py-2 rounded-lg">
            <Text className="text-white font-semibold text-center">View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">LevelUp Waterloo</Text>
            <Text className="text-base text-muted">
              Discover opportunities for students in the Waterloo region
            </Text>
          </View>

          {/* Category Filter */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              <View className="flex-row gap-2">
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full ${
                      selectedCategory === category.id
                        ? "bg-primary"
                        : "bg-surface border border-border"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedCategory === category.id
                          ? "text-white"
                          : "text-foreground"
                      }`}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Filter and Sort Controls */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowFilters(!showFilters)}
              className="flex-1 bg-surface border border-border px-4 py-2 rounded-lg items-center"
            >
              <Text className="text-foreground font-semibold">
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSortBy(sortBy === "newest" ? "deadline" : sortBy === "deadline" ? "alphabetical" : "newest")}
              className="flex-1 bg-surface border border-border px-4 py-2 rounded-lg items-center"
            >
              <Text className="text-foreground font-semibold text-xs text-center">
                Sort: {sortBy === "newest" ? "Newest" : sortBy === "deadline" ? "Deadline" : "A-Z"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Advanced Filters */}
          {showFilters && (
            <View className="bg-surface rounded-lg p-4 border border-border gap-3">
              {/* Level Filter */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Level</Text>
                <View className="flex-row flex-wrap gap-2">
                  {LEVELS.map((level) => (
                    <TouchableOpacity
                      key={level.id}
                      onPress={() => setSelectedLevel(level.id)}
                      className={`px-3 py-1 rounded-full ${
                        selectedLevel === level.id
                          ? "bg-primary"
                          : "bg-background border border-border"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          selectedLevel === level.id
                            ? "text-white"
                            : "text-foreground"
                        }`}
                      >
                        {level.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Type Filter */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Type</Text>
                <View className="flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    onPress={() => setSelectedType(null)}
                    className={`px-3 py-1 rounded-full ${
                      selectedType === null
                        ? "bg-primary"
                        : "bg-background border border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedType === null
                          ? "text-white"
                          : "text-foreground"
                      }`}
                    >
                      All Types
                    </Text>
                  </TouchableOpacity>
                  {TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => setSelectedType(type.id)}
                      className={`px-3 py-1 rounded-full ${
                        selectedType === type.id
                          ? "bg-primary"
                          : "bg-background border border-border"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          selectedType === type.id
                            ? "text-white"
                            : "text-foreground"
                        }`}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Duration Filter */}
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">Duration</Text>
                <View className="flex-row flex-wrap gap-2">
                  <TouchableOpacity
                    onPress={() => setSelectedDuration(null)}
                    className={`px-3 py-1 rounded-full ${
                      selectedDuration === null
                        ? "bg-primary"
                        : "bg-background border border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        selectedDuration === null
                          ? "text-white"
                          : "text-foreground"
                      }`}
                    >
                      All Durations
                    </Text>
                  </TouchableOpacity>
                  {DURATIONS.map((duration) => (
                    <TouchableOpacity
                      key={duration.id}
                      onPress={() => setSelectedDuration(duration.id)}
                      className={`px-3 py-1 rounded-full ${
                        selectedDuration === duration.id
                          ? "bg-primary"
                          : "bg-background border border-border"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          selectedDuration === duration.id
                            ? "text-white"
                            : "text-foreground"
                        }`}
                      >
                        {duration.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Opportunities List */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              {selectedCategory === "all"
                ? "All Opportunities"
                : selectedCategory === "closing_soon"
                ? "Closing Soon"
                : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Opportunities`}
              {opportunities.length > 0 && ` (${opportunities.length})`}
            </Text>
            {loading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#0a7ea4" />
              </View>
            ) : error ? (
              <View className="items-center justify-center py-8">
                <Text className="text-error text-center">{error}</Text>
              </View>
            ) : opportunities.length > 0 ? (
              <FlatList
                data={opportunities}
                renderItem={renderOpportunityCard}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            ) : (
              <View className="items-center justify-center py-8">
                <Text className="text-muted text-center">
                  No opportunities found with the selected filters
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
