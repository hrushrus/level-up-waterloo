import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useBookmarks } from "@/lib/bookmark-context";

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

export default function BookmarksScreen() {
  const router = useRouter();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const [bookmarkedOpportunities, setBookmarkedOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all opportunities
  const { data: allOpps, isLoading: allOppsLoading } = trpc.opportunities.list.useQuery();

  // Filter to show only bookmarked opportunities
  useEffect(() => {
    if (allOpps) {
      const bookmarked = allOpps.filter((opp) => bookmarkedIds.has(opp.id));
      setBookmarkedOpportunities(bookmarked);
      setLoading(false);
    }
  }, [allOpps, bookmarkedIds]);

  const renderOpportunityCard = ({ item }: { item: Opportunity }) => {
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
              <Text className="text-xl">❤️</Text>
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
            <Text className="text-3xl font-bold text-foreground">Saved Opportunities</Text>
            <Text className="text-base text-muted">
              {bookmarkedOpportunities.length} opportunity{bookmarkedOpportunities.length !== 1 ? "ies" : ""} saved
            </Text>
          </View>

          {/* Empty State */}
          {bookmarkedOpportunities.length === 0 && !loading && (
            <View className="flex-1 items-center justify-center gap-4 py-12">
              <Text className="text-4xl">🤍</Text>
              <Text className="text-lg font-semibold text-foreground">No Saved Opportunities</Text>
              <Text className="text-sm text-muted text-center">
                Bookmark opportunities to save them here for later
              </Text>
            </View>
          )}

          {/* Loading State */}
          {loading && (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-muted">Loading saved opportunities...</Text>
            </View>
          )}

          {/* Bookmarked Opportunities List */}
          {bookmarkedOpportunities.length > 0 && (
            <FlatList
              data={bookmarkedOpportunities}
              renderItem={renderOpportunityCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
