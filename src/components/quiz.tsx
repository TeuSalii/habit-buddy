import { StyleSheet, Text, View } from "react-native";

import { Bars } from "@/components/bars";
import { PressScale } from "@/components/press-scale";
import type { ChoiceQuestion, NumberQuestion, QuizQuestion } from "@/content/quiz-questions";

// One quiz question: first the options, then, once the person has guessed,
// the answer with its source. A number is revealed as two bars (the guess
// next to reality); a choice is revealed by marking the right statement.

type Props = {
  question: QuizQuestion;
  guess: string | number | null; // null: not guessed yet
  onGuess: (guess: string | number) => void;
};

export function Quiz({ question, guess, onGuess }: Props) {
  return (
    <>
      <Text style={styles.question}>{question.question}</Text>
      {question.kind === "number" ? (
        <NumberAnswer question={question} guess={typeof guess === "number" ? guess : null} onGuess={onGuess} />
      ) : (
        <ChoiceAnswer question={question} guess={typeof guess === "string" ? guess : null} onGuess={onGuess} />
      )}
      {guess !== null && (
        <>
          <Text style={styles.body}>{question.reveal}</Text>
          <Text style={styles.source}>Source: {question.source}</Text>
        </>
      )}
    </>
  );
}

type NumberProps = { question: NumberQuestion; guess: number | null; onGuess: (guess: number) => void };

function NumberAnswer({ question, guess, onGuess }: NumberProps) {
  const show = (value: number) => `${question.prefix}${value}${question.suffix}`;

  if (guess === null) {
    return question.options.map((option) => (
      <PressScale key={option} style={styles.option} onPress={() => onGuess(option)} accessibilityRole="button">
        <Text style={styles.optionLabel}>{show(option)}</Text>
      </PressScale>
    ));
  }
  return (
    <>
      {/* The guess next to the real number: the gap is the message. */}
      <Bars
        bars={[
          { label: "Your guess", value: guess, text: show(guess) },
          { label: "In reality", value: question.answer, text: `about ${show(question.answer)}`, strong: true },
        ]}
      />
      <Text style={styles.verdict}>
        {guess === question.answer ? "You were right." : guess < question.answer ? "More than you thought." : "Less than you thought."}
      </Text>
    </>
  );
}

type ChoiceProps = { question: ChoiceQuestion; guess: string | null; onGuess: (guess: string) => void };

function ChoiceAnswer({ question, guess, onGuess }: ChoiceProps) {
  if (guess === null) {
    return question.options.map((option) => (
      <PressScale key={option} style={styles.option} onPress={() => onGuess(option)} accessibilityRole="button">
        <Text style={styles.optionLabel}>{option}</Text>
      </PressScale>
    ));
  }
  return (
    <>
      {question.options.map((option) => {
        const right = option === question.answer;
        const theirs = option === guess;
        return (
          // Marked with words, not only with color, so it reads without seeing green.
          <View key={option} style={[styles.option, right && styles.optionRight]}>
            <Text style={styles.optionLabel}>{option}</Text>
            {(right || theirs) && (
              <Text style={styles.mark}>{right ? (theirs ? "Your guess, and right" : "The answer") : "Your guess"}</Text>
            )}
          </View>
        );
      })}
      <Text style={styles.verdict}>{guess === question.answer ? "You were right." : "Not quite."}</Text>
    </>
  );
}

const GREEN = "#1F6F5C";
const PALE_GREEN = "#E7F2EE";
const LINE = "#C9CFCC";

const styles = StyleSheet.create({
  question: { fontSize: 24, lineHeight: 30, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24 },
  source: { fontSize: 13, lineHeight: 18, opacity: 0.6 },
  verdict: { fontSize: 28, lineHeight: 34, fontWeight: "600" },
  option: { minHeight: 64, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF" },
  optionRight: { borderColor: GREEN, borderWidth: 2, backgroundColor: PALE_GREEN },
  optionLabel: { fontSize: 20, fontWeight: "600" },
  mark: { fontSize: 13, opacity: 0.7, marginTop: 2 },
});
