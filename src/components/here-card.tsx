import { ImageBackground, StyleSheet, Text, View } from "react-native";

import { PressScale } from "@/components/press-scale";
import { TOPICS } from "@/content/self-questions";
import type { FoodProfile } from "@/shared/offer";

// The card at the top of the day map: a picture as its header, with the
// title on it (the look of a "card with image header"). It says where the
// person stands with Buddy, shows what Buddy knows about them, and opens the
// quiz again. The quiz is an invitation, never a task.

type Props = {
  about: FoodProfile | null;
  onTakeQuiz: () => void;
};

export function HereCard({ about, onTakeQuiz }: Props) {
  const latest = about === null ? undefined : about.answers[about.answers.length - 1];

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
        {latest !== undefined && (
          <View>
            <Text style={styles.known}>Buddy knows · {latest.question}</Text>
            <Text style={styles.answer}>{latest.answer}</Text>
          </View>
        )}
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
  known: { fontSize: 13, lineHeight: 18, opacity: 0.6 },
  answer: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  text: { fontSize: 14, lineHeight: 20, opacity: 0.8 },
  // 48 is the smallest height Android recommends for something you tap.
  button: { minHeight: 48, justifyContent: "center", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: GREEN },
  buttonLabel: { color: GREEN, fontSize: 16, fontWeight: "600" },
});
