import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

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
  const [selectedCategory, setSelectedCategory] = useState("all");
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

  useEffect(() => {
    if (selectedCategory === "all" && allOpps) {
      setOpportunities(allOpps);
    } else if (selectedCategory === "closing_soon" && allOpps) {
      // Filter opportunities closing soon (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const closingSoon = allOpps.filter((opp) => {
        if (!opp.deadline) return false;
        const deadline = new Date(opp.deadline);
        return deadline <= thirtyDaysFromNow && deadline > new Date();
      });
      setOpportunities(closingSoon);
    } else if (categoryOpps) {
      setOpportunities(categoryOpps);
    }
  }, [selectedCategory, allOpps, categoryOpps]);

  const renderOpportunityCard = ({ item }: { item: Opportunity }) => (
    <TouchableOpacity
      onPress={() => {
        // Navigate to opportunity detail screen or open external link
        if (item.externalLink) {
          // For now, just show the card. In future, open external link
        }
      }}
      activeOpacity={0.7}
    >
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
    </TouchableOpacity>
  );

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

          {/* Opportunities List */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">
              {selectedCategory === "all"
                ? "All Opportunities"
                : selectedCategory === "closing_soon"
                ? "Closing Soon"
                : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Opportunities`}
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
                  No opportunities found in this category
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
