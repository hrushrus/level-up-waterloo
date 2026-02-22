import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useState, useEffect, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const RECENT_SEARCHES_KEY = "levelup_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(true);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load recent searches:", error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save recent search:", error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error("Failed to clear recent searches:", error);
    }
  };

  // Search opportunities
  const { data: searchResults, isLoading: searchLoading } = trpc.opportunities.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setShowRecent(false);
      saveRecentSearch(query);
    } else {
      setShowRecent(true);
    }
  };

  const handleRecentSearchTap = (query: string) => {
    setSearchQuery(query);
    setShowRecent(false);
  };

  const displayResults = useMemo(() => {
    if (searchQuery.length === 0) {
      return [];
    }
    return searchResults || [];
  }, [searchQuery, searchResults]);

  const renderOpportunityCard = ({ item }: { item: Opportunity }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      <Text className="text-lg font-semibold text-foreground mb-2">{item.title}</Text>
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
        <Text className="text-white font-semibold text-center">Learn More</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Search</Text>
            <Text className="text-base text-muted">Find opportunities by keyword</Text>
          </View>

          {/* Search Input */}
          <View className="bg-surface border border-border rounded-lg px-4 py-3">
            <TextInput
              placeholder="Search opportunities..."
              placeholderTextColor="#687076"
              value={searchQuery}
              onChangeText={handleSearch}
              className="text-foreground text-base"
            />
          </View>

          {/* Recent Searches */}
          {showRecent && recentSearches.length > 0 && (
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-foreground">Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text className="text-sm text-primary">Clear</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleRecentSearchTap(search)}
                    className="bg-surface border border-border px-3 py-2 rounded-full"
                  >
                    <Text className="text-sm text-foreground">{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Search Results */}
          {searchQuery.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">
                Results for "{searchQuery}"
              </Text>
              {searchLoading ? (
                <View className="items-center justify-center py-8">
                  <ActivityIndicator size="large" color="#0a7ea4" />
                </View>
              ) : displayResults.length > 0 ? (
                <FlatList
                  data={displayResults}
                  renderItem={renderOpportunityCard}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <View className="items-center justify-center py-8">
                  <Text className="text-muted text-center">
                    No opportunities found matching your search
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Empty State */}
          {showRecent && recentSearches.length === 0 && searchQuery.length === 0 && (
            <View className="items-center justify-center py-12">
              <Text className="text-muted text-center">
                Search for opportunities by keyword, such as "volunteering", "tutoring", or
                "sports"
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
