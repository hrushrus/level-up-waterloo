import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

interface SecurityQuestion {
  questionId: number;
  question: string;
}

export default function VerifySecurityQuestionsScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const colors = useColors();

  const [email, setEmail] = useState(emailParam || "");
  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  // Load security questions when email is provided
  useEffect(() => {
    if (email && !questionsLoaded) {
      loadSecurityQuestions();
    }
  }, [email, questionsLoaded]);

  const loadSecurityQuestions = async () => {
    try {
      setError("");
      setIsLoadingQuestions(true);

      const response = await fetch(
        `http://127.0.0.1:3000/api/trpc/auth.getSecurityQuestions?input=${encodeURIComponent(JSON.stringify({ email }))}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to load security questions");
      }

      const data = await response.json();
      setQuestions(data.result?.data?.questions || []);
      setQuestionsLoaded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load security questions";
      setError(message);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleVerify = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (questions.length === 0) {
      setError("Please load your security questions first");
      return;
    }

    // Check all answers are filled
    if (questions.some((q) => !answers[q.questionId]?.trim())) {
      setError("Please answer all security questions");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const verifyAnswers = questions.map((q) => ({
        questionId: q.questionId,
        answer: answers[q.questionId],
      }));

      const response = await fetch("http://127.0.0.1:3000/api/trpc/auth.verifySecurityQuestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          json: { email, answers: verifyAnswers },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Security questions verification failed");
      }

      setSuccess(true);
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
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
          <Text className="text-2xl font-bold text-foreground">Verified!</Text>
          <Text className="text-base text-muted text-center">
            Your security questions have been verified. You are now logged in.
          </Text>
          <Text className="text-sm text-muted text-center mt-4">
            Redirecting to home in 2 seconds...
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
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <Text className="text-primary font-semibold">← Back</Text>
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground mb-2">Verify Identity</Text>
            <Text className="text-base text-muted">
              Answer your security questions to recover your account.
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-error/10 border border-error rounded-lg p-4 mb-6">
              <Text className="text-error font-semibold">{error}</Text>
            </View>
          )}

          {/* Email Input */}
          {!questionsLoaded ? (
            <>
              <View className="mb-6">
                <Text className="text-sm font-semibold text-muted mb-2">Email Address</Text>
                <TextInput
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoadingQuestions}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity
                className="w-full bg-primary rounded-lg py-3 items-center"
                onPress={loadSecurityQuestions}
                disabled={isLoadingQuestions || !email.trim()}
                style={isLoadingQuestions || !email.trim() ? { opacity: 0.6 } : {}}
              >
                {isLoadingQuestions ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Load Security Questions</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Security Questions */}
              <View className="mb-8 gap-6">
                {questions.map((q) => (
                  <View key={q.questionId}>
                    <Text className="text-sm font-semibold text-foreground mb-2">{q.question}</Text>
                    <TextInput
                      className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                      placeholder="Your answer"
                      placeholderTextColor={colors.muted}
                      value={answers[q.questionId] || ""}
                      onChangeText={(text) =>
                        setAnswers({ ...answers, [q.questionId]: text })
                      }
                      editable={!isLoading}
                      autoCapitalize="none"
                    />
                  </View>
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                className="w-full bg-primary rounded-lg py-3 items-center mb-4"
                onPress={handleVerify}
                disabled={isLoading || questions.some((q) => !answers[q.questionId]?.trim())}
                style={isLoading || questions.some((q) => !answers[q.questionId]?.trim()) ? { opacity: 0.6 } : {}}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Verify & Login</Text>
                )}
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity
                className="w-full bg-surface border border-border rounded-lg py-3 items-center"
                onPress={() => {
                  setQuestionsLoaded(false);
                  setAnswers({});
                  setError("");
                }}
              >
                <Text className="text-foreground font-semibold text-base">Use Different Email</Text>
              </TouchableOpacity>

              {/* Info Box */}
              <View className="mt-8 bg-surface border border-border rounded-lg p-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Remember:</Text>
                <Text className="text-sm text-muted leading-relaxed">
                  • Answers are case-insensitive{"\n"}
                  • Extra spaces will be trimmed{"\n"}
                  • All 3 questions must be answered correctly
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
