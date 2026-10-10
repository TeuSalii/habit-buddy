import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { MAX_OPEN_CHANGES } from "@/client/ask-buddy";
import { AnswerForm } from "@/components/answer-form";
import { Essence } from "@/components/essence";
import { KIND_ICON, KIND_LABEL, PLACE_LABEL, describeDays } from "@/components/food-moment-labels";
import { PressScale } from "@/components/press-scale";
import { Quiz } from "@/components/quiz";
import { ideaFrom, pickQuiz } from "@/content/quiz-questions";
import { SELF_QUESTIONS, type SelfQuestion, TOPICS } from "@/content/self-questions";
import type { FoodMoment } from "@/shared/food-moment";
import type { FoodArea, FoodProfile } from "@/shared/offer";

// The quiz and the questions about the person. It runs in two ways:
//
// "first": the introduction before the day map. Why habits (statement) →
//   a guess that surprises (guess) → the person chooses what they want to
//   change (topic) → one question about themselves (you) → the hand-over to
//   the first food moment (bridge).
//
// "again": opened from the day map whenever the person likes. It starts at
//   the quiz, and it can end right there: it may be just for fun. From there
//   two ways lead on, and both end at the same step (use), where Buddy does
//   something with it: the person picks a moment and gets one small idea.
//   - The quiz question itself, if a habit can be built on it.
//   - Telling Buddy more: a topic, and one more question about themselves.
//
// Knowing a fact does not change a habit, so the facts are only the way in.
// What carries a change is the person's own reason: that is why they choose
// the topic themselves and can answer in their own words.

type Props = {
  mode: "first" | "again";
  seenQuizIds: string[];
  onQuizSeen: (id: string) => void;
  about: FoodProfile | null; // what Buddy knows so far
  // "again" only: the moments where Buddy could suggest something now, and
  // how many changes are open already.
  freeMoments: FoodMoment[];
  openChanges: number;
  onTell: (told: FoodProfile) => void; // the person told Buddy something
  // The person wants an idea: at this moment or at a new one. `focus` is the
  // theme of the quiz question, or null.
  onIdea: (where: FoodMoment | "new", focus: string | null) => void;
  onClose: () => void; // skipped, or enough for today
};

type Step = "statement" | "guess" | "topic" | "you" | "bridge" | "use";

const FLOW: Record<Props["mode"], Step[]> = {
  first: ["statement", "guess", "topic", "you", "bridge"],
  again: ["guess", "topic", "you", "use"],
};

