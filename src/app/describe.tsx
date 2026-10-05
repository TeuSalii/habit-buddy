import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

// Screen 1: one question, one field. Nothing else competes for attention.
export default function Describe() {
  const [habit, setHabit] = useState("");
  const canSubmit = habit.trim().length > 0;

  function submit() {
    // The habit travels to the next screen as a route param.
    router.push({ pathname: "/suggestions", params: { habit: habit.trim() } });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.question}>What do you want to do more of?</Text>
      <TextInput
        style={styles.input}
        value={habit}
        onChangeText={setHabit}
        placeholder="e.g. read more books"
        multiline
        autoFocus
      />
      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={submit}
        disabled={!canSubmit}
      >
        <Text style={styles.buttonLabel}>Break it down</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  question: { fontSize: 24, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#C9CFCC", borderRadius: 12, padding: 16, fontSize: 16, minHeight: 96, textAlignVertical: "top" },
  button: { backgroundColor: "#1F6F5C", borderRadius: 12, padding: 16, alignItems: "center" },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
