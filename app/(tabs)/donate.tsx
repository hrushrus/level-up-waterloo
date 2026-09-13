import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth-context";

interface TierOption {
  id: string;
  amount: number; // in dollars CAD
  amountInCents: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  perk: string;
  badge?: string;
}

const TIERS: TierOption[] = [
  {
    id: "coffee",
    amount: 5,
    amountInCents: 500,
    name: "Coffee Booster",
    icon: "cafe",
    description: "Keeps server running and database healthy for 1 week",
    perk: "Supporter recognition on the Community Wall",
  },
  {
    id: "champion",
    amount: 15,
    amountInCents: 1500,
    name: "Community Champion",
    icon: "star",
    description: "Funds 1 month of automated crawler discoveries & alerts",
    perk: "Special 'Community Champion' badge on the Wall",
    badge: "Most Popular",
  },
  {
    id: "sponsor",
    amount: 25,
    amountInCents: 2500,
    name: "Platform Sponsor",
    icon: "rocket",
    description: "Helps onboard 5+ new local programs across Waterloo Region",
    perk: "Highlighted placement on the Wall of Gratitude",
  },
];

export default function DonateScreen() {
  const { user } = useAuth();

  // Tier selection
  const [selectedTierId, setSelectedTierId] = useState<string>("champion");
  const [customAmountStr, setCustomAmountStr] = useState<string>("50");
  const paymentMethod = "interac" as const;

  // e-Transfer destination email
  const DONATION_EMAIL =
    process.env.EXPO_PUBLIC_DONATION_ETRANSFER_EMAIL || "levelupwaterloo@gmail.com";
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(DONATION_EMAIL);
    }
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Form fields
  const [donorName, setDonorName] = useState(user?.name || "");
  const [donorEmail, setDonorEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showOnWall, setShowOnWall] = useState(true);

  // States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successSubmitted, setSuccessSubmitted] = useState(false);
  const [lastPledgedAmount, setLastPledgedAmount] = useState<number>(15);

  React.useEffect(() => {
    if (user) {
      if (!donorName && user.name) setDonorName(user.name);
      if (!donorEmail && user.email) setDonorEmail(user.email);
    }
  }, [user]);

  // tRPC Queries & Mutations
  const statsQuery = trpc.donations.getStats.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const submitMutation = trpc.donations.submit.useMutation();

  // Calculate current amount in cents
  const getSelectedAmountInCents = (): number => {
    if (selectedTierId === "custom") {
      const parsed = parseFloat(customAmountStr);
      if (isNaN(parsed) || parsed <= 0) return 500;
      return Math.round(parsed * 100);
    }
    const tier = TIERS.find((t) => t.id === selectedTierId);
    return tier ? tier.amountInCents : 1500;
  };

  const getSelectedAmountDollars = (): number => {
    return getSelectedAmountInCents() / 100;
  };

  const handleSupportSubmit = async () => {
    setErrorMessage(null);
    const amountInCents = getSelectedAmountInCents();

    if (amountInCents < 100) {
      setErrorMessage("Please enter a contribution amount of at least $1.00 CAD.");
      return;
    }

    if (showOnWall && !isAnonymous && !donorName.trim()) {
      setErrorMessage("Please enter your name or choose 'Display as Anonymous Supporter'.");
      return;
    }

    const finalDonorName = showOnWall
      ? (isAnonymous ? "Anonymous Supporter" : donorName.trim())
      : (donorName.trim() || "Private Supporter");

    try {
      const result = await submitMutation.mutateAsync({
        donorName: finalDonorName,
        donorEmail: donorEmail.trim() || undefined,
        amountInCents,
        currency: "CAD",
        tier: selectedTierId,
        message: message.trim() || undefined,
        isAnonymous: !showOnWall || isAnonymous,
        showOnWall,
        paymentMethod,
        transactionId: "interac_etransfer",
      });

      if (result.success) {
        setLastPledgedAmount(amountInCents / 100);
        setSuccessSubmitted(true);
        statsQuery.refetch();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to record contribution. Please try again.");
    }
  };

  const stats = statsQuery.data || {
    totalRaisedCents: 0,
    donorCount: 0,
    goalCents: 50000,
    supporters: [],
  };

  const totalRaisedDollars = Math.round(stats.totalRaisedCents / 100);
  const goalDollars = Math.round(stats.goalCents / 100);
  const progressPercent = Math.min(100, Math.round((stats.totalRaisedCents / stats.goalCents) * 100));

  return (
    <ScreenContainer className="bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-4xl mx-auto w-full px-4 pt-6">
          {/* Hero Header */}
          <View className="items-center text-center mb-8">
            <View className="w-16 h-16 rounded-3xl bg-amber-400/20 border-2 border-amber-400 items-center justify-center mb-3.5 shadow-sm">
              <Ionicons name="heart" size={32} color="#d97706" />
            </View>

            <View className="flex-row items-center gap-2 mb-2">
              <Text className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-800 text-xs font-bold uppercase tracking-wider">
                Community-Powered Platform
              </Text>
            </View>

            <Text className="text-3xl sm:text-4xl font-black text-foreground text-center tracking-tight mb-3">
              Support Level Up <Text className="text-amber-500">Waterloo</Text>
            </Text>

            <Text className="text-base text-muted text-center max-w-2xl leading-relaxed">
              Level Up Waterloo is 100% free, ad-free, and independent. We connect 30,000+ local middle and high school students across Waterloo Region with verified jobs, volunteering, competitions, and grants.
            </Text>
          </View>

          {/* Transparent Funding Meter */}
          <View className="bg-surface rounded-3xl p-6 border border-border mb-8 shadow-xs">
            <View className="flex-row flex-wrap items-center justify-between gap-4 mb-3">
              <View>
                <Text className="text-xs uppercase tracking-wider text-muted font-bold">
                  2026 Annual Infrastructure Goal
                </Text>
                <View className="flex-row items-baseline gap-2 mt-0.5">
                  <Text className="text-3xl font-black text-foreground">
                    ${totalRaisedDollars} <Text className="text-base font-semibold text-muted">CAD</Text>
                  </Text>
                  <Text className="text-sm font-semibold text-muted">
                    raised of ${goalDollars} goal
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-3">
                <View className="px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 flex-row items-center gap-1.5">
                  <Ionicons name="people" size={14} color="#d97706" />
                  <Text className="text-xs font-bold text-amber-800">
                    {stats.donorCount} Supporters
                  </Text>
                </View>
                <View className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <Text className="text-xs font-bold text-emerald-700">
                    {progressPercent}% Funded
                  </Text>
                </View>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="w-full h-3.5 bg-muted/20 rounded-full overflow-hidden mb-2">
              <View
                style={{ width: `${Math.max(5, progressPercent)}%` }}
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
              />
            </View>

            <Text className="text-xs text-muted">
              100% of community contributions go directly to server hosting, uptime monitoring, and daily crawler compute.
            </Text>
          </View>

          {/* Transparency / What Your Contribution Funds */}
          <View className="mb-8">
            <Text className="text-xs uppercase tracking-wider text-muted font-bold mb-4 text-center">
              Where Every Dollar Goes
            </Text>
            <View className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              <View className="p-4 rounded-2xl bg-surface border border-border/80">
                <View className="w-9 h-9 rounded-xl bg-blue-500/10 items-center justify-center mb-2.5">
                  <Ionicons name="server-outline" size={18} color="#3b82f6" />
                </View>
                <Text className="text-sm font-bold text-foreground mb-1">
                  Hosting & Database
                </Text>
                <Text className="text-xs text-muted leading-relaxed">
                  24/7 high-speed cloud server and managed MySQL database with 99.9% uptime.
                </Text>
              </View>

              <View className="p-4 rounded-2xl bg-surface border border-border/80">
                <View className="w-9 h-9 rounded-xl bg-amber-500/10 items-center justify-center mb-2.5">
                  <Ionicons name="hardware-chip-outline" size={18} color="#d97706" />
                </View>
                <Text className="text-sm font-bold text-foreground mb-1">
                  Automated Crawlers
                </Text>
                <Text className="text-xs text-muted leading-relaxed">
                  Nightly scheduled scrapers verifying links, deadlines, and new Waterloo programs.
                </Text>
              </View>

              <View className="p-4 rounded-2xl bg-surface border border-border/80">
                <View className="w-9 h-9 rounded-xl bg-emerald-500/10 items-center justify-center mb-2.5">
                  <Ionicons name="shield-checkmark-outline" size={18} color="#10b981" />
                </View>
                <Text className="text-sm font-bold text-foreground mb-1">
                  Zero Ads Forever
                </Text>
                <Text className="text-xs text-muted leading-relaxed">
                  No tracking cookies, banner ads, or paywalls targeting students or parents.
                </Text>
              </View>

              <View className="p-4 rounded-2xl bg-surface border border-border/80">
                <View className="w-9 h-9 rounded-xl bg-purple-500/10 items-center justify-center mb-2.5">
                  <Ionicons name="location-outline" size={18} color="#a855f7" />
                </View>
                <Text className="text-sm font-bold text-foreground mb-1">
                  Local Expansion
                </Text>
                <Text className="text-xs text-muted leading-relaxed">
                  Adding more programs in Kitchener, Cambridge, Woolwich, and Wilmot.
                </Text>
              </View>
            </View>
          </View>

          {/* Success State */}
          {successSubmitted ? (
            <View className="bg-amber-400/15 border-2 border-amber-400 rounded-3xl p-8 items-center text-center mb-10 shadow-sm">
              <View className="w-16 h-16 rounded-full bg-amber-400 items-center justify-center mb-4">
                <Ionicons name="checkmark-done" size={32} color="#000" />
              </View>
              <Text className="text-2xl font-black text-foreground mb-2">
                Thank You for Supporting Local Youth!
              </Text>
              <Text className="text-base text-muted max-w-lg mb-4 leading-relaxed">
                Your contribution of <Text className="font-bold text-foreground">${lastPledgedAmount} CAD</Text> has been recorded. You are helping keep Level Up Waterloo free and active for students across our community!
              </Text>

              {showOnWall ? (
                <View className="flex-row items-center gap-2 mb-6 bg-amber-400/20 border border-amber-400/40 px-4 py-2 rounded-full">
                  <Ionicons name="ribbon" size={15} color="#d97706" />
                  <Text className="text-xs font-bold text-amber-800">
                    Recognized on the Community Wall of Gratitude below!
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-2 mb-6 bg-surface border border-border px-4 py-2 rounded-full">
                  <Ionicons name="lock-closed" size={14} color="#71717a" />
                  <Text className="text-xs font-semibold text-muted">
                    Private donation — will not be listed on the public wall or website.
                  </Text>
                </View>
              )}

              <View className="bg-surface p-5 rounded-2xl border border-amber-400/40 w-full max-w-md mb-6 text-left shadow-2xs">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Interac e-Transfer Instructions
                  </Text>
                  <View className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    <Text className="text-2xs font-bold text-emerald-700">Autodeposit Active</Text>
                  </View>
                </View>

                <Text className="text-xs text-muted mb-2">
                  Please open your Canadian banking app and send <Text className="font-bold text-foreground">${lastPledgedAmount} CAD</Text> to:
                </Text>

                <View className="flex-row items-center justify-between bg-amber-400/10 p-3 rounded-xl border border-amber-400/30 mb-3">
                  <Text className="text-sm font-mono font-bold text-amber-900 select-all">
                    {DONATION_EMAIL}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCopyEmail}
                    className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 ${
                      copiedEmail ? "bg-emerald-600" : "bg-black border border-amber-400"
                    }`}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={copiedEmail ? "checkmark" : "copy-outline"}
                      size={13}
                      color={copiedEmail ? "#fff" : "#fbbf24"}
                    />
                    <Text
                      className={`text-2xs font-bold ${
                        copiedEmail ? "text-white" : "text-amber-400"
                      }`}
                    >
                      {copiedEmail ? "Copied!" : "Copy Email"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-xs text-muted mb-1">
                  Optional transfer memo: <Text className="font-semibold text-foreground">LevelUp - {isAnonymous || !showOnWall ? "Anonymous" : donorName || "Community Member"}</Text>
                </Text>
                <Text className="text-2xs text-muted leading-relaxed">
                  No security question needed. Funds deposit automatically and 100% goes to operational costs.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setSuccessSubmitted(false);
                  setMessage("");
                }}
                className="bg-black border border-amber-400 px-6 py-2.5 rounded-full"
                activeOpacity={0.8}
              >
                <Text className="text-amber-400 font-bold text-sm">
                  Make Another Contribution
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Donation Contribution Form */
            <View className="bg-surface rounded-3xl p-6 sm:p-8 border border-border mb-10 shadow-xs">
              <Text className="text-xl font-bold text-foreground mb-1.5">
                Choose Your Contribution
              </Text>
              <Text className="text-xs text-muted mb-5">
                Select a tier or enter a custom amount. All amounts are in Canadian Dollars (CAD).
              </Text>

              {/* Tiers Grid */}
              <View className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                {TIERS.map((tier) => {
                  const isSelected = selectedTierId === tier.id;
                  return (
                    <TouchableOpacity
                      key={tier.id}
                      onPress={() => setSelectedTierId(tier.id)}
                      className={`relative p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "bg-amber-400/15 border-amber-500 shadow-xs"
                          : "bg-background/60 border-border hover:border-border/80"
                      }`}
                      activeOpacity={0.75}
                    >
                      {tier.badge && (
                        <View className="absolute -top-2.5 right-3 bg-black border border-amber-400/50 px-2 py-0.5 rounded-full">
                          <Text className="text-[10px] font-bold text-amber-400">
                            {tier.badge}
                          </Text>
                        </View>
                      )}
                      <View className="flex-row items-center justify-between mb-2">
                        <Ionicons
                          name={tier.icon}
                          size={22}
                          color={isSelected ? "#d97706" : "#71717a"}
                        />
                        <Text className="text-xl font-black text-foreground">
                          ${tier.amount} <Text className="text-xs font-semibold text-muted">CAD</Text>
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-foreground mb-1">
                        {tier.name}
                      </Text>
                      <Text className="text-xs text-muted leading-snug">
                        {tier.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Amount Option */}
              <TouchableOpacity
                onPress={() => setSelectedTierId("custom")}
                className={`p-4 rounded-2xl border flex-row items-center justify-between mb-6 ${
                  selectedTierId === "custom"
                    ? "bg-amber-400/15 border-amber-500"
                    : "bg-background/60 border-border"
                }`}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons
                    name="pricetag-outline"
                    size={20}
                    color={selectedTierId === "custom" ? "#d97706" : "#71717a"}
                  />
                  <Text className="text-sm font-bold text-foreground">
                    Custom Contribution Amount
                  </Text>
                </View>
                {selectedTierId === "custom" ? (
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-sm font-bold text-foreground">$</Text>
                    <TextInput
                      value={customAmountStr}
                      onChangeText={setCustomAmountStr}
                      keyboardType="numeric"
                      className="bg-surface border border-amber-500 rounded-lg px-3 py-1 text-foreground font-bold text-base w-24 text-right"
                      placeholder="50"
                    />
                    <Text className="text-xs text-muted font-semibold">CAD</Text>
                  </View>
                ) : (
                  <Text className="text-xs font-semibold text-muted">
                    Enter any amount
                  </Text>
                )}
              </TouchableOpacity>

              {/* Dedicated Contribution Method: Interac e-Transfer */}
              <Text className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
                Contribution Method
              </Text>
              <View className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/40 mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-xl bg-amber-400 items-center justify-center">
                      <Ionicons name="send" size={16} color="#000" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">
                        Interac e-Transfer (Canada)
                      </Text>
                      <Text className="text-2xs text-muted">
                        100% of your donation reaches local youth (0% processing fees)
                      </Text>
                    </View>
                  </View>
                  <View className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    <Text className="text-2xs font-bold text-emerald-700">Autodeposit</Text>
                  </View>
                </View>

                <View className="bg-surface p-3 rounded-xl border border-border flex-row items-center justify-between mt-1.5">
                  <View className="flex-1 mr-2">
                    <Text className="text-2xs uppercase tracking-wider text-muted font-bold">
                      Send e-Transfer To:
                    </Text>
                    <Text className="text-sm font-mono font-bold text-foreground select-all">
                      {DONATION_EMAIL}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCopyEmail}
                    className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 ${
                      copiedEmail ? "bg-emerald-600" : "bg-black border border-amber-400"
                    }`}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={copiedEmail ? "checkmark" : "copy-outline"}
                      size={13}
                      color={copiedEmail ? "#fff" : "#fbbf24"}
                    />
                    <Text
                      className={`text-xs font-bold ${
                        copiedEmail ? "text-white" : "text-amber-400"
                      }`}
                    >
                      {copiedEmail ? "Copied!" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Website Recognition Option */}
              <View className="mb-6">
                <Text className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
                  Website Recognition Preference
                </Text>

                <View className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* Option 1: Yes, recognize on website */}
                  <TouchableOpacity
                    onPress={() => setShowOnWall(true)}
                    className={`p-4 rounded-2xl border transition-all ${
                      showOnWall
                        ? "bg-amber-400/15 border-amber-500 shadow-2xs"
                        : "bg-background/60 border-border"
                    }`}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <Ionicons
                          name="ribbon"
                          size={18}
                          color={showOnWall ? "#d97706" : "#71717a"}
                        />
                        <Text className="text-sm font-bold text-foreground">
                          Recognize on Website
                        </Text>
                      </View>
                      <Ionicons
                        name={showOnWall ? "radio-button-on" : "radio-button-off"}
                        size={18}
                        color={showOnWall ? "#d97706" : "#71717a"}
                      />
                    </View>
                    <Text className="text-xs text-muted leading-relaxed">
                      Feature your contribution on the community Wall of Gratitude with an optional encouraging note.
                    </Text>
                  </TouchableOpacity>

                  {/* Option 2: No, keep private */}
                  <TouchableOpacity
                    onPress={() => setShowOnWall(false)}
                    className={`p-4 rounded-2xl border transition-all ${
                      !showOnWall
                        ? "bg-amber-400/15 border-amber-500 shadow-2xs"
                        : "bg-background/60 border-border"
                    }`}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <Ionicons
                          name="lock-closed"
                          size={18}
                          color={!showOnWall ? "#d97706" : "#71717a"}
                        />
                        <Text className="text-sm font-bold text-foreground">
                          Keep Private (No Recognition)
                        </Text>
                      </View>
                      <Ionicons
                        name={!showOnWall ? "radio-button-on" : "radio-button-off"}
                        size={18}
                        color={!showOnWall ? "#d97706" : "#71717a"}
                      />
                    </View>
                    <Text className="text-xs text-muted leading-relaxed">
                      Do not display my name, amount, or message on the website. Counted only toward aggregate goal.
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Conditional Fields Based on Recognition Choice */}
                {showOnWall ? (
                  <View className="p-4.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 gap-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        Public Display Details
                      </Text>
                      <TouchableOpacity
                        onPress={() => setIsAnonymous(!isAnonymous)}
                        className="flex-row items-center gap-1.5"
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isAnonymous ? "checkbox" : "square-outline"}
                          size={17}
                          color={isAnonymous ? "#d97706" : "#71717a"}
                        />
                        <Text className="text-xs font-semibold text-foreground">
                          Display as Anonymous Supporter
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {!isAnonymous && (
                      <View>
                        <Text className="text-xs font-bold text-foreground mb-1">
                          Display Name or Organization <Text className="text-amber-600">*</Text>
                        </Text>
                        <TextInput
                          value={donorName}
                          onChangeText={setDonorName}
                          placeholder="e.g., Sarah Chen or Waterloo Robotics Club"
                          className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                    )}

                    <View>
                      <Text className="text-xs font-bold text-foreground mb-1">
                        Encouraging Message for Students <Text className="text-muted font-normal">(optional, shown on wall)</Text>
                      </Text>
                      <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="e.g., 'Proud to support our local students reaching their potential! Keep up the great work.'"
                        multiline
                        numberOfLines={3}
                        className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground"
                        placeholderTextColor="#9ca3af"
                        style={{ minHeight: 65, textAlignVertical: "top" }}
                      />
                    </View>

                    <View>
                      <Text className="text-xs font-bold text-foreground mb-1">
                        Email Address <Text className="text-muted font-normal">(private, never displayed publicly)</Text>
                      </Text>
                      <TextInput
                        value={donorEmail}
                        onChangeText={setDonorEmail}
                        placeholder="you@domain.ca"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                ) : (
                  <View className="p-4.5 rounded-2xl bg-zinc-100 border border-zinc-200 gap-3.5">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name="shield-checkmark" size={18} color="#10b981" />
                      <Text className="text-xs font-bold text-zinc-800">
                        100% Private Donation Guaranteed
                      </Text>
                    </View>
                    <Text className="text-xs text-muted leading-relaxed">
                      Your contribution supports Level Up Waterloo behind the scenes. Nothing will ever be published on the website or Wall of Gratitude.
                    </Text>

                    <View>
                      <Text className="text-xs font-bold text-foreground mb-1">
                        Name or Organization <Text className="text-muted font-normal">(optional, internal record only)</Text>
                      </Text>
                      <TextInput
                        value={donorName}
                        onChangeText={setDonorName}
                        placeholder="Optional name for our records"
                        className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View>
                      <Text className="text-xs font-bold text-foreground mb-1">
                        Private Note to Organizers <Text className="text-muted font-normal">(optional, internal only)</Text>
                      </Text>
                      <TextInput
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Optional private feedback or note to the team"
                        multiline
                        numberOfLines={2}
                        className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground"
                        placeholderTextColor="#9ca3af"
                        style={{ minHeight: 55, textAlignVertical: "top" }}
                      />
                    </View>

                    <View>
                      <Text className="text-xs font-bold text-foreground mb-1">
                        Email Address <Text className="text-muted font-normal">(optional, for confirmation)</Text>
                      </Text>
                      <TextInput
                        value={donorEmail}
                        onChangeText={setDonorEmail}
                        placeholder="you@domain.ca"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-foreground"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>
                )}
              </View>

              {errorMessage && (
                <View className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4 flex-row items-center gap-2">
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text className="text-xs text-red-600 font-medium flex-1">
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* Submit CTA */}
              <TouchableOpacity
                onPress={handleSupportSubmit}
                disabled={submitMutation.isPending}
                className="w-full bg-amber-400 hover:bg-amber-500 border border-amber-500 py-3.5 rounded-2xl items-center justify-center flex-row gap-2 shadow-sm"
                activeOpacity={0.85}
              >
                {submitMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="send" size={17} color="#000" />
                    <Text className="text-black font-black text-base">
                      Confirm ${getSelectedAmountDollars()} CAD e-Transfer
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Community Supporter Wall of Gratitude */}
          <View className="mb-12">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="ribbon" size={20} color="#d97706" />
                <Text className="text-lg font-bold text-foreground">
                  Community Wall of Gratitude
                </Text>
              </View>
              <Text className="text-xs text-muted">
                {stats.supporters.length} Supporters Recognized
              </Text>
            </View>

            {stats.supporters.length === 0 ? (
              <View className="bg-surface rounded-2xl p-8 border border-border items-center text-center">
                <Ionicons name="sparkles-outline" size={28} color="#d97706" />
                <Text className="text-sm font-bold text-foreground mt-2 mb-1">
                  Be the First Community Supporter!
                </Text>
                <Text className="text-xs text-muted max-w-sm">
                  Your name and message of encouragement will be proudly featured right here on the Wall of Gratitude.
                </Text>
              </View>
            ) : (
              <View className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {stats.supporters.map((sup) => (
                  <View
                    key={sup.id}
                    className="p-4 rounded-2xl bg-surface border border-border/90 shadow-2xs"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <View className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 items-center justify-center">
                          <Ionicons name="heart" size={14} color="#d97706" />
                        </View>
                        <View>
                          <Text className="text-sm font-bold text-foreground">
                            {sup.displayName}
                          </Text>
                          <Text className="text-[10px] text-muted">
                            {new Date(sup.createdAt).toLocaleDateString("en-CA", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </Text>
                        </View>
                      </View>
                      <View className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30">
                        <Text className="text-xs font-bold text-amber-700">
                          ${Math.round(sup.amountInCents / 100)} {sup.currency}
                        </Text>
                      </View>
                    </View>

                    {sup.message && (
                      <Text className="text-xs text-muted italic bg-background/50 p-2.5 rounded-xl border border-border/60 mt-1">
                        "{sup.message}"
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Frequently Asked Questions */}
          <View className="bg-surface rounded-3xl p-6 sm:p-8 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">
              Frequently Asked Questions
            </Text>

            <View className="gap-4">
              <View className="pb-3 border-b border-border/60">
                <Text className="text-sm font-bold text-foreground mb-1">
                  Is Level Up Waterloo free for students?
                </Text>
                <Text className="text-xs text-muted leading-relaxed">
                  Yes, 100% free and open. Students, teachers, and parents do not need to pay anything to view, bookmark, or apply to opportunities. Community donations keep the infrastructure running without ads.
                </Text>
              </View>

              <View className="pb-3 border-b border-border/60">
                <Text className="text-sm font-bold text-foreground mb-1">
                  Can our organization or company become an official sponsor?
                </Text>
                <Text className="text-xs text-muted leading-relaxed">
                  Yes! Local businesses, non-profits, and educational institutions interested in supporting student opportunities across Waterloo Region can contact us at <Text className="font-semibold text-foreground">support@levelupwaterloo.local</Text> for sponsor recognition and partnership.
                </Text>
              </View>

              <View>
                <Text className="text-sm font-bold text-foreground mb-1">
                  Can I suggest an opportunity instead of donating?
                </Text>
                <Text className="text-xs text-muted leading-relaxed">
                  Absolutely! Sharing local youth programs, volunteer posts, and student competitions is one of the biggest ways to contribute. Use the "Suggest" button in the navigation bar to submit any opportunity you find.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
