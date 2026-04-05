import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, TextInput, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { SECURITY_QUESTIONS } from "@/constants/security-questions";

interface SelectedQuestion {
  questionId: number;
  question: string;
  answer: string;
}

export default function SecurityQuestionsScreen() {
  const colors = useColors();

  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState<"select" | "answers">("select");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Get available questions (excluding already selected ones)
  const availableQuestions = SECURITY_QUESTIONS.filter(
    (q, idx) => !selectedQuestions.some((sq) => sq.questionId === idx)
  );

  const handleSelectQuestion = (questionId: number) => {
    if (selectedQuestions.length < 3) {
      setSelectedQuestions([
        ...selectedQuestions,
        {
          questionId,
          question: SECURITY_QUESTIONS[questionId],
          answer: "",
        },
      ]);
    }
  };

  const handleRemoveQuestion = (questionId: number) => {
    setSelectedQuestions(selectedQuestions.filter((q) => q.questionId !== questionId));
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setSelectedQuestions(
      selectedQuestions.map((q) => (q.questionId === questionId ? { ...q, answer } : q))
    );
  };

  const handleSaveSecurityQuestions = async () => {
    // Validate all answers are filled
    if (selectedQuestions.some((q) => !q.answer.trim())) {
      setError("Please answer all security questions");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch("http://127.0.0.1:3000/api/trpc/auth.setSecurityQuestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          json: { questions: selectedQuestions },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to save security questions");
      }

      setSuccess(true);
      setTimeout(() => {
        // Navigate back or show confirmation
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save security questions";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center px-6">
        <View className="items-center gap-4">
          <View className="w-16 h-16 rounded-full bg-success items-center justify-center">
            <Text className="text-3xl">✓</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Security Questions Set!</Text>
          <Text className="text-base text-muted text-center">
            Your security questions have been saved. You can use them to recover your account if needed.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="flex-1">
        <View className="flex-1 px-6 py-8">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground mb-2">Security Questions</Text>
            <Text className="text-base text-muted">
              Set up 3 security questions to help recover your account if you forget your password.
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-error/10 border border-error rounded-lg p-4 mb-6">
              <Text className="text-error font-semibold">{error}</Text>
            </View>
          )}

          {/* Step Indicator */}
          <View className="flex-row gap-2 mb-8">
            <View
              className={`flex-1 h-2 rounded-full ${currentStep === "select" ? "bg-primary" : "bg-surface border border-border"}`}
            />
            <View
              className={`flex-1 h-2 rounded-full ${currentStep === "answers" ? "bg-primary" : "bg-surface border border-border"}`}
            />
          </View>

          {currentStep === "select" ? (
            <>
              {/* Select Questions Step */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-muted mb-3">
                  Selected Questions: {selectedQuestions.length}/3
                </Text>

                {/* Selected Questions */}
                {selectedQuestions.length > 0 && (
                  <View className="mb-6 gap-3">
                    {selectedQuestions.map((q) => (
                      <View key={q.questionId} className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between">
                        <Text className="flex-1 text-foreground text-sm">{q.question}</Text>
                        <TouchableOpacity onPress={() => handleRemoveQuestion(q.questionId)}>
                          <Text className="text-error font-bold text-lg">✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Available Questions */}
                {selectedQuestions.length < 3 && (
                  <View>
                    <Text className="text-xs font-semibold text-muted mb-2">Available Questions</Text>
                    <FlatList
                      data={availableQuestions}
                      keyExtractor={(item, idx) => idx.toString()}
                      scrollEnabled={false}
                      renderItem={({ item, index }) => {
                        const questionId = SECURITY_QUESTIONS.indexOf(item);
                        return (
                          <TouchableOpacity
                            className="bg-surface border border-border rounded-lg p-4 mb-2"
                            onPress={() => handleSelectQuestion(questionId)}
                          >
                            <Text className="text-foreground text-sm">{item}</Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Next Button */}
              <TouchableOpacity
                className="w-full bg-primary rounded-lg py-3 items-center"
                onPress={() => setCurrentStep("answers")}
                disabled={selectedQuestions.length !== 3}
                style={selectedQuestions.length !== 3 ? { opacity: 0.6 } : {}}
              >
                <Text className="text-white font-semibold text-base">Next: Answer Questions</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Answer Questions Step */}
              <View className="mb-6 gap-6">
                {selectedQuestions.map((q) => (
                  <View key={q.questionId}>
                    <Text className="text-sm font-semibold text-foreground mb-2">{q.question}</Text>
                    <TextInput
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholder="Your answer"
                      placeholderTextColor={colors.muted}
                      value={q.answer}
                      onChangeText={(text) => handleAnswerChange(q.questionId, text)}
                      editable={!isLoading}
                      autoCapitalize="none"
                    />
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                className="w-full bg-primary rounded-lg py-3 items-center mb-4"
                onPress={handleSaveSecurityQuestions}
                disabled={isLoading}
                style={isLoading ? { opacity: 0.6 } : {}}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Save Security Questions</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full bg-surface border border-border rounded-lg py-3 items-center"
                onPress={() => setCurrentStep("select")}
                disabled={isLoading}
              >
                <Text className="text-foreground font-semibold text-base">Back</Text>
              </TouchableOpacity>

              {/* Info Box */}
              <View className="mt-8 bg-surface border border-border rounded-lg p-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Tips:</Text>
                <Text className="text-sm text-muted leading-relaxed">
                  • Use answers only you would know{"\n"}
                  • Answers are case-insensitive{"\n"}
                  • Keep your answers consistent{"\n"}
                  • Don't share your answers with anyone
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
