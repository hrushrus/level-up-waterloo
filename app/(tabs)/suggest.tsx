import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

type SuggestionType = "opportunity" | "source";

const CATEGORIES = [
  { id: "volunteering", label: "Volunteering", icon: "heart-outline" },
  { id: "experiential_learning", label: "Jobs & Work", icon: "briefcase-outline" },
  { id: "sports", label: "Sports & Fitness", icon: "football-outline" },
  { id: "stem_competition", label: "STEM & Tech", icon: "rocket-outline" },
  { id: "extracurricular", label: "Clubs & Arts", icon: "color-palette-outline" },
  { id: "grant", label: "Grants & Awards", icon: "trophy-outline" },
  { id: "other", label: "Other", icon: "grid-outline" },
] as const;

export default function SuggestScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [type, setType] = useState<SuggestionType>("opportunity");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<
    "extracurricular" | "grant" | "stem_competition" | "sports" | "volunteering" | "experiential_learning" | "other"
  >("volunteering");
  const [targetAge, setTargetAge] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [submitterName, setSubmitterName] = useState(user?.name || "");
  const [submitterEmail, setSubmitterEmail] = useState(user?.email || "");

  React.useEffect(() => {
    if (user) {
      if (!submitterName && user.name) setSubmitterName(user.name);
      if (!submitterEmail && user.email) setSubmitterEmail(user.email);
    }
  }, [user]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const submitMutation = trpc.suggestions.submit.useMutation();

  const handleSubmit = async () => {
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg(type === "opportunity" ? "Please enter an opportunity title." : "Please enter a source name.");
      return;
    }

    if (type === "source" && !url.trim()) {
      setErrorMsg("Please enter the website or portal URL for this source.");
      return;
    }

    if (!description.trim()) {
      setErrorMsg("Please provide a short description or details.");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        type,
        title: title.trim(),
        organization: organization.trim() || undefined,
        url: url.trim() || undefined,
        category,
        targetAge: targetAge.trim() || undefined,
        description: description.trim(),
        notes: notes.trim() || undefined,
        submitterName: submitterName.trim() || undefined,
        submitterEmail: submitterEmail.trim() || undefined,
      });

      setSubmittedSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong while submitting. Please try again.");
    }
  };

  const handleReset = () => {
    setTitle("");
    setOrganization("");
    setUrl("");
    setTargetAge("");
    setDescription("");
    setNotes("");
    setErrorMsg(null);
    setSubmittedSuccess(false);
  };

  return (
    <ScreenContainer className="p-0 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
          {/* Header */}
          <View className="mb-6 pb-4 border-b border-border">
            <View className="flex-row items-center gap-2.5 mb-1.5">
              <View className="bg-amber-400/15 p-2 rounded-xl">
                <Ionicons name="bulb" size={22} color="#d97706" />
              </View>
              <Text className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Community Suggestions
              </Text>
            </View>
            <Text className="text-sm text-muted leading-relaxed">
              Help keep Level Up Waterloo comprehensive! Suggest a new youth opportunity or a local organization/website for our crawler to monitor.
            </Text>
          </View>

          {!user ? (
            /* Login Required Prompt */
            <View className="bg-surface border border-border rounded-3xl p-6 sm:p-10 items-center text-center shadow-xs">
              <View className="w-16 h-16 rounded-full bg-amber-400/15 border border-amber-400/30 items-center justify-center mb-4">
                <Ionicons name="lock-closed" size={30} color="#d97706" />
              </View>

              <Text className="text-2xl font-black text-foreground text-center mb-2">
                Sign In to Submit Suggestions
              </Text>
              <Text className="text-sm text-muted text-center max-w-md mb-6 leading-relaxed">
                To protect against spam and notify you when your opportunity or source is reviewed and published, please sign in or create an account.
              </Text>

              <View className="flex-row flex-wrap gap-3 justify-center w-full max-w-sm">
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/login" as any)}
                  className="flex-1 py-3 px-4 rounded-xl bg-black border border-amber-400/50 items-center shadow-xs"
                  activeOpacity={0.8}
                >
                  <Text className="text-sm font-bold text-amber-400">Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/(auth)/signup" as any)}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-400 border border-amber-500 items-center shadow-xs"
                  activeOpacity={0.8}
                >
                  <Text className="text-sm font-bold text-black">Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : submittedSuccess ? (
            /* Success State */
            <View className="bg-surface border border-border rounded-3xl p-6 sm:p-10 items-center text-center shadow-xs">
              <View className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={40} color="#10b981" />
              </View>

              <Text className="text-2xl font-black text-foreground text-center mb-2">
                Thank You for the Suggestion!
              </Text>
              <Text className="text-sm text-muted text-center max-w-md mb-6 leading-relaxed">
                Your suggestion for <Text className="font-bold text-foreground">"{title}"</Text> has been submitted to the Level Up Waterloo team. We will review it and add it to our platform.
              </Text>

              <View className="flex-row flex-wrap gap-3 justify-center w-full max-w-sm">
                <TouchableOpacity
                  onPress={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl border border-border bg-background items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-sm font-bold text-foreground">Suggest Another</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/(tabs)" as any)}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-400 border border-amber-500 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-sm font-bold text-black">Explore Feed</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Form State */
            <View className="bg-surface border border-border rounded-3xl p-5 sm:p-8 shadow-xs">
              {/* Type Switcher Tabs */}
              <View className="mb-6">
                <Text className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  What would you like to suggest?
                </Text>
                <View className="flex-row bg-background p-1 rounded-2xl border border-border">
                  <TouchableOpacity
                    onPress={() => setType("opportunity")}
                    className={`flex-1 py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-2 ${
                      type === "opportunity" ? "bg-black shadow-xs" : ""
                    }`}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="star"
                      size={16}
                      color={type === "opportunity" ? "#fbbf24" : "#71717a"}
                    />
                    <Text
                      className={`text-xs sm:text-sm font-bold ${
                        type === "opportunity" ? "text-amber-400" : "text-muted"
                      }`}
                    >
                      Specific Opportunity
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setType("source")}
                    className={`flex-1 py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-2 ${
                      type === "source" ? "bg-black shadow-xs" : ""
                    }`}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="globe"
                      size={16}
                      color={type === "source" ? "#fbbf24" : "#71717a"}
                    />
                    <Text
                      className={`text-xs sm:text-sm font-bold ${
                        type === "source" ? "text-amber-400" : "text-muted"
                      }`}
                    >
                      Website / Source to Crawl
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-muted mt-2 ml-1">
                  {type === "opportunity"
                    ? "Suggest an individual event, job, volunteer role, sports club tryout, or competition."
                    : "Suggest an organization, community center, or website directory we should regularly track."}
                </Text>
              </View>

              {/* Error Banner */}
              {errorMsg && (
                <View className="mb-5 bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex-row items-center gap-2.5">
                  <Ionicons name="alert-circle" size={18} color="#ef4444" />
                  <Text className="text-xs sm:text-sm text-rose-700 font-semibold flex-1">
                    {errorMsg}
                  </Text>
                </View>
              )}

              {/* Title Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  {type === "opportunity" ? "Opportunity Title *" : "Source / Organization Name *"}
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={
                    type === "opportunity"
                      ? "e.g., Waterloo Minor Hockey Tryouts, KW Youth Coding Club"
                      : "e.g., City of Waterloo ActiveLiving Portal, KW Volunteer Centre"
                  }
                  placeholderTextColor="#a1a1aa"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground"
                />
              </View>

              {/* Organization Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  {type === "opportunity" ? "Organization / Host" : "Parent Organization / Department"}
                </Text>
                <TextInput
                  value={organization}
                  onChangeText={setOrganization}
                  placeholder="e.g., City of Waterloo, University of Waterloo, YMCA, Local Club"
                  placeholderTextColor="#a1a1aa"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground"
                />
              </View>

              {/* URL Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  {type === "opportunity" ? "Link / Application URL" : "Website or Portal URL *"}
                </Text>
                <TextInput
                  value={url}
                  onChangeText={setUrl}
                  placeholder="https://..."
                  keyboardType="url"
                  autoCapitalize="none"
                  placeholderTextColor="#a1a1aa"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground"
                />
              </View>

              {/* Category Selector */}
              <View className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const selected = category === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setCategory(cat.id as any)}
                        className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                          selected
                            ? "bg-amber-400/20 border-amber-500 text-foreground"
                            : "bg-background border-border text-muted"
                        }`}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={cat.icon as any}
                          size={13}
                          color={selected ? "#d97706" : "#71717a"}
                        />
                        <Text
                          className={`text-xs font-bold ${
                            selected ? "text-amber-800" : "text-muted"
                          }`}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Target Age / Grade */}
              {type === "opportunity" && (
                <View className="mb-4">
                  <Text className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                    Target Age / Grade Eligibility
                  </Text>
                  <TextInput
                    value={targetAge}
                    onChangeText={setTargetAge}
                    placeholder="e.g., Ages 14+, Grades 9-12, Middle School, High School"
                    placeholderTextColor="#a1a1aa"
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground"
                  />
                </View>
              )}

              {/* Description Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  {type === "opportunity"
                    ? "Details & Description *"
                    : "What kind of youth opportunities do they offer? *"}
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={
                    type === "opportunity"
                      ? "Describe the role, duties, dates, compensation or cost, and why it's great for local students."
                      : "Describe the programs, seasonal postings, sports, or resources available on this source."
                  }
                  placeholderTextColor="#a1a1aa"
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 90, textAlignVertical: "top" }}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground"
                />
              </View>

              {/* Notes Input */}
              <View className="mb-6">
                <Text className="text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                  Additional Tips or Referral Notes (Optional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g., Registration opens March 1st, deadline is approaching, or contact person info"
                  placeholderTextColor="#a1a1aa"
                  multiline
                  numberOfLines={2}
                  style={{ minHeight: 60, textAlignVertical: "top" }}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground"
                />
              </View>

              {/* Submitter Details (Optional) */}
              <View className="pt-4 border-t border-border mb-6">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Ionicons name="person-outline" size={14} color="#71717a" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-muted">
                    Your Contact Info (Optional)
                  </Text>
                </View>
                <Text className="text-xs text-muted mb-3">
                  Leave your details if you'd like an email notification when this is reviewed or published.
                </Text>

                <View className="flex-row flex-wrap gap-3">
                  <View className="flex-1 min-w-[140px]">
                    <TextInput
                      value={submitterName}
                      onChangeText={setSubmitterName}
                      placeholder="Your name"
                      placeholderTextColor="#a1a1aa"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground"
                    />
                  </View>
                  <View className="flex-1 min-w-[160px]">
                    <TextInput
                      value={submitterEmail}
                      onChangeText={setSubmitterEmail}
                      placeholder="your.email@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#a1a1aa"
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground"
                    />
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitMutation.isPending}
                className="w-full bg-black border border-amber-400/40 rounded-2xl py-3.5 items-center flex-row justify-center gap-2 shadow-xs"
                activeOpacity={0.8}
                style={submitMutation.isPending ? { opacity: 0.6 } : {}}
              >
                {submitMutation.isPending ? (
                  <ActivityIndicator color="#FBBF24" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#FBBF24" />
                    <Text className="text-amber-400 font-extrabold text-sm sm:text-base">
                      Submit Suggestion
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
