import { ImageBackground, StyleSheet, Text, View } from "react-native";

import { PressScale } from "@/components/press-scale";
import { TOPICS, questionFor } from "@/content/self-questions";
import type { FoodProfile } from "@/shared/offer";

// The card at the top of the day map: a picture as its header, with the
// title on it (the look of a "card with image header"). It says where the
// person stands with Buddy, sums up what Buddy knows about them, and opens
// the quiz again. The quiz is an invitation, never a task.

// The card shows this many answers, the newest first. The rest is one tap
// away: a summary that lists everything is no summary.
const SHOWN = 3;

type Props = {
  about: FoodProfile | null;
  onTakeQuiz: () => void;
  onShowKnown: () => void; // everything Buddy knows, with the way to change it
};

export function HereCard({ about, onTakeQuiz, onShowKnown }: Props) {
  const answers = about?.answers ?? [];
  const newest = answers.slice(-SHOWN).reverse();
  const more = answers.length - newest.length;

  return (
    <View style={styles.card}>
      <ImageBackground
        source={require("@/assets/images/here-card.jpg")}
        style={styles.header}
        resizeMode="cover"
      >
        <Text style={styles.eyebrow}>You are here</Text>
        <Text style={styles.title}>{titleFor(about)}</Text>
      </ImageBackground>

      <View style={styles.body}>
        <View style={styles.summary}>
          <Text style={styles.known}>What Buddy knows about you</Text>
          {answers.length === 0 && <Text style={styles.line}>Nothing yet.</Text>}
          {newest.map((each) => (
            // The question in a few words, then the answer. Two lines at most,
            // so a long answer in the person's own words cannot fill the card.
            <Text key={each.question} style={styles.line} numberOfLines={2}>
              <Text style={styles.label}>{questionFor(each.question).short}: </Text>
              {each.answer}
            </Text>
          ))}
          {more > 0 && <Text style={styles.known}>and {more} more</Text>}
          {/* Only once the person told Buddy something is there anything to change. */}
          {about !== null && (
            <PressScale style={styles.textButton} onPress={onShowKnown} accessibilityRole="button">
              <Text style={styles.link}>See all and change</Text>
            </PressScale>
          )}
        </View>
        <Text style={styles.text}>
          Take a quiz whenever you feel like it. It can be just for fun, or a way to tell Buddy
          more about you. It never has to end in a new plan.
        </Text>
        <PressScale style={styles.button} onPress={onTakeQuiz} accessibilityRole="button">
          <Text style={styles.buttonLabel}>Take a quiz</Text>
        </PressScale>
      </View>
    </View>
  );
}

// The topic the person chose, in a few words.
function titleFor(about: FoodProfile | null): string {
  if (about === null) return "Just getting started";
  if (about.area === "other") return "Your own topic";
  if (about.area === "not_sure") return "Finding out what fits";
  // Every other area has a topic with a label.
  return TOPICS.find((topic) => topic.area === about.area)?.label ?? "Just getting started";
}

const GREEN = "#1F6F5C";

const styles = StyleSheet.create({
  // overflow: hidden cuts the picture to the card's rounded corners.
  card: { borderRadius: 16, overflow: "hidden", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#C9CFCC" },
  header: { height: 132, justifyContent: "flex-end", padding: 16 },
  // White on the dark lower part of the picture.
  eyebrow: { color: "#FFFFFF", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, opacity: 0.9 },
  title: { color: "#FFFFFF", fontSize: 22, lineHeight: 28, fontWeight: "600" },
  body: { padding: 16, gap: 12 },
  summary: { gap: 4 },
  known: { fontSize: 13, lineHeight: 18, opacity: 0.6 },
  line: { fontSize: 15, lineHeight: 22, fontWeight: "600" },
  label: { fontWeight: "400", opacity: 0.7 },
  textButton: { minHeight: 48, justifyContent: "center", alignSelf: "flex-start" },
  link: { color: GREEN, fontSize: 16, fontWeight: "600" },
  text: { fontSize: 14, lineHeight: 20, opacity: 0.8 },
  // 48 is the smallest height Android recommends for something you tap.
  button: { minHeight: 48, justifyContent: "center", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: GREEN },
  buttonLabel: { color: GREEN, fontSize: 16, fontWeight: "600" },
});
