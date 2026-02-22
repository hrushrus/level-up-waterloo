import { ScrollView, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

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
  externalLink?: string;
  level: string;
  type: string;
  duration: string;
  deadline?: Date;
}

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch opportunities from database
  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      // For now, we'll use mock data since we need to set up the tRPC router
      // In a real implementation, this would call: const data = await trpc.opportunities.list.useQuery();
      const mockData: Opportunity[] = [
        {
          id: 1,
          title: "Waterloo Food Bank - Youth Volunteer Program",
          description: "Help sort, pack, and distribute food to families in need.",
          category: "volunteering",
          level: "both",
          type: "in_person",
          duration: "long",
          externalLink: "https://www.waterloofoodbank.ca/volunteer",
        },
        {
          id: 2,
          title: "Waterloo Public Library - Teen Volunteer",
          description: "Assist with shelving books and helping patrons.",
          category: "volunteering",
          level: "both",
          type: "in_person",
          duration: "long",
          externalLink: "https://www.waterloopubliclibrary.ca/volunteer",
        },
        {
          id: 3,
          title: "Kitchener-Waterloo Humane Society - Animal Care Volunteer",
          description: "Care for animals and assist with adoption events.",
          category: "volunteering",
          level: "both",
          type: "in_person",
          duration: "long",
          externalLink: "https://www.kwhumanesociety.ca/volunteer",
        },
        {
          id: 4,
          title: "Waterloo Region Habitat for Humanity - Youth Build",
          description: "Join hands-on construction projects for affordable housing.",
          category: "volunteering",
          level: "high_school",
          type: "in_person",
          duration: "long",
          externalLink: "https://www.habitatwaterloo.ca/volunteer",
        },
        {
          id: 5,
          title: "Waterloo Community Tutoring - Student Tutor",
          description: "Tutor younger students in various subjects.",
          category: "volunteering",
          level: "both",
          type: "hybrid",
          duration: "long",
          externalLink: "https://www.waterloocommunity.ca/tutoring",
        },
        {
          id: 6,
          title: "Waterloo Region Youth Mentorship Program",
          description: "Become a mentor to younger students.",
          category: "volunteering",
          level: "high_school",
          type: "hybrid",
          duration: "long",
          externalLink: "https://www.waterlooyouthmentorship.ca/volunteer",
        },
        {
          id: 7,
          title: "Waterloo Environmental Action - Trail Maintenance",
          description: "Help maintain local hiking trails and green spaces.",
          category: "volunteering",
          level: "both",
          type: "in_person",
          duration: "long",
          externalLink: "https://www.waterlooenvironmental.ca/volunteer",
        },
        {
          id: 8,
          title: "Waterloo Community Health Centre - Volunteer",
          description: "Support healthcare workers in patient care.",
          category: "volunteering",
          level: "high_school",
          type: "in_person",
          duration: "long",
          externalLink: "https://www.waterloohealthcentre.ca/volunteer",
        },
        {
          id: 9,
          title: "Waterloo Seniors' Support Program - Teen Volunteer",
          description: "Visit and support seniors in the community.",
          category: "volunteering",
          level: "both",
          type: "in_person",
          duration: "long",
          externalLink: "https://www.waterlooseniorsupport.ca/volunteer",
        },
        {
          id: 10,
          title: "Waterloo Youth Crisis Line - Peer Support Volunteer",
          description: "Provide peer support to youth in crisis.",
          category: "volunteering",
          level: "high_school",
          type: "online",
          duration: "long",
          externalLink: "https://www.waterlooyouthcrisis.ca/volunteer",
        },
        {
          id: 11,
          title: "Waterloo Community Garden - Garden Volunteer",
          description: "Help maintain community gardens.",
          category: "volunteering",
          level: "both",
          type: "in_person",
          duration: "long",
          externalLink: "https://www.waterloocommunitygardens.ca/volunteer",
        },
        {
          id: 12,
          title: "Waterloo Sports for All - Volunteer Coach",
          description: "Coach youth sports teams.",
          category: "volunteering",
          level: "high_school",
          type: "in_person",
          duration: "long",
          externalLink: "https://www.waterloosportsforall.ca/volunteer",
        },
      ];
      setOpportunities(mockData);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Filter opportunities based on selected category
  const filteredOpportunities =
    selectedCategory === "all"
      ? opportunities
      : opportunities.filter((opp) => opp.category === selectedCategory);

  const renderOpportunityCard = ({ item }: { item: Opportunity }) => (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-border">
      <Text className="text-lg font-semibold text-foreground mb-2">{item.title}</Text>
      <Text className="text-sm text-muted mb-3 leading-relaxed">{item.description}</Text>
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
      {item.externalLink && (
        <TouchableOpacity className="bg-primary px-4 py-2 rounded-lg">
          <Text className="text-white font-semibold text-center">Learn More</Text>
        </TouchableOpacity>
      )}
    </View>
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
                : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Opportunities`}
            </Text>
            {loading ? (
              <ActivityIndicator size="large" color="#0a7ea4" />
            ) : filteredOpportunities.length > 0 ? (
              <FlatList
                data={filteredOpportunities}
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
