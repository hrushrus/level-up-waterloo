import React, { useEffect, useRef } from "react";
import { View, Animated, Platform } from "react-native";

export function OpportunitySkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View className="gap-3 w-full">
      {[1, 2, 3, 4].map((key) => (
        <View
          key={key}
          className="bg-surface rounded-2xl border border-border p-4 sm:p-5 mb-1 overflow-hidden"
        >
          {/* Top Row Pill Placeholders */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row gap-2">
              <Animated.View
                style={{ opacity: pulseAnim }}
                className="w-24 h-6 rounded-full bg-muted/20"
              />
              <Animated.View
                style={{ opacity: pulseAnim }}
                className="w-20 h-6 rounded-full bg-muted/15"
              />
            </View>
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="w-6 h-6 rounded-full bg-muted/20"
            />
          </View>

          {/* Title Placeholder */}
          <Animated.View
            style={{ opacity: pulseAnim }}
            className="w-3/4 h-5 rounded-md bg-muted/25 mb-2"
          />

          {/* Description Lines */}
          <Animated.View
            style={{ opacity: pulseAnim }}
            className="w-full h-3.5 rounded bg-muted/15 mb-1.5"
          />
          <Animated.View
            style={{ opacity: pulseAnim }}
            className="w-5/6 h-3.5 rounded bg-muted/15 mb-4"
          />

          {/* Tags / Metadata Placeholders */}
          <View className="flex-row gap-2 mb-3">
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="w-20 h-6 rounded-lg bg-muted/15"
            />
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="w-16 h-6 rounded-lg bg-muted/15"
            />
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="w-20 h-6 rounded-lg bg-muted/15"
            />
          </View>

          {/* Footer */}
          <View className="pt-3 border-t border-border/60 flex-row justify-between items-center">
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="w-28 h-3 rounded bg-muted/15"
            />
            <Animated.View
              style={{ opacity: pulseAnim }}
              className="w-20 h-3 rounded bg-muted/20"
            />
          </View>
        </View>
      ))}
    </View>
  );
}
