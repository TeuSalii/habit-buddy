import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

// Screen 2: this is where the AI's 1–2 tiny habits will appear.
// Next step together: the API route that produces them.
export default function Suggestions() {
  const { habit } = useLocalSearchParams<{ habit: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your habit</Text>
      <Text style={styles.habit}>{habit}</Text>
      <Text style={styles.placeholder}>Tiny habit suggestions will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  label: { fontSize: 14, opacity: 0.6 },
  habit: { fontSize: 20, fontWeight: "600" },
  placeholder: { fontSize: 16, marginTop: 24, opacity: 0.6 },
});
