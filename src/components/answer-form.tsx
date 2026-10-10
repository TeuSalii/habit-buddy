import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { PressScale } from "@/components/press-scale";
import type { SelfQuestion } from "@/content/self-questions";
import { MAX_ANSWER_LENGTH } from "@/shared/offer";

// One question about the person: the options to tap, a field for their own
// words, and a button once there is an answer. Used where a question is
// asked for the first time (the quiz) and where an answer is corrected
// ("What Buddy knows").
//
// The form keeps its own state and starts from `earlier`. Whoever shows it
// gives it key={question.question}, so a new question gets a new, empty form.

type Props = {
  question: SelfQuestion;
  earlier: string | null; // the answer given before, or null
  submitLabel: string;
  onSubmit: (answer: string) => void;
};

export function AnswerForm({ question, earlier, submitLabel, onSubmit }: Props) {
  // An earlier answer is either one of the options or the person's own words.
  const wasOption = earlier !== null && question.options.includes(earlier);
  const [picked, setPicked] = useState<string | null>(wasOption ? earlier : null);
  const [ownWords, setOwnWords] = useState(wasOption ? "" : (earlier ?? ""));
  // Own words win over a tapped option: they say more.
  const answer = ownWords.trim() !== "" ? ownWords.trim() : picked;

  return (
    <>
      <Text style={styles.question}>{question.question}</Text>
      <View style={styles.chips}>
        {question.options.map((option) => {
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
        placeholder={question.options.length > 0 ? "Or in your own words" : "In your own words"}
        placeholderTextColor="#7F8986"
        maxLength={MAX_ANSWER_LENGTH}
        accessibilityLabel="Your own answer"
      />
      <Text style={styles.note}>Buddy uses your answer to suggest changes that fit you.</Text>
      {answer !== null && (
        <PressScale style={styles.submit} onPress={() => onSubmit(answer)} accessibilityRole="button">
          <Text style={styles.submitLabel}>{submitLabel}</Text>
        </PressScale>
      )}
    </>
  );
}

const GREEN = "#1F6F5C";
const LINE = "#C9CFCC";

const styles = StyleSheet.create({
  question: { fontSize: 24, lineHeight: 30, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  // 48 is the smallest height Android recommends for something you tap.
  chip: { minHeight: 48, minWidth: 64, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF" },
  chipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  chipLabel: { fontSize: 16, fontWeight: "600" },
  chipLabelSelected: { color: "#FFFFFF" },
  input: { minHeight: 48, borderWidth: 1, borderColor: LINE, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: "#FFFFFF" },
  note: { fontSize: 13, lineHeight: 18, opacity: 0.6 },
  submit: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  submitLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
