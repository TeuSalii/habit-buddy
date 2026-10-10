import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { PressScale } from "@/components/press-scale";
import { TOPICS } from "@/content/self-questions";
import type { SavedState } from "@/storage/saved-state";

// The people on this phone: who is using the app right now (with their
// name, which they can change), the others to switch to, and the way to
// start as someone new. Nothing here deletes anything: everyone keeps their
// own answers, moments, plans and ticks, and can be picked again later.

type Props = {
  users: SavedState[];
  activeId: string;
  onRename: (name: string) => void; // the person using the app
  onSwitch: (userId: string) => void;
  onAdd: () => void; // a new person, who starts with the introduction
  onClose: () => void;
};

export const MAX_NAME_LENGTH = 30;

export function Users({ users, activeId, onRename, onSwitch, onAdd, onClose }: Props) {
  const active = users.find((each) => each.userId === activeId);
  // What is in the name field. It can be empty while typing; the stored
  // name only follows it while there is something in it.
  const [draft, setDraft] = useState(active?.name ?? "");
  const others = users.filter((each) => each.userId !== activeId);

  function type(text: string) {
    setDraft(text);
    if (text.trim() !== "") onRename(text.trim());
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.top}>
        <PressScale style={styles.textButton} onPress={onClose} accessibilityRole="button">
          <Text style={styles.link}>Close</Text>
        </PressScale>
      </View>

      <Text style={styles.title}>Who is using Buddy?</Text>
      <Text style={styles.note}>
        Everyone keeps their own answers, moments and plans on this phone. Switching deletes nothing.
      </Text>

      <Text style={styles.section}>Right now</Text>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={type}
        maxLength={MAX_NAME_LENGTH}
        accessibilityLabel="Name"
      />
      <Text style={styles.note}>Tap the name to change it. It stays on this phone.</Text>

      {others.length > 0 && <Text style={styles.section}>Switch to</Text>}
      {others.map((each) => (
        <PressScale
          key={each.userId}
          style={styles.row}
          onPress={() => onSwitch(each.userId)}
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${each.name}`}
        >
          <Text style={styles.rowIcon}>👤</Text>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{each.name}</Text>
            <Text style={styles.rowDetail}>{describe(each)}</Text>
          </View>
        </PressScale>
      ))}

      <PressScale style={styles.button} onPress={onAdd} accessibilityRole="button">
        <Text style={styles.buttonLabel}>New user</Text>
      </PressScale>
      <Text style={styles.note}>A new user starts with the introduction.</Text>
    </ScrollView>
  );
}

// One line that tells the people apart: where they stand and what they chose.
function describe(user: SavedState): string {
  if (!user.introDone) return "Has not finished the introduction";
  const topic = TOPICS.find((each) => each.area === user.about?.area)?.label ?? "Skipped the introduction";
  const count = user.moments.length;
  return `${topic} · ${count} ${count === 1 ? "moment" : "moments"}`;
}

const GREEN = "#1F6F5C";
const LINE = "#C9CFCC";

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 12 },
  top: { flexDirection: "row", justifyContent: "flex-end" },
  // 48 is the smallest height Android recommends for something you tap.
  textButton: { minHeight: 48, justifyContent: "center", alignSelf: "flex-start" },
  link: { color: GREEN, fontSize: 16, fontWeight: "600" },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "600" },
  note: { fontSize: 13, lineHeight: 18, opacity: 0.6 },
  section: { fontSize: 14, fontWeight: "600", color: GREEN, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 12 },
  input: { minHeight: 48, borderWidth: 1, borderColor: LINE, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, fontWeight: "600", backgroundColor: "#FFFFFF" },
  row: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF" },
  rowIcon: { fontSize: 22 },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 16, fontWeight: "600" },
  rowDetail: { fontSize: 14, lineHeight: 20, opacity: 0.6 },
  button: { borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: GREEN, marginTop: 12 },
  buttonLabel: { color: GREEN, fontSize: 16, fontWeight: "600" },
});
