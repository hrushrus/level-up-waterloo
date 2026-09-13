import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { trpc } from "@/lib/trpc";
import { ScreenContainer } from "@/components/screen-container";
import { OPPORTUNITY_TAGS, type OpportunityTag } from "@/shared/opportunity-tags";

type OpportunityFormData = {
  title: string;
  description: string;
  category: "extracurricular" | "grant" | "stem_competition" | "sports" | "volunteering" | "experiential_learning" | "other";
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
  const [activeTab, setActiveTab] = useState<"list" | "add" | "stats" | "suggestions" | "donations">("list");
  const [suggestionFilter, setSuggestionFilter] = useState<
    "all" | "pending" | "approved" | "rejected" | "converted"
  >("all");
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

  const { data: viewStats_data } = trpc.views.stats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const {
    data: suggestions_data,
    isLoading: suggestionsLoading,
    refetch: refetchSuggestions,
  } = trpc.admin.listSuggestions.useQuery(
    suggestionFilter === "all" ? undefined : { status: suggestionFilter },
    {
      enabled: user?.role === "admin",
    },
  );

  const {
    data: suggestionStats_data,
    refetch: refetchSuggestionStats,
  } = trpc.admin.getSuggestionStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const {
    data: donations_data,
    isLoading: donationsLoading,
    refetch: refetchDonations,
  } = trpc.admin.listDonations.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const updateDonationStatusMutation = trpc.admin.updateDonationStatus.useMutation({
    onSuccess: () => refetchDonations(),
  });

  const toggleDonationWallMutation = trpc.admin.toggleDonationWall.useMutation({
    onSuccess: () => refetchDonations(),
  });

  const updateSuggestionMutation = trpc.admin.updateSuggestionStatus.useMutation({
    onSuccess: () => {
      refetchSuggestions();
      refetchSuggestionStats();
    },
  });

  const convertSuggestionMutation = trpc.admin.convertSuggestion.useMutation({
    onSuccess: (res) => {
      refetchSuggestions();
      refetchSuggestionStats();
      refetchOpps();
      refetchStats();
      Alert.alert("Success", `Suggestion converted to opportunity #${res.opportunityId}!`);
    },
    onError: (err) => {
      Alert.alert("Error", err.message || "Failed to convert suggestion");
    },
  });

  const addOppMutation = trpc.admin.addOpportunity.useMutation();
  const inactivateMutation = trpc.admin.inactivateOpportunity.useMutation();
  const deleteMutation = trpc.admin.deleteOpportunity.useMutation();

  const loading =
    oppsLoading ||
    statsLoading ||
    suggestionsLoading ||
    addOppMutation.isPending ||
    inactivateMutation.isPending ||
    deleteMutation.isPending ||
    updateSuggestionMutation.isPending ||
    convertSuggestionMutation.isPending;

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

            <TouchableOpacity
              onPress={() => setActiveTab("suggestions")}
              className={`flex-1 py-3 px-3 rounded-lg flex-row items-center justify-center gap-1.5 ${
                activeTab === "suggestions" ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "suggestions" ? "text-background" : "text-foreground"
                }`}
              >
                Suggestions
              </Text>
              {(suggestionStats_data?.pending ?? 0) > 0 && (
                <View className="bg-amber-500 rounded-full px-1.5 py-0.5 min-w-[18px] items-center justify-center">
                  <Text className="text-[10px] font-black text-black">
                    {suggestionStats_data?.pending}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("donations")}
              className={`flex-1 py-3 px-3 rounded-lg flex-row items-center justify-center gap-1.5 ${
                activeTab === "donations" ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "donations" ? "text-background" : "text-foreground"
                }`}
              >
                Donations
              </Text>
              {(donations_data?.length ?? 0) > 0 && (
                <View className="bg-amber-500 rounded-full px-1.5 py-0.5 min-w-[18px] items-center justify-center">
                  <Text className="text-[10px] font-black text-black">
                    {donations_data?.length}
                  </Text>
                </View>
              )}
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
                    {["extracurricular", "grant", "stem_competition", "sports", "volunteering", "experiential_learning", "other"].map(
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

                {/* Page Views Analytics */}
                <View className="bg-surface rounded-lg p-4 border border-border mt-4">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-sm font-semibold text-foreground">👀 Page Views & Traffic</Text>
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-xs font-bold text-primary">
                        Total: {viewStats_data?.total ?? 0}
                      </Text>
                    </View>
                  </View>

                  {viewStats_data?.pages && Object.keys(viewStats_data.pages).length > 0 ? (
                    Object.entries(viewStats_data.pages)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([page, count]) => (
                        <View key={page} className="flex-row justify-between py-2 border-b border-border">
                          <Text className="text-sm text-foreground">{page}</Text>
                          <Text className="text-sm font-semibold text-primary">
                            {(count as number).toLocaleString()} views
                          </Text>
                        </View>
                      ))
                  ) : (
                    <Text className="text-xs text-muted">No page views recorded yet</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Suggestions Tab */}
          {activeTab === "suggestions" && (
            <View>
              {/* Header & Stats Banner */}
              <View className="mb-5">
                <Text className="text-xl font-bold text-foreground">
                  Community Suggestions ({suggestionStats_data?.total ?? 0})
                </Text>
                <Text className="text-xs text-muted mt-1">
                  Review opportunities and sources submitted by students, parents, and community members.
                </Text>

                {/* Stats Row */}
                <View className="flex-row flex-wrap gap-3 mt-4">
                  <View className="flex-1 min-w-[120px] bg-surface border border-border p-3.5 rounded-xl">
                    <Text className="text-xs text-muted font-medium">Pending Review</Text>
                    <Text className="text-2xl font-black text-amber-500 mt-1">
                      {suggestionStats_data?.pending ?? 0}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[120px] bg-surface border border-border p-3.5 rounded-xl">
                    <Text className="text-xs text-muted font-medium">Converted to Opps</Text>
                    <Text className="text-2xl font-black text-blue-500 mt-1">
                      {suggestionStats_data?.converted ?? 0}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[120px] bg-surface border border-border p-3.5 rounded-xl">
                    <Text className="text-xs text-muted font-medium">Approved</Text>
                    <Text className="text-2xl font-black text-emerald-500 mt-1">
                      {suggestionStats_data?.approved ?? 0}
                    </Text>
                  </View>
                  <View className="flex-1 min-w-[120px] bg-surface border border-border p-3.5 rounded-xl">
                    <Text className="text-xs text-muted font-medium">Rejected</Text>
                    <Text className="text-2xl font-black text-rose-500 mt-1">
                      {suggestionStats_data?.rejected ?? 0}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status Filter Chips */}
              <View className="flex-row flex-wrap gap-2 mb-4">
                {(["all", "pending", "converted", "approved", "rejected"] as const).map((filter) => {
                  const active = suggestionFilter === filter;
                  return (
                    <TouchableOpacity
                      key={filter}
                      onPress={() => setSuggestionFilter(filter)}
                      className={`px-3 py-1.5 rounded-full border ${
                        active
                          ? "bg-amber-400/20 border-amber-500"
                          : "bg-surface border-border"
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`text-xs font-bold capitalize ${
                          active ? "text-amber-800" : "text-muted"
                        }`}
                      >
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Suggestions List */}
              {suggestionsLoading ? (
                <View className="py-12 items-center justify-center">
                  <Text className="text-sm text-muted">Loading suggestions...</Text>
                </View>
              ) : suggestions_data && suggestions_data.length > 0 ? (
                <View className="gap-3">
                  {suggestions_data.map((item) => (
                    <View
                      key={item.id}
                      className="bg-surface rounded-2xl p-5 border border-border shadow-xs"
                    >
                      {/* Top Badges */}
                      <View className="flex-row items-center justify-between gap-2 mb-2.5 flex-wrap">
                        <View className="flex-row items-center gap-2">
                          <View
                            className={`px-2.5 py-1 rounded-md flex-row items-center gap-1 ${
                              item.type === "opportunity"
                                ? "bg-amber-400/20 border border-amber-400/40"
                                : "bg-blue-400/20 border border-blue-400/40"
                            }`}
                          >
                            <Ionicons
                              name={item.type === "opportunity" ? "star" : "globe"}
                              size={12}
                              color={item.type === "opportunity" ? "#d97706" : "#2563eb"}
                            />
                            <Text
                              className={`text-[11px] font-bold uppercase tracking-wider ${
                                item.type === "opportunity" ? "text-amber-800" : "text-blue-800"
                              }`}
                            >
                              {item.type}
                            </Text>
                          </View>

                          {item.category && (
                            <View className="bg-background px-2.5 py-1 rounded-md border border-border">
                              <Text className="text-[11px] font-semibold text-muted capitalize">
                                {item.category.replace("_", " ")}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Status Badge */}
                        <View
                          className={`px-2.5 py-0.5 rounded-full ${
                            item.status === "pending"
                              ? "bg-amber-100 border border-amber-300"
                              : item.status === "converted"
                              ? "bg-blue-100 border border-blue-300"
                              : item.status === "approved"
                              ? "bg-emerald-100 border border-emerald-300"
                              : "bg-rose-100 border border-rose-300"
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-bold capitalize ${
                              item.status === "pending"
                                ? "text-amber-800"
                                : item.status === "converted"
                                ? "text-blue-800"
                                : item.status === "approved"
                                ? "text-emerald-800"
                                : "text-rose-800"
                            }`}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      {/* Title & Organization */}
                      <Text className="text-lg font-bold text-foreground mb-1">
                        {item.title}
                      </Text>
                      {item.organization && (
                        <Text className="text-xs font-semibold text-muted mb-2">
                          Organization: {item.organization}
                        </Text>
                      )}

                      {/* URL Link */}
                      {item.url && (
                        <TouchableOpacity
                          onPress={() => item.url && Linking.openURL(item.url)}
                          className="flex-row items-center gap-1.5 mb-3"
                          activeOpacity={0.7}
                        >
                          <Ionicons name="open-outline" size={14} color="#d97706" />
                          <Text className="text-xs font-semibold text-amber-700 underline" numberOfLines={1}>
                            {item.url}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Target Age */}
                      {item.targetAge && (
                        <Text className="text-xs text-muted mb-2">
                          <Text className="font-bold text-foreground">Target Age/Grade:</Text> {item.targetAge}
                        </Text>
                      )}

                      {/* Description */}
                      <Text className="text-sm text-foreground mb-3 leading-relaxed">
                        {item.description}
                      </Text>

                      {/* Notes */}
                      {item.notes && (
                        <View className="bg-background rounded-xl p-3 border border-border mb-3">
                          <Text className="text-xs font-bold text-muted mb-1">Submitter Notes / Tips:</Text>
                          <Text className="text-xs text-foreground">{item.notes}</Text>
                        </View>
                      )}

                      {/* Admin Notes */}
                      {item.adminNotes && (
                        <View className="bg-primary/5 rounded-xl p-3 border border-primary/20 mb-3">
                          <Text className="text-xs font-bold text-primary mb-1">Admin Notes:</Text>
                          <Text className="text-xs text-foreground">{item.adminNotes}</Text>
                        </View>
                      )}

                      {/* Submitter & Date Footer */}
                      <View className="pt-3 border-t border-border flex-row items-center justify-between text-xs text-muted flex-wrap gap-2 mb-3">
                        <Text className="text-xs text-muted">
                          Submitted by: <Text className="font-semibold text-foreground">{item.submitterName || "Anonymous"}</Text>
                          {item.submitterEmail ? ` (${item.submitterEmail})` : ""}
                        </Text>
                        <Text className="text-xs text-muted">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row flex-wrap gap-2">
                        {item.type === "opportunity" && item.status !== "converted" && (
                          <TouchableOpacity
                            onPress={() => convertSuggestionMutation.mutate({ id: item.id })}
                            disabled={convertSuggestionMutation.isPending}
                            className="bg-black border border-amber-400/50 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5"
                            activeOpacity={0.8}
                          >
                            <Ionicons name="flash" size={14} color="#FBBF24" />
                            <Text className="text-xs font-bold text-amber-400">
                              Convert to Live Opportunity
                            </Text>
                          </TouchableOpacity>
                        )}

                        {item.status !== "approved" && item.status !== "converted" && (
                          <TouchableOpacity
                            onPress={() =>
                              updateSuggestionMutation.mutate({ id: item.id, status: "approved" })
                            }
                            disabled={updateSuggestionMutation.isPending}
                            className="bg-emerald-50 border border-emerald-300 px-3 py-2 rounded-xl flex-row items-center gap-1"
                            activeOpacity={0.7}
                          >
                            <Ionicons name="checkmark" size={14} color="#059669" />
                            <Text className="text-xs font-bold text-emerald-800">Approve</Text>
                          </TouchableOpacity>
                        )}

                        {item.status !== "rejected" && (
                          <TouchableOpacity
                            onPress={() =>
                              updateSuggestionMutation.mutate({ id: item.id, status: "rejected" })
                            }
                            disabled={updateSuggestionMutation.isPending}
                            className="bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl flex-row items-center gap-1"
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close" size={14} color="#e11d48" />
                            <Text className="text-xs font-bold text-rose-800">Decline</Text>
                          </TouchableOpacity>
                        )}

                        {item.status === "rejected" && (
                          <TouchableOpacity
                            onPress={() =>
                              updateSuggestionMutation.mutate({ id: item.id, status: "pending" })
                            }
                            disabled={updateSuggestionMutation.isPending}
                            className="bg-background border border-border px-3 py-2 rounded-xl flex-row items-center gap-1"
                            activeOpacity={0.7}
                          >
                            <Ionicons name="refresh" size={14} color="#71717a" />
                            <Text className="text-xs font-bold text-muted">Reopen as Pending</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-surface rounded-2xl border border-border p-8 items-center justify-center">
                  <Ionicons name="file-tray-outline" size={32} color="#a1a1aa" />
                  <Text className="text-base font-semibold text-foreground mt-2">
                    No suggestions found
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    No community suggestions match the current filter.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Donations Management Tab */}
          {activeTab === "donations" && (
            <View>
              {/* Donations Stats Header */}
              {(() => {
                const totalCents = (donations_data || [])
                  .filter((d) => d.status === "completed")
                  .reduce((sum, d) => sum + d.amountInCents, 0);
                const completedCount = (donations_data || []).filter((d) => d.status === "completed").length;
                const pledgedCount = (donations_data || []).filter((d) => d.status === "pledged").length;

                return (
                  <View className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                    <View className="p-4 rounded-2xl bg-surface border border-border">
                      <Text className="text-xs uppercase font-bold text-muted">Total Funds Raised</Text>
                      <Text className="text-2xl font-black text-amber-500 mt-1">
                        ${(totalCents / 100).toFixed(2)} CAD
                      </Text>
                      <Text className="text-xs text-muted mt-0.5">
                        {completedCount} completed contributions
                      </Text>
                    </View>

                    <View className="p-4 rounded-2xl bg-surface border border-border">
                      <Text className="text-xs uppercase font-bold text-muted">Pledges Pending</Text>
                      <Text className="text-2xl font-black text-foreground mt-1">
                        {pledgedCount}
                      </Text>
                      <Text className="text-xs text-muted mt-0.5">Community pledges</Text>
                    </View>

                    <View className="p-4 rounded-2xl bg-surface border border-border">
                      <Text className="text-xs uppercase font-bold text-muted">Total Records</Text>
                      <Text className="text-2xl font-black text-foreground mt-1">
                        {donations_data?.length ?? 0}
                      </Text>
                      <Text className="text-xs text-muted mt-0.5">All time supporters</Text>
                    </View>
                  </View>
                );
              })()}

              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-foreground">
                  Supporter Contributions & Pledges ({donations_data?.length ?? 0})
                </Text>
                <TouchableOpacity
                  onPress={() => refetchDonations()}
                  className="px-3 py-1.5 rounded-full bg-surface border border-border flex-row items-center gap-1.5"
                >
                  <Ionicons name="refresh" size={13} color="#71717a" />
                  <Text className="text-xs font-semibold text-muted">Refresh</Text>
                </TouchableOpacity>
              </View>

              {donationsLoading ? (
                <View className="p-8 items-center justify-center">
                  <Text className="text-muted">Loading donations...</Text>
                </View>
              ) : (donations_data || []).length > 0 ? (
                <View className="gap-3.5">
                  {donations_data!.map((item) => (
                    <View
                      key={item.id}
                      className="bg-surface rounded-2xl border border-border p-4.5 shadow-2xs gap-3"
                    >
                      <View className="flex-row flex-wrap items-start justify-between gap-2">
                        <View className="flex-1 min-w-[200px]">
                          <View className="flex-row items-center gap-2 mb-1">
                            <Text className="text-base font-bold text-foreground">
                              {item.donorName}
                            </Text>
                            {item.isAnonymous && (
                              <View className="px-2 py-0.5 rounded-full bg-zinc-200">
                                <Text className="text-[10px] font-bold text-zinc-700">
                                  Anonymous on Wall
                                </Text>
                              </View>
                            )}
                            <View
                              className={`px-2 py-0.5 rounded-full ${
                                item.status === "completed"
                                  ? "bg-emerald-50 border border-emerald-200"
                                  : item.status === "pledged"
                                  ? "bg-amber-50 border border-amber-200"
                                  : "bg-rose-50 border border-rose-200"
                              }`}
                            >
                              <Text
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  item.status === "completed"
                                    ? "text-emerald-700"
                                    : item.status === "pledged"
                                    ? "text-amber-700"
                                    : "text-rose-700"
                                }`}
                              >
                                {item.status}
                              </Text>
                            </View>
                          </View>

                          {item.donorEmail && (
                            <Text className="text-xs text-muted font-mono">{item.donorEmail}</Text>
                          )}

                          <Text className="text-[11px] text-muted mt-1">
                            Method: <Text className="font-semibold text-foreground">{item.paymentMethod}</Text> · Tier: <Text className="font-semibold text-foreground">{item.tier}</Text> · Date: {new Date(item.createdAt).toLocaleString()}
                          </Text>
                        </View>

                        <View className="items-end">
                          <Text className="text-xl font-black text-amber-500">
                            ${(item.amountInCents / 100).toFixed(2)} {item.currency}
                          </Text>
                          <Text className="text-[10px] text-muted">
                            Wall: {item.showOnWall ? "Visible" : "Hidden"}
                          </Text>
                        </View>
                      </View>

                      {item.message && (
                        <View className="bg-background/60 p-3 rounded-xl border border-border/60">
                          <Text className="text-xs text-foreground italic">
                            "{item.message}"
                          </Text>
                        </View>
                      )}

                      {/* Admin Actions */}
                      <View className="flex-row flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                        {item.status !== "completed" && (
                          <TouchableOpacity
                            onPress={() =>
                              updateDonationStatusMutation.mutate({ id: item.id, status: "completed" })
                            }
                            className="bg-emerald-500 border border-emerald-600 px-3 py-1.5 rounded-xl flex-row items-center gap-1"
                            activeOpacity={0.7}
                          >
                            <Ionicons name="checkmark" size={13} color="#fff" />
                            <Text className="text-xs font-bold text-white">Mark Completed</Text>
                          </TouchableOpacity>
                        )}

                        {item.status !== "pledged" && (
                          <TouchableOpacity
                            onPress={() =>
                              updateDonationStatusMutation.mutate({ id: item.id, status: "pledged" })
                            }
                            className="bg-amber-400/20 border border-amber-400 px-3 py-1.5 rounded-xl flex-row items-center gap-1"
                            activeOpacity={0.7}
                          >
                            <Ionicons name="time-outline" size={13} color="#d97706" />
                            <Text className="text-xs font-bold text-amber-800">Mark Pledged</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          onPress={() =>
                            toggleDonationWallMutation.mutate({
                              id: item.id,
                              showOnWall: !item.showOnWall,
                            })
                          }
                          className="bg-surface border border-border px-3 py-1.5 rounded-xl flex-row items-center gap-1"
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={item.showOnWall ? "eye-off-outline" : "eye-outline"}
                            size={13}
                            color="#71717a"
                          />
                          <Text className="text-xs font-semibold text-foreground">
                            {item.showOnWall ? "Hide on Wall" : "Show on Wall"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-surface rounded-2xl border border-border p-8 items-center justify-center">
                  <Ionicons name="gift-outline" size={32} color="#a1a1aa" />
                  <Text className="text-base font-semibold text-foreground mt-2">
                    No contributions yet
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Supporter contributions will show up here as they arrive.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
