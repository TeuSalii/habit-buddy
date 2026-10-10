import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

import { AnswerForm } from "@/components/answer-form";
import { PressScale } from "@/components/press-scale";
import { OWN_TOPIC, type SelfQuestion, TOPICS, questionFor } from "@/content/self-questions";
import type { FoodArea, FoodProfile } from "@/shared/offer";

// Everything Buddy knows about the person, on one screen, and the way to
// correct it. What Buddy knows is only what the person told it, but people
// mis-tap, and lives change. The person has the last word: every line can
// be changed or taken back.

type Props = {
  about: FoodProfile;
  onTell: (told: FoodProfile) => void; // a changed answer or topic
  onForget: (question: string) => void; // an answer taken back
  onClose: () => void;
};

// What the screen is showing: the list, the topics to choose from, or one
// question. `area` is the topic the answer is saved with.
type Showing = { kind: "list" } | { kind: "topics" } | { kind: "answer"; question: SelfQuestion; area: FoodArea };

export function BuddyKnows({ about, onTell, onForget, onClose }: Props) {
  const [showing, setShowing] = useState<Showing>({ kind: "list" });
  const list = () => setShowing({ kind: "list" });
  const topic = TOPICS.find((each) => each.area === about.area);

  function chooseTopic(area: FoodArea) {
    // "Something else" needs the person's words to mean anything.
    if (area === "other") {
      setShowing({ kind: "answer", question: OWN_TOPIC, area });
      return;
    }
    onTell({ area, answers: [] });
    list();
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.top}>
        <PressScale style={styles.textButton} onPress={onClose} accessibilityRole="button">
          <Text style={styles.link}>Close</Text>
        </PressScale>
      </View>

      {/* key: each view is a new element, so it slides in. */}
      <Animated.View
        key={showing.kind === "answer" ? showing.question.question : showing.kind}
        entering={FadeInRight.duration(250)}
        style={styles.view}
      >
        {showing.kind === "list" && (
          <>
            <Text style={styles.title}>What Buddy knows about you</Text>
            <Text style={styles.note}>Only what you told it. Tap a line that is not right to change it.</Text>

            <Text style={styles.section}>Buddy works on</Text>
            <PressScale
              style={styles.row}
              onPress={() => setShowing({ kind: "topics" })}
              accessibilityRole="button"
              accessibilityLabel={`Topic: ${topic?.label}. Change`}
            >
              <Text style={styles.rowIcon}>{topic?.icon}</Text>
              <Text style={styles.rowLabel}>{topic?.label}</Text>
            </PressScale>

            <Text style={styles.section}>Your answers</Text>
            {about.answers.length === 0 && (
              <Text style={styles.body}>None yet. A quiz is the way to tell Buddy more.</Text>
            )}
            {about.answers.map((each) => (
              <PressScale
                key={each.question}
                style={styles.row}
                onPress={() =>
                  setShowing({ kind: "answer", question: questionFor(each.question), area: about.area })
                }
                accessibilityRole="button"
                accessibilityLabel={`${each.question} ${each.answer}. Change`}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowDetail}>{each.question}</Text>
                  <Text style={styles.rowLabel}>{each.answer}</Text>
                </View>
              </PressScale>
            ))}
            <Text style={styles.note}>
              Ideas Buddy already gave you stay as they are. Its next ideas use what is written here.
            </Text>
          </>
        )}

        {showing.kind === "topics" && (
          <>
            <Text style={styles.title}>What should Buddy work on?</Text>
            {TOPICS.map((each) => (
              <PressScale
                key={each.area}
                style={[styles.row, each.area === about.area && styles.rowSelected]}
                onPress={() => chooseTopic(each.area)}
                accessibilityRole="button"
                accessibilityLabel={each.label}
              >
                <Text style={styles.rowIcon}>{each.icon}</Text>
                <Text style={styles.rowLabel}>{each.label}</Text>
              </PressScale>
            ))}
          </>
        )}

        {showing.kind === "answer" && (
          <>
            <AnswerForm
              key={showing.question.question}
              question={showing.question}
              earlier={about.answers.find((each) => each.question === showing.question.question)?.answer ?? null}
              submitLabel="Save"
              onSubmit={(answer) => {
                onTell({ area: showing.area, answers: [{ question: showing.question.question, answer }] });
                list();
              }}
            />
            {/* Taking an answer back is as valid as correcting it. */}
            {about.answers.some((each) => each.question === showing.question.question) && (
              <PressScale
                style={styles.textButton}
                onPress={() => {
                  onForget(showing.question.question);
                  list();
                }}
                accessibilityRole="button"
              >
                <Text style={styles.link}>Forget this answer</Text>
              </PressScale>
            )}
          </>
        )}

        {showing.kind !== "list" && (
          <PressScale style={styles.textButton} onPress={list} accessibilityRole="button">
            <Text style={styles.link}>Back</Text>
          </PressScale>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const GREEN = "#1F6F5C";
const LINE = "#C9CFCC";

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 16 },
  top: { flexDirection: "row", justifyContent: "flex-end" },
  // 48 is the smallest height Android recommends for something you tap.
  textButton: { minHeight: 48, justifyContent: "center", alignSelf: "flex-start" },
  link: { color: GREEN, fontSize: 16, fontWeight: "600" },
  view: { gap: 12 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24 },
  note: { fontSize: 13, lineHeight: 18, opacity: 0.6 },
  section: { fontSize: 14, fontWeight: "600", color: GREEN, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12 },
  row: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF" },
  rowSelected: { borderColor: GREEN, backgroundColor: "#E7F2EE" },
  rowIcon: { fontSize: 22 },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
  rowDetail: { fontSize: 14, lineHeight: 20, opacity: 0.6 },
});
