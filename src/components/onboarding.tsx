import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { Essence } from "@/components/essence";
import { PressScale } from "@/components/press-scale";
import { Quiz } from "@/components/quiz";
import { pickQuiz } from "@/content/quiz-questions";
import { SELF_QUESTIONS, TOPICS } from "@/content/self-questions";
import { type FoodArea, type FoodProfile, MAX_ANSWER_LENGTH } from "@/shared/offer";

// The quiz and the questions about the person. It runs in two ways:
//
// "first": the introduction before the day map. Why habits (statement) →
//   a guess that surprises (guess) → the person chooses what they want to
//   change (topic) → one question about themselves (you) → the hand-over to
//   the first food moment (bridge).
//
// "again": opened from the day map whenever the person likes. It starts at
//   the quiz, and it can end right there: it may be just for fun. Telling
//   Buddy more is an offer, and it never leads into a new plan by itself.
//
// Knowing a fact does not change a habit, so the facts are only the way in.
// What carries a change is the person's own reason: that is why they choose
// the topic themselves and can answer in their own words.

type Props = {
  mode: "first" | "again";
  seenQuizIds: string[];
  onQuizSeen: (id: string) => void;
  onFinish: (about: FoodProfile) => void; // the person told Buddy something
  onClose: () => void; // skipped, or done without telling more
};

type Step = "statement" | "guess" | "topic" | "you" | "bridge" | "done";

const FLOW: Record<Props["mode"], Step[]> = {
  first: ["statement", "guess", "topic", "you", "bridge"],
  again: ["guess", "topic", "you", "done"],
};