export function Onboarding(props: Props) {
  const { mode, seenQuizIds, onQuizSeen, about, freeMoments, openChanges, onTell, onIdea, onClose } = props;
  const steps = FLOW[mode];
  // The steps taken so far. "Back" drops the last one, so it always returns
  // to where the person came from, also when a step was jumped over.
  const [trail, setTrail] = useState<Step[]>([steps[0]]);
  const step = trail[trail.length - 1];
  const position = steps.indexOf(step);
  const go = (next: Step) => setTrail([...trail, next]);

  // One question the person has not seen yet, picked once when this opens.
  const [quiz] = useState(() => pickQuiz(seenQuizIds));
  const [guess, setGuess] = useState<string | number | null>(null);
  // The theme of the quiz question, if Buddy can build a habit on it for
  // this person. Set as the focus when they ask for an idea from the quiz.
  const idea = ideaFrom(quiz, about);
  const [focus, setFocus] = useState<string | null>(null);

  const [area, setArea] = useState<FoodArea | null>(null);
  // The question being asked. null: the topic has no open question.
  const [asking, setAsking] = useState<SelfQuestion | null>(null);

  // What the person answered to this question earlier, or null.
  function known(question: SelfQuestion): string | null {
    return about?.answers.find((each) => each.question === question.question)?.answer ?? null;
  }

  function makeGuess(value: string | number) {
    setGuess(value);
    onQuizSeen(quiz.id);
  }

  function chooseArea(next: FoodArea) {
    setArea(next);
    // One question per visit: the first one without an answer.
    setAsking(next === "not_sure" ? null : (SELF_QUESTIONS[next].find((each) => known(each) === null) ?? null));
    go("you");
  }

  // Saves the topic and, if there is one, the new answer. Then the next
  // step: the first moment (introduction) or what Buddy does with it.
  function tell(chosen: FoodArea, answer: string | null) {
    const answers = asking !== null && answer !== null ? [{ question: asking.question, answer }] : [];
    onTell({ area: chosen, answers });
    setFocus(null);
    go(mode === "first" ? "bridge" : "use");
  }

  // "1 of 3 answered" next to a topic, so the person sees where there is more to tell.
  function progress(topic: FoodArea): string | null {
    if (topic === "not_sure") return null;
    const all = SELF_QUESTIONS[topic];
    const done = all.filter((each) => known(each) !== null).length;
    if (done === 0) return null;
    return done === all.length ? "Buddy knows this" : `${done} of ${all.length} answered`;
  }
  const everythingAnswered = TOPICS.every(
    (topic) => topic.area === "not_sure" || progress(topic.area) === "Buddy knows this",
  );

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

      {/* key: a new step (or a new question) is a new element, so it slides in. */}
      <Animated.View key={step + (asking?.question ?? "")} entering={FadeInRight.duration(250)} style={styles.step}>
        {step === "statement" && (
          <>
            <Essence mood="idle" />
            <Text style={styles.big}>About 40% of what we do each day is habit, not a decision.</Text>
            <Text style={styles.body}>
              That includes how we shop, cook and eat. Buddy helps you change one small food habit
              at a time: less waste, a smaller footprint, and often money saved.
            </Text>
            <Text style={styles.source}>Source: Wood et al. 2002, cited in Linder et al. 2021</Text>
            <Primary label="Start" onPress={() => go("guess")} />
          </>
        )}

        {step === "guess" && (
          <>
            <Text style={styles.eyebrow}>Take a guess</Text>
            <Quiz question={quiz} guess={guess} onGuess={makeGuess} />
            {guess !== null && mode === "first" && <Primary label="Next" onPress={() => go("topic")} />}
            {guess !== null && mode === "again" && (
              <>
                {/* Only when a habit can be built on this question. A fact
                    about a role model, for example, stays a fact. */}
                {idea !== null && (
                  <Primary
                    label="Turn this into a small idea"
                    onPress={() => {
                      setFocus(idea);
                      go("use");
                    }}
                  />
                )}
                {idea === null ? (
                  <Primary label="Tell Buddy more about me" onPress={() => go("topic")} />
                ) : (
                  <Secondary label="Tell Buddy more about me" onPress={() => go("topic")} />
                )}
                {/* The quiz alone is a complete visit. */}
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
            <Text style={styles.source}>
              {everythingAnswered
                ? "You have answered everything Buddy asks for now. Pick the topic Buddy should work on. You can change your answers there."
                : "Pick the one that matters most to you right now."}
            </Text>
            {TOPICS.map((topic) => (
              <PressScale
                key={topic.area}
                style={[styles.row, topic.area === area && styles.rowSelected]}
                onPress={() => chooseArea(topic.area)}
                accessibilityRole="button"
                accessibilityLabel={[topic.label, progress(topic.area)].filter(Boolean).join(", ")}
              >
                <Text style={styles.rowIcon}>{topic.icon}</Text>
                <Text style={styles.rowLabel}>{topic.label}</Text>
                <Text style={styles.rowNote}>{progress(topic.area)}</Text>
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
            <Primary label="Next" onPress={() => tell(area, null)} />
          </>
        )}

        {step === "you" && area !== null && area !== "not_sure" && asking !== null && (
          <>
            <Text style={styles.eyebrow}>About you</Text>
            {/* The form starts with the earlier answer, if there is one. */}
            <AnswerForm
              question={asking}
              earlier={known(asking)}
              submitLabel="Next"
              onSubmit={(answer) => tell(area, answer)}
            />
          </>
        )}

        {/* Every question of this topic has an answer: show what Buddy knows.
            Choosing the topic still counts: Buddy works on it from now on. */}
        {step === "you" && area !== null && area !== "not_sure" && asking === null && (
          <>
            <Text style={styles.eyebrow}>About you</Text>
            <Text style={styles.question}>Buddy already knows this.</Text>
            <Text style={styles.source}>Tap an answer to change it.</Text>
            {SELF_QUESTIONS[area].map((each) => (
              <PressScale
                key={each.question}
                style={styles.row}
                onPress={() => setAsking(each)}
                accessibilityRole="button"
                accessibilityLabel={`${each.question} ${known(each)}. Change`}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowDetail}>{each.question}</Text>
                  <Text style={styles.rowLabel}>{known(each)}</Text>
                </View>
              </PressScale>
            ))}
            <Primary label="Next" onPress={() => tell(area, null)} />
          </>
        )}

        {step === "bridge" && (
          <>
            <Text style={styles.big}>A change sticks when it hangs on something you already do.</Text>
            <Text style={styles.body}>
              Show Buddy one moment when food happens in your week, like lunch or shopping. Buddy
              answers with one small idea for that moment.
            </Text>
            <Primary label="Add my first moment" onPress={() => onIdea("new", null)} />
          </>
        )}

        {/* What Buddy does with a quiz question or an answer: one small idea
            at a moment the person picks. Asking is their choice, never a must. */}
        {step === "use" && (
          <>
            <Text style={styles.eyebrow}>Buddy's turn</Text>
            <Text style={styles.question}>
              {focus === null ? "Buddy can use this right away." : "Where could this fit in your week?"}
            </Text>
            <Text style={styles.body}>
              {focus === null
                ? "Pick a moment. Buddy suggests one small thing there that fits what you told it."
                : `Pick a moment. Buddy suggests one small thing there about ${focus}.`}
            </Text>
            {openChanges >= MAX_OPEN_CHANGES && (
              <Text style={styles.source}>
                You already have {openChanges} changes going. Whether one more fits is your call.
              </Text>
            )}
            {freeMoments.map((moment) => (
              <PressScale
                key={moment.id}
                style={styles.row}
                onPress={() => onIdea(moment, focus)}
                accessibilityRole="button"
                accessibilityLabel={`${KIND_LABEL[moment.kind]}, ${PLACE_LABEL[moment.place]}, ${describeDays(moment.days)}`}
              >
                <Text style={styles.rowIcon}>{KIND_ICON[moment.kind]}</Text>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{KIND_LABEL[moment.kind]}</Text>
                  <Text style={styles.rowDetail}>
                    {PLACE_LABEL[moment.place]} · {describeDays(moment.days)}
                  </Text>
                </View>
              </PressScale>
            ))}
            <PressScale
              style={styles.row}
              onPress={() => onIdea("new", focus)}
              accessibilityRole="button"
              accessibilityLabel="A new moment"
            >
              <Text style={styles.rowIcon}>➕</Text>
              <Text style={styles.rowLabel}>A new moment</Text>
            </PressScale>
            <PressScale style={styles.textButton} onPress={onClose} accessibilityRole="button">
              <Text style={styles.link}>Not now</Text>
            </PressScale>
            {focus === null && (
              <Text style={styles.source}>Either way, Buddy keeps what you told it for its next ideas.</Text>
            )}
          </>
        )}

        {trail.length > 1 && (
          <PressScale
            style={styles.textButton}
            onPress={() => setTrail(trail.slice(0, -1))}
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

function Secondary({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressScale style={styles.secondary} onPress={onPress} accessibilityRole="button">
      <Text style={styles.secondaryLabel}>{label}</Text>
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

  // A row to tap: a topic, an answer Buddy knows, or a moment.
  row: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF" },
  rowSelected: { borderColor: GREEN, backgroundColor: PALE_GREEN },
  rowIcon: { fontSize: 22 },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
  rowDetail: { fontSize: 14, lineHeight: 20, opacity: 0.6 },
  rowNote: { fontSize: 13, color: GREEN, fontWeight: "600", marginLeft: "auto" },

  primary: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  primaryLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  secondary: { borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: GREEN },
  secondaryLabel: { color: GREEN, fontSize: 16, fontWeight: "600" },
});
