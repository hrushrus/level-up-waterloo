import { ScrollView, Text, View, TouchableOpacity, TextInput, Modal } from "react-native";
import { useState } from "react";
import { useFilters } from "@/lib/filter-context";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
}

export function FilterPanel({ visible, onClose }: FilterPanelProps) {
  const { filters, updateFilter, resetFilters, saveFilter } = useFilters();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");

  const handleSaveFilter = async () => {
    if (filterName.trim()) {
      await saveFilter(filterName);
      setFilterName("");
      setShowSaveDialog(false);
    }
  };

  const commitmentOptions = [
    { label: "Part-time", value: "part_time" },
    { label: "Full-time", value: "full_time" },
    { label: "Flexible", value: "flexible" },
  ];

  const locationOptions = [
    { label: "On-campus", value: "on_campus" },
    { label: "Remote", value: "remote" },
    { label: "In-person", value: "in_person" },
  ];

  const payOptions = [
    { label: "Paid", value: "paid" },
    { label: "Unpaid", value: "unpaid" },
    { label: "Stipend", value: "stipend" },
  ];

  const levelOptions = [
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
  ];

  const toggleOption = (array: string[], value: string) => {
    if (array.includes(value)) {
      return array.filter((item) => item !== value);
    } else {
      return [...array, value];
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black/50">
        <View className="flex-1 bg-background mt-auto rounded-t-3xl">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-2xl">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View className="p-4 gap-6">
              {/* Deadline Range */}
              <View className="gap-3">
                <Text className="text-lg font-semibold text-foreground">Deadline</Text>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">Min Days</Text>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor="#687076"
                      keyboardType="number-pad"
                      value={filters.deadlineRange.min?.toString() ?? ""}
                      onChangeText={(text) =>
                        updateFilter("deadlineRange", {
                          ...filters.deadlineRange,
                          min: text ? parseInt(text) : null,
                        })
                      }
                      className="bg-surface border border-border rounded-lg p-3 text-foreground"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-1">Max Days</Text>
                    <TextInput
                      placeholder="365"
                      placeholderTextColor="#687076"
                      keyboardType="number-pad"
                      value={filters.deadlineRange.max?.toString() ?? ""}
                      onChangeText={(text) =>
                        updateFilter("deadlineRange", {
                          ...filters.deadlineRange,
                          max: text ? parseInt(text) : null,
                        })
                      }
                      className="bg-surface border border-border rounded-lg p-3 text-foreground"
                    />
                  </View>
                </View>
              </View>

              {/* Commitment Level */}
              <View className="gap-3">
                <Text className="text-lg font-semibold text-foreground">Commitment Level</Text>
                <View className="gap-2">
                  {commitmentOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        updateFilter(
                          "commitmentLevels",
                          toggleOption(filters.commitmentLevels, option.value)
                        )
                      }
                      className={cn(
                        "flex-row items-center p-3 rounded-lg border",
                        filters.commitmentLevels.includes(option.value)
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border"
                      )}
                    >
                      <View
                        className={cn(
                          "w-5 h-5 rounded border-2 mr-3",
                          filters.commitmentLevels.includes(option.value)
                            ? "bg-primary border-primary"
                            : "border-border"
                        )}
                      >
                        {filters.commitmentLevels.includes(option.value) && (
                          <Text className="text-white text-xs text-center">✓</Text>
                        )}
                      </View>
                      <Text className="text-foreground font-medium">{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location */}
              <View className="gap-3">
                <Text className="text-lg font-semibold text-foreground">Location</Text>
                <View className="gap-2">
                  {locationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        updateFilter("locations", toggleOption(filters.locations, option.value))
                      }
                      className={cn(
                        "flex-row items-center p-3 rounded-lg border",
                        filters.locations.includes(option.value)
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border"
                      )}
                    >
                      <View
                        className={cn(
                          "w-5 h-5 rounded border-2 mr-3",
                          filters.locations.includes(option.value)
                            ? "bg-primary border-primary"
                            : "border-border"
                        )}
                      >
                        {filters.locations.includes(option.value) && (
                          <Text className="text-white text-xs text-center">✓</Text>
                        )}
                      </View>
                      <Text className="text-foreground font-medium">{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Pay Status */}
              <View className="gap-3">
                <Text className="text-lg font-semibold text-foreground">Pay Status</Text>
                <View className="gap-2">
                  {payOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        updateFilter("payStatus", toggleOption(filters.payStatus, option.value))
                      }
                      className={cn(
                        "flex-row items-center p-3 rounded-lg border",
                        filters.payStatus.includes(option.value)
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border"
                      )}
                    >
                      <View
                        className={cn(
                          "w-5 h-5 rounded border-2 mr-3",
                          filters.payStatus.includes(option.value)
                            ? "bg-primary border-primary"
                            : "border-border"
                        )}
                      >
                        {filters.payStatus.includes(option.value) && (
                          <Text className="text-white text-xs text-center">✓</Text>
                        )}
                      </View>
                      <Text className="text-foreground font-medium">{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Level */}
              <View className="gap-3">
                <Text className="text-lg font-semibold text-foreground">Experience Level</Text>
                <View className="gap-2">
                  {levelOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        updateFilter("levels", toggleOption(filters.levels, option.value))
                      }
                      className={cn(
                        "flex-row items-center p-3 rounded-lg border",
                        filters.levels.includes(option.value)
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border"
                      )}
                    >
                      <View
                        className={cn(
                          "w-5 h-5 rounded border-2 mr-3",
                          filters.levels.includes(option.value)
                            ? "bg-primary border-primary"
                            : "border-border"
                        )}
                      >
                        {filters.levels.includes(option.value) && (
                          <Text className="text-white text-xs text-center">✓</Text>
                        )}
                      </View>
                      <Text className="text-foreground font-medium">{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sort By */}
              <View className="gap-3">
                <Text className="text-lg font-semibold text-foreground">Sort By</Text>
                <View className="gap-2">
                  {[
                    { label: "Newest", value: "newest" },
                    { label: "Deadline", value: "deadline" },
                    { label: "Relevance", value: "relevance" },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => updateFilter("sortBy", option.value as any)}
                      className={cn(
                        "flex-row items-center p-3 rounded-lg border",
                        filters.sortBy === option.value
                          ? "bg-primary/10 border-primary"
                          : "bg-surface border-border"
                      )}
                    >
                      <View
                        className={cn(
                          "w-5 h-5 rounded-full border-2 mr-3",
                          filters.sortBy === option.value
                            ? "bg-primary border-primary"
                            : "border-border"
                        )}
                      >
                        {filters.sortBy === option.value && (
                          <View className="w-2 h-2 bg-white rounded-full m-auto mt-0.5 ml-0.5" />
                        )}
                      </View>
                      <Text className="text-foreground font-medium">{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View className="border-t border-border p-4 gap-3 flex-row">
            <TouchableOpacity
              onPress={resetFilters}
              className="flex-1 bg-surface border border-border px-4 py-3 rounded-lg items-center"
            >
              <Text className="text-foreground font-semibold">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSaveDialog(true)}
              className="flex-1 bg-primary/20 border border-primary px-4 py-3 rounded-lg items-center"
            >
              <Text className="text-primary font-semibold">Save Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-primary px-4 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Save Filter Dialog */}
      <Modal visible={showSaveDialog} animationType="fade" transparent={true}>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-background rounded-2xl p-6 w-full max-w-sm gap-4">
            <Text className="text-xl font-bold text-foreground">Save Filter</Text>
            <TextInput
              placeholder="Filter name (e.g., 'Summer Internships')"
              placeholderTextColor="#687076"
              value={filterName}
              onChangeText={setFilterName}
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowSaveDialog(false)}
                className="flex-1 bg-surface border border-border px-4 py-3 rounded-lg items-center"
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveFilter}
                className="flex-1 bg-primary px-4 py-3 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