export function Onboarding({ mode, seenQuizIds, onQuizSeen, onFinish, onClose }: Props) {
  const steps = FLOW[mode];
  const [step, setStep] = useState<Step>(steps[0]);
  const position = steps.indexOf(step);

  // One question the person has not seen yet, picked once when this opens.
  const [quiz] = useState(() => pickQuiz(seenQuizIds));
  const [guess, setGuess] = useState<string | number | null>(null);

  const [area, setArea] = useState<FoodArea | null>(null);
  // The answer about themselves: an option they tapped, or their own words.
  const [picked, setPicked] = useState<string | null>(null);
  const [ownWords, setOwnWords] = useState("");
  const answer = ownWords.trim() !== "" ? ownWords.trim() : picked;

  function makeGuess(value: string | number) {
    setGuess(value);
    onQuizSeen(quiz.id);
  }

  function chooseArea(next: FoodArea) {
    // A new topic has a new question, so the old answer no longer belongs.
    setArea(next);
    setPicked(null);
    setOwnWords("");
    setStep("you");
  }

  function finish() {
    // The last step can only be reached after choosing a topic.
    if (area === null) return;
    if (area === "not_sure" || answer === null) {
      onFinish({ area, answers: [] });
      return;
    }
    onFinish({ area, answers: [{ question: SELF_QUESTIONS[area].question, answer }] });
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.top}>
        <View style={styles.dots} accessible accessibilityLabel={`Step ${position + 1} of ${steps.length}`}>
          {steps.map((each) => (
            <View key={each} style={[styles.dot, each === step && styles.dotActive]} />
          ))}
        </View>
        <PressScale style={styles.textButton} onPress={onClose} accessibilityRole="button">
          <Text style={styles.link}>{mode === "first" ? "Skip intro" : "Close"}</Text>
        </PressScale>
      </View>

      {/* key={step}: a new step is a new element, so it slides in. */}
      <Animated.View key={step} entering={FadeInRight.duration(250)} style={styles.step}>
        {step === "statement" && (
          <>
            <Essence mood="idle" />
            <Text style={styles.big}>About 40% of what we do each day is habit, not a decision.</Text>
            <Text style={styles.body}>
              That includes how we shop, cook and eat. Buddy helps you change one small food habit
              at a time: less waste, a smaller footprint, and often money saved.
            </Text>
            <Text style={styles.source}>Source: Wood et al. 2002, cited in Linder et al. 2021</Text>
            <Primary label="Start" onPress={() => setStep("guess")} />
          </>
        )}

        {step === "guess" && (
          <>
            <Text style={styles.eyebrow}>Take a guess</Text>
            <Quiz question={quiz} guess={guess} onGuess={makeGuess} />
            {guess !== null && mode === "first" && <Primary label="Next" onPress={() => setStep("topic")} />}
            {guess !== null && mode === "again" && (
              <>
                {/* Two equal ways on: the quiz alone is a complete visit. */}
                <Primary label="Tell Buddy more about me" onPress={() => setStep("topic")} />
                <PressScale style={styles.textButton} onPress={onClose} accessibilityRole="button">
                  <Text style={styles.link}>That's enough for today</Text>
                </PressScale>
              </>
            )}
          </>
        )}

        {step === "topic" && (
          <>
            <Text style={styles.eyebrow}>Your choice</Text>
            <Text style={styles.question}>What would you like to change around food?</Text>
            <Text style={styles.source}>Pick the one that matters most to you right now.</Text>
            {TOPICS.map((topic) => (
              <PressScale
                key={topic.area}
                style={[styles.topic, topic.area === area && styles.topicSelected]}
                onPress={() => chooseArea(topic.area)}
                accessibilityRole="button"
                accessibilityLabel={topic.label}
              >
                <Text style={styles.topicIcon}>{topic.icon}</Text>
                <Text style={styles.topicLabel}>{topic.label}</Text>
              </PressScale>
            ))}
          </>
        )}

        {step === "you" && area === "not_sure" && (
          <>
            <Text style={styles.big}>That is fine.</Text>
            <Text style={styles.body}>
              Buddy starts with throwing less away, which saves food and money. You will see what
              fits you as you go.
            </Text>
            <Primary label="Next" onPress={() => setStep(steps[position + 1])} />
          </>
        )}

        {step === "you" && area !== null && area !== "not_sure" && (
          <>
            <Text style={styles.eyebrow}>About you</Text>
            <Text style={styles.question}>{SELF_QUESTIONS[area].question}</Text>
            <View style={styles.chips}>
              {SELF_QUESTIONS[area].options.map((option) => {
                const selected = ownWords.trim() === "" && option === picked;
                return (
                  <PressScale
                    key={option}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => {
                      setPicked(option);
                      setOwnWords("");
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{option}</Text>
                  </PressScale>
                );
              })}
            </View>
            {/* The options never fit everyone, so the person can always say it their way. */}
            <TextInput
              style={styles.input}
              value={ownWords}
              onChangeText={setOwnWords}
              placeholder={SELF_QUESTIONS[area].options.length > 0 ? "Or in your own words" : "In your own words"}
              placeholderTextColor="#7F8986"
              maxLength={MAX_ANSWER_LENGTH}
              accessibilityLabel="Your own answer"
            />
            <Text style={styles.source}>Buddy uses your answer to suggest changes that fit you.</Text>
            {answer !== null && <Primary label="Next" onPress={() => setStep(steps[position + 1])} />}
          </>
        )}

        {step === "bridge" && (
          <>
            <Text style={styles.big}>A change sticks when it hangs on something you already do.</Text>
            <Text style={styles.body}>
              Show Buddy one moment when food happens in your week, like lunch or shopping. Buddy
              answers with one small idea for that moment.
            </Text>
            <Primary label="Add my first moment" onPress={finish} />
          </>
        )}

        {step === "done" && (
          <>
            <Text style={styles.big}>Buddy knows a bit more about you now.</Text>
            <Text style={styles.body}>
              Its next ideas will take this into account. Nothing else changes unless you want it to.
            </Text>
            <Primary label="Back to my food day" onPress={finish} />
          </>
        )}

        {position > 0 && (
          <PressScale
            style={styles.textButton}
            onPress={() => setStep(steps[position - 1])}
            accessibilityRole="button"
          >
            <Text style={styles.link}>{step === "you" ? "Choose another topic" : "Back"}</Text>
          </PressScale>
        )}
      </Animated.View>
    </ScrollView>
  );
}

function Primary({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressScale style={styles.primary} onPress={onPress} accessibilityRole="button">
      <Text style={styles.primaryLabel}>{label}</Text>
    </PressScale>
  );
}

const GREEN = "#1F6F5C";
const PALE_GREEN = "#E7F2EE";
const LINE = "#C9CFCC";

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 24 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LINE },
  dotActive: { width: 24, backgroundColor: GREEN },
  // 48 is the smallest height Android recommends for something you tap.
  textButton: { minHeight: 48, justifyContent: "center", alignSelf: "flex-start" },
  link: { color: GREEN, fontSize: 16, fontWeight: "600" },

  step: { flexGrow: 1, justifyContent: "center", gap: 16 },
  eyebrow: { fontSize: 14, fontWeight: "600", color: GREEN, textTransform: "uppercase", letterSpacing: 0.5 },
  big: { fontSize: 28, lineHeight: 34, fontWeight: "600" },
  question: { fontSize: 24, lineHeight: 30, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24 },
  source: { fontSize: 13, lineHeight: 18, opacity: 0.6 },

  topic: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF" },
  topicSelected: { borderColor: GREEN, backgroundColor: PALE_GREEN },
  topicIcon: { fontSize: 22 },
  topicLabel: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 48, minWidth: 64, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF" },
  chipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  chipLabel: { fontSize: 16, fontWeight: "600" },
  chipLabelSelected: { color: "#FFFFFF" },
  input: { minHeight: 48, borderWidth: 1, borderColor: LINE, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: "#FFFFFF" },

  primary: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  primaryLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
