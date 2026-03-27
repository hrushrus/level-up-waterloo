import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useBookmarks } from "@/lib/bookmark-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";

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

export default function SavedScreen() {
  const router = useRouter();
  const { bookmarkedIds, removeBookmark, clearAllBookmarks, loading: bookmarksLoading } = useBookmarks();
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all opportunities
  const { data: allOpps, isLoading: oppsLoading } = trpc.opportunities.list.useQuery();

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (allOpps && bookmarkedIds.size > 0) {
        const saved = allOpps.filter((opp) => bookmarkedIds.has(opp.id));
        setSavedOpportunities(saved);
      } else {
        setSavedOpportunities([]);
      }
      setLoading(false);
    }, [allOpps, bookmarkedIds])
  );

  useEffect(() => {
    setLoading(oppsLoading || bookmarksLoading);
  }, [oppsLoading, bookmarksLoading]);

  const handleRemoveBookmark = async (id: number) => {
    await removeBookmark(id);
  };

  const handleClearAll = async () => {
    await clearAllBookmarks();
  };

  const renderOpportunityCard = ({ item }: { item: Opportunity }) => (
    <TouchableOpacity
      onPress={() => router.push(`/opportunity/${item.id}`)}
      activeOpacity={0.7}
    >
      <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-semibold text-foreground flex-1">{item.title}</Text>
          <TouchableOpacity
            onPress={() => handleRemoveBookmark(item.id)}
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

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Saved</Text>
            <Text className="text-base text-muted">
              Your bookmarked opportunities
            </Text>
          </View>

          {/* Saved Count and Clear Button */}
          {savedOpportunities.length > 0 && (
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted">
                {savedOpportunities.length} saved opportunity{savedOpportunities.length !== 1 ? "ies" : ""}
              </Text>
              <TouchableOpacity
                onPress={handleClearAll}
                className="px-3 py-1"
              >
                <Text className="text-sm text-error font-semibold">Clear All</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Saved Opportunities List */}
          {loading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="large" color="#0a7ea4" />
            </View>
          ) : savedOpportunities.length > 0 ? (
            <FlatList
              data={savedOpportunities}
              renderItem={renderOpportunityCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-4xl mb-4">🔖</Text>
              <Text className="text-lg font-semibold text-foreground mb-2">No Saved Opportunities</Text>
              <Text className="text-muted text-center mb-6">
                Bookmark opportunities to save them for later
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)")}
                className="bg-primary px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Browse Opportunities</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
