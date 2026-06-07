import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { ScreenContainer } from "@/components/screen-container";
import { OPPORTUNITY_TAGS, type OpportunityTag } from "@/shared/opportunity-tags";

type OpportunityFormData = {
  title: string;
  description: string;
  category: "extracurricular" | "grant" | "stem_competition" | "sports" | "volunteering" | "other";
  level: "both" | "middle_school" | "high_school";
  type: "in_person" | "online" | "hybrid";
  duration: "short" | "medium" | "long";
  tags: OpportunityTag[];
  deadline: string;
  externalLink: string;
  submittedBy: string;
  submitterEmail: string;
  isApproved: boolean;
};

const INITIAL_FORM_DATA: OpportunityFormData = {
  title: "",
  description: "",
  category: "volunteering",
  level: "both",
  type: "in_person",
  duration: "long",
  tags: [],
  deadline: "",
  externalLink: "",
  submittedBy: "",
  submitterEmail: "",
  isApproved: false,
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"list" | "add" | "stats">("list");
  const [formData, setFormData] = useState<OpportunityFormData>(INITIAL_FORM_DATA);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check authentication
  const { data: user, isLoading: userLoading } = trpc.auth.profile.useQuery(undefined, {
    retry: false,
  });
  const userError = userLoading ? null : !user ? "Not authenticated" : null;

  // Use tRPC queries - only enabled if user is admin
  const { data: opportunities_data, isLoading: oppsLoading, refetch: refetchOpps, error: oppsError } = trpc.admin.listAll.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: stats_data, isLoading: statsLoading, refetch: refetchStats, error: statsError } = trpc.admin.getStatistics.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const addOppMutation = trpc.admin.addOpportunity.useMutation();
  const inactivateMutation = trpc.admin.inactivateOpportunity.useMutation();
  const deleteMutation = trpc.admin.deleteOpportunity.useMutation();

  const loading = oppsLoading || statsLoading || addOppMutation.isPending || inactivateMutation.isPending || deleteMutation.isPending;

  // Check for auth errors
  useEffect(() => {
    if (oppsError || statsError) {
      const error = (oppsError || statsError) as any;
      if (error?.data?.code === "UNAUTHORIZED") {
        setAuthError("You must be logged in to access the admin dashboard");
      } else if (error?.data?.code === "FORBIDDEN") {
        setAuthError("You do not have permission to access the admin dashboard. Admin role required.");
      }
    }
  }, [oppsError, statsError]);

  // Check user role
  useEffect(() => {
    if (user && user.role !== "admin") {
      setAuthError("You do not have permission to access the admin dashboard. Admin role required.");
    } else if (user && user.role === "admin") {
      setAuthError(null);
    }
  }, [user]);

  // Update opportunities when data changes
  useEffect(() => {
    if (opportunities_data) {
      setOpportunities(opportunities_data);
    }
  }, [opportunities_data]);

  // Update stats when data changes
  useEffect(() => {
    if (stats_data) {
      setStats(stats_data);
    }
  }, [stats_data]);

  // Handle form submission
  const handleAddOpportunity = async () => {
    if (!formData.title || !formData.description || !formData.submittedBy || !formData.submitterEmail) {
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    addOppMutation.mutate(formData, {
      onSuccess: () => {
        Alert.alert("Success", "Opportunity added successfully");
        setFormData(INITIAL_FORM_DATA);
        setActiveTab("list");
        refetchOpps();
        refetchStats();
      },
      onError: (error) => {
        console.error("Failed to add opportunity:", error);
        Alert.alert("Error", "Failed to add opportunity");
      },
    });
  };

  // Handle inactivate
  const handleInactivate = async (id: number) => {
    Alert.alert("Confirm", "Are you sure you want to inactivate this opportunity?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Inactivate",
        onPress: () => {
          inactivateMutation.mutate(
            { id },
            {
              onSuccess: () => {
                Alert.alert("Success", "Opportunity inactivated");
                refetchOpps();
                refetchStats();
              },
              onError: (error) => {
                console.error("Failed to inactivate:", error);
                Alert.alert("Error", "Failed to inactivate opportunity");
              },
            }
          );
        },
      },
    ]);
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    Alert.alert("Confirm", "Are you sure you want to delete this opportunity? This cannot be undone.", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: () => {
          deleteMutation.mutate(
            { id },
            {
              onSuccess: () => {
                Alert.alert("Success", "Opportunity deleted");
                refetchOpps();
                refetchStats();
              },
              onError: (error) => {
                console.error("Failed to delete:", error);
                Alert.alert("Error", "Failed to delete opportunity");
              },
            }
          );
        },
      },
    ]);
  };

  // Show loading state
  if (userLoading) {
    return (
      <ScreenContainer className="bg-background flex items-center justify-center">
        <Text className="text-foreground">Loading...</Text>
      </ScreenContainer>
    );
  }

  // Show auth error
  if (authError) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <View className="bg-error/20 rounded-lg p-6 mb-6 w-full">
            <Text className="text-error font-bold text-lg mb-2">Access Denied</Text>
            <Text className="text-error">{authError}</Text>
          </View>

          <View className="gap-3 w-full">
            {!user && (
              <TouchableOpacity
                onPress={() => router.push("/")}
                className="bg-primary py-3 px-4 rounded-lg"
              >
                <Text className="text-center text-background font-bold">Go to Home</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => router.push("/")}
              className="bg-surface border border-border py-3 px-4 rounded-lg"
            >
              <Text className="text-center text-foreground font-bold">Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="p-6">
          {/* Header with user info */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground">Admin Dashboard</Text>
            {user && (
              <Text className="text-sm text-muted mt-2">
                Logged in as: {user.name || user.email}
              </Text>
            )}
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => setActiveTab("list")}
              className={`flex-1 py-3 px-4 rounded-lg ${
                activeTab === "list" ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "list" ? "text-background" : "text-foreground"
                }`}
              >
                List
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("add")}
              className={`flex-1 py-3 px-4 rounded-lg ${
                activeTab === "add" ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "add" ? "text-background" : "text-foreground"
                }`}
              >
                Add
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("stats")}
              className={`flex-1 py-3 px-4 rounded-lg ${
                activeTab === "stats" ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "stats" ? "text-background" : "text-foreground"
                }`}
              >
                Stats
              </Text>
            </TouchableOpacity>
          </View>

          {/* List Tab */}
          {activeTab === "list" && (
            <View>
              <Text className="text-xl font-bold text-foreground mb-4">
                All Opportunities ({opportunities.length})
              </Text>
              {opportunities.map((opp) => (
                <View key={opp.id} className="bg-surface rounded-lg p-4 mb-3 border border-border">
                  <Text className="text-lg font-semibold text-foreground">{opp.title}</Text>
                  <Text className="text-sm text-muted mt-1">{opp.description.substring(0, 100)}...</Text>
                  <View className="flex-row gap-2 mt-2 flex-wrap">
                    <View className="bg-primary/20 px-2 py-1 rounded">
                      <Text className="text-xs text-primary font-semibold">{opp.category}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded ${opp.isApproved ? "bg-success/20" : "bg-error/20"}`}>
                      <Text
                        className={`text-xs font-semibold ${
                          opp.isApproved ? "text-success" : "text-error"
                        }`}
                      >
                        {opp.isApproved ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2 mt-4">
                    <TouchableOpacity
                      onPress={() => handleInactivate(opp.id)}
                      className="flex-1 bg-warning/20 py-2 px-3 rounded"
                    >
                      <Text className="text-center text-warning font-semibold text-sm">Inactivate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(opp.id)}
                      className="flex-1 bg-error/20 py-2 px-3 rounded"
                    >
                      <Text className="text-center text-error font-semibold text-sm">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Add Tab */}
          {activeTab === "add" && (
            <View>
              <Text className="text-xl font-bold text-foreground mb-4">Add New Opportunity</Text>

              <View className="gap-4">
                {/* Title */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Title *</Text>
                  <TextInput
                    placeholder="Opportunity title"
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    className="bg-surface border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Description */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Description *</Text>
                  <TextInput
                    placeholder="Opportunity description"
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    className="bg-surface border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Category */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Category</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {["extracurricular", "grant", "stem_competition", "sports", "volunteering", "other"].map(
                      (cat) => (
                        <TouchableOpacity
                          key={cat}
                          onPress={() => setFormData({ ...formData, category: cat as any })}
                          className={`px-3 py-2 rounded ${
                            formData.category === cat ? "bg-primary" : "bg-surface border border-border"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              formData.category === cat ? "text-background" : "text-foreground"
                            }`}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {/* Tags */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Tags</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {OPPORTUNITY_TAGS.map((tag) => {
                      const selected = formData.tags.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          onPress={() =>
                            setFormData({
                              ...formData,
                              tags: selected
                                ? formData.tags.filter((item) => item !== tag)
                                : [...formData.tags, tag],
                            })
                          }
                          className={`px-3 py-2 rounded ${
                            selected ? "bg-primary" : "bg-surface border border-border"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              selected ? "text-background" : "text-foreground"
                            }`}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Level */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Level</Text>
                  <View className="flex-row gap-2">
                    {["both", "middle_school", "high_school"].map((level) => (
                      <TouchableOpacity
                        key={level}
                        onPress={() => setFormData({ ...formData, level: level as any })}
                        className={`flex-1 px-3 py-2 rounded ${
                          formData.level === level ? "bg-primary" : "bg-surface border border-border"
                        }`}
                      >
                        <Text
                          className={`text-center text-xs font-semibold ${
                            formData.level === level ? "text-background" : "text-foreground"
                          }`}
                        >
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Type */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Type</Text>
                  <View className="flex-row gap-2">
                    {["in_person", "online", "hybrid"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setFormData({ ...formData, type: type as any })}
                        className={`flex-1 px-3 py-2 rounded ${
                          formData.type === type ? "bg-primary" : "bg-surface border border-border"
                        }`}
                      >
                        <Text
                          className={`text-center text-xs font-semibold ${
                            formData.type === type ? "text-background" : "text-foreground"
                          }`}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Duration */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Duration</Text>
                  <View className="flex-row gap-2">
                    {["short", "medium", "long"].map((dur) => (
                      <TouchableOpacity
                        key={dur}
                        onPress={() => setFormData({ ...formData, duration: dur as any })}
                        className={`flex-1 px-3 py-2 rounded ${
                          formData.duration === dur ? "bg-primary" : "bg-surface border border-border"
                        }`}
                      >
                        <Text
                          className={`text-center text-xs font-semibold ${
                            formData.duration === dur ? "text-background" : "text-foreground"
                          }`}
                        >
                          {dur}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Deadline */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Deadline</Text>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    value={formData.deadline}
                    onChangeText={(text) => setFormData({ ...formData, deadline: text })}
                    className="bg-surface border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* External Link */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">External Link</Text>
                  <TextInput
                    placeholder="https://example.com"
                    value={formData.externalLink}
                    onChangeText={(text) => setFormData({ ...formData, externalLink: text })}
                    className="bg-surface border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Submitted By */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Submitted By *</Text>
                  <TextInput
                    placeholder="Organization name"
                    value={formData.submittedBy}
                    onChangeText={(text) => setFormData({ ...formData, submittedBy: text })}
                    className="bg-surface border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Submitter Email */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Submitter Email *</Text>
                  <TextInput
                    placeholder="email@example.com"
                    value={formData.submitterEmail}
                    onChangeText={(text) => setFormData({ ...formData, submitterEmail: text })}
                    className="bg-surface border border-border rounded-lg p-3 text-foreground"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Approved */}
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, isApproved: !formData.isApproved })}
                    className={`w-6 h-6 rounded border-2 ${
                      formData.isApproved ? "bg-primary border-primary" : "border-border"
                    }`}
                  />
                  <Text className="text-sm font-semibold text-foreground ml-3">Approve immediately</Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleAddOpportunity}
                  disabled={loading}
                  className="bg-primary py-4 rounded-lg mt-4"
                >
                  <Text className="text-center text-background font-bold text-lg">
                    {loading ? "Adding..." : "Add Opportunity"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Stats Tab */}
          {activeTab === "stats" && stats && (
            <View>
              <Text className="text-xl font-bold text-foreground mb-4">Statistics</Text>

              <View className="gap-3">
                <View className="bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-sm text-muted">Total Opportunities</Text>
                  <Text className="text-3xl font-bold text-primary mt-2">{stats.total}</Text>
                </View>

                <View className="bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-sm text-muted">Active</Text>
                  <Text className="text-3xl font-bold text-success mt-2">{stats.active}</Text>
                </View>

                <View className="bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-sm text-muted">Inactive</Text>
                  <Text className="text-3xl font-bold text-warning mt-2">{stats.inactive}</Text>
                </View>

                <View className="bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-sm text-muted">Expired</Text>
                  <Text className="text-3xl font-bold text-error mt-2">{stats.expired}</Text>
                </View>

                <View className="bg-surface rounded-lg p-4 border border-border mt-4">
                  <Text className="text-sm font-semibold text-foreground mb-3">By Category</Text>
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <View key={category} className="flex-row justify-between py-2 border-b border-border">
                      <Text className="text-sm text-foreground capitalize">{category}</Text>
                      <Text className="text-sm font-semibold text-primary">{count as number}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
