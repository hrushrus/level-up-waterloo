import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  Pressable,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { copyToClipboard, triggerNativeShare } from "@/lib/share-utils";

export interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  summary?: string;
  url: string;
  type?: "opportunity" | "website";
  category?: string;
}

export function ShareModal({
  visible,
  onClose,
  title,
  summary,
  url,
  type = "opportunity",
  category,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!visible) return null;

  const isOpportunity = type === "opportunity";
  const shareHeading = isOpportunity ? "Share Opportunity" : "Share Level Up Waterloo";
  const shareText = isOpportunity
    ? `Check out "${title}" on Level Up Waterloo!`
    : "Discover jobs, volunteering, competitions, and grants for students across Waterloo Region on Level Up Waterloo!";

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    await triggerNativeShare({
      title,
      text: shareText,
      url,
    });
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n\n${url}`);
    Linking.openURL(`https://api.whatsapp.com/send?text=${text}`).catch(console.error);
  };

  const handleShareSMS = () => {
    const body = encodeURIComponent(`${shareText} ${url}`);
    const separator = Platform.OS === "ios" ? "&" : "?";
    Linking.openURL(`sms:${separator}body=${body}`).catch(console.error);
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(
      isOpportunity ? `Student Opportunity: ${title}` : "Check out Level Up Waterloo!"
    );
    const body = encodeURIComponent(
      `${shareText}\n\n${summary ? summary + "\n\n" : ""}Learn more or apply here: ${url}\n\n— Shared from Level Up Waterloo (https://waterloo-student-opps.expo.app)`
    );
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(console.error);
  };

  const handleShareTwitter = () => {
    const tweetText = encodeURIComponent(shareText);
    const tweetUrl = encodeURIComponent(url);
    Linking.openURL(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`).catch(console.error);
  };

  const handleShareLinkedIn = () => {
    const linkedInUrl = encodeURIComponent(url);
    Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?url=${linkedInUrl}`).catch(console.error);
  };

  const hasNativeShare =
    Platform.OS !== "web" ||
    (typeof navigator !== "undefined" && typeof navigator.share === "function");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 items-center justify-center p-4"
        style={{ backdropFilter: "blur(4px)" } as any}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-surface w-full max-w-md rounded-3xl border border-border overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <View className="p-5 border-b border-border/70 flex-row items-center justify-between bg-zinc-50/50">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 items-center justify-center">
                <Ionicons
                  name={isOpportunity ? "share-social" : "megaphone"}
                  size={18}
                  color="#d97706"
                />
              </View>
              <View>
                <Text className="text-base font-bold text-foreground">
                  {shareHeading}
                </Text>
                <Text className="text-xs text-muted">
                  Spread the word with classmates & teachers
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-surface border border-border items-center justify-center hover:bg-zinc-100"
              activeOpacity={0.7}
              accessibilityLabel="Close share dialog"
            >
              <Ionicons name="close" size={18} color="#71717a" />
            </TouchableOpacity>
          </View>

          <View className="p-5">
            {/* Opportunity / Website Preview Card */}
            <View className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 mb-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons
                  name={isOpportunity ? "school-outline" : "sparkles"}
                  size={14}
                  color="#d97706"
                />
                <Text className="text-2xs font-bold uppercase tracking-wider text-amber-800">
                  {isOpportunity ? (category || "Student Opportunity") : "Waterloo Region Platform"}
                </Text>
              </View>
              <Text
                className="text-sm font-bold text-foreground leading-snug mb-1"
                numberOfLines={2}
              >
                {title}
              </Text>
              {summary ? (
                <Text className="text-xs text-muted leading-relaxed" numberOfLines={2}>
                  {summary}
                </Text>
              ) : null}
            </View>

            {/* Quick Copy Link Box */}
            <Text className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
              Shareable Link
            </Text>
            <View className="flex-row items-center bg-background border border-border rounded-2xl p-2 mb-5">
              <Ionicons name="link-outline" size={18} color="#71717a" className="ml-2 mr-2" />
              <Text
                className="flex-1 text-xs text-muted font-mono select-all mr-2"
                numberOfLines={1}
              >
                {url}
              </Text>
              <TouchableOpacity
                onPress={handleCopy}
                className={`px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 transition-all ${
                  copied
                    ? "bg-emerald-600 border border-emerald-600"
                    : "bg-black border border-amber-400"
                }`}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={14}
                  color={copied ? "#fff" : "#fbbf24"}
                />
                <Text
                  className={`text-xs font-bold ${
                    copied ? "text-white" : "text-amber-400"
                  }`}
                >
                  {copied ? "Copied!" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Social & Messaging Channels Grid */}
            <Text className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5">
              Send Directly Via
            </Text>
            <View className="grid grid-cols-4 gap-2 mb-4">
              {/* WhatsApp */}
              <TouchableOpacity
                onPress={handleShareWhatsApp}
                className="items-center justify-center p-2.5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20"
                activeOpacity={0.7}
              >
                <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                <Text className="text-2xs font-semibold text-foreground mt-1.5">
                  WhatsApp
                </Text>
              </TouchableOpacity>

              {/* SMS / Text */}
              <TouchableOpacity
                onPress={handleShareSMS}
                className="items-center justify-center p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20"
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#3b82f6" />
                <Text className="text-2xs font-semibold text-foreground mt-1.5">
                  Message
                </Text>
              </TouchableOpacity>

              {/* Email */}
              <TouchableOpacity
                onPress={handleShareEmail}
                className="items-center justify-center p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20"
                activeOpacity={0.7}
              >
                <Ionicons name="mail-outline" size={22} color="#d97706" />
                <Text className="text-2xs font-semibold text-foreground mt-1.5">
                  Email
                </Text>
              </TouchableOpacity>

              {/* X / Twitter */}
              <TouchableOpacity
                onPress={handleShareTwitter}
                className="items-center justify-center p-2.5 rounded-2xl bg-black/10 border border-black/20 hover:bg-black/15"
                activeOpacity={0.7}
              >
                <Ionicons name="logo-twitter" size={22} color="#000000" />
                <Text className="text-2xs font-semibold text-foreground mt-1.5">
                  X / Post
                </Text>
              </TouchableOpacity>
            </View>

            {/* Native Share button (if supported) */}
            {hasNativeShare ? (
              <TouchableOpacity
                onPress={handleNativeShare}
                className="w-full py-3 rounded-2xl bg-amber-400 border border-amber-500 items-center justify-center flex-row gap-2 mb-2 shadow-xs"
                activeOpacity={0.85}
              >
                <Ionicons name="share-outline" size={17} color="#000" />
                <Text className="text-black font-bold text-sm">
                  More Share Options (Device Sheet)
                </Text>
              </TouchableOpacity>
            ) : null}

            {/* LinkedIn link */}
            <TouchableOpacity
              onPress={handleShareLinkedIn}
              className="w-full py-2.5 rounded-xl bg-surface border border-border items-center justify-center flex-row gap-2 hover:bg-zinc-50"
              activeOpacity={0.8}
            >
              <Ionicons name="logo-linkedin" size={16} color="#0a66c2" />
              <Text className="text-xs font-semibold text-foreground">
                Share on LinkedIn
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
