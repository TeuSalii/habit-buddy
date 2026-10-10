import { Link } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Essence } from "@/components/essence";
import { FoodMomentForm } from "@/components/food-moment-form";
import { SLOT_LABEL } from "@/components/food-moment-labels";
import { type Change, MAX_OPEN_CHANGES, askBuddy, openChangesIn, setBuddyFor } from "@/client/ask-buddy";
import { HereCard } from "@/components/here-card";
import { MomentCard } from "@/components/moment-card";
import { PressScale } from "@/components/press-scale";
import type { CheckinRequest } from "@/shared/checkin";
import { type FoodMoment, SLOTS } from "@/shared/food-moment";
import { datesOfWeek, toDateText } from "@/shared/week";
import type { SavedState } from "@/storage/saved-state";

// The day map. The person adds the moments when food happens in their week,
// Buddy offers one tiny habit for a moment, and an accepted plan can be
// ticked off day by day.
//
// This component does not own the data: it receives the saved state and
// asks for changes through `change`. The owner (the home screen) stores
// every change on the phone.

// Why the "add a food moment" form is open. "map": the person tapped the
// button on the map. "idea": they came from the quiz and asked for an idea
// at a new moment, maybe on the theme of the quiz question (focus).
export type Adding = { reason: "map" } | { reason: "idea"; focus: string | null };

type Props = {
  state: SavedState;
  change: Change;
  adding: Adding | null; // null: the form is closed
  setAdding: (next: Adding | null) => void;
  onTakeQuiz: () => void;
  onShowKnown: () => void;
  onChangeUser: () => void; // opens the list of people on this phone
};

export function DayMap({ state, change, adding, setAdding, onTakeQuiz, onShowKnown, onChangeUser }: Props) {
  const { moments, buddy, checks, about, userId, name } = state;

  const now = new Date();
  const today = toDateText(now);
  const week = datesOfWeek(now);

  function ask(moment: FoodMoment, declined: string[], focus: string | null) {
    askBuddy(change, { userId, about, moment, declined, focus });
  }

  function add(details: Omit<FoodMoment, "id">) {
    const moment = { ...details, id: Date.now().toString() };
    change((current) => ({ ...current, moments: [...current.moments, moment] }));
    setAdding(null);
    // The payoff comes right away: Buddy looks at the new moment. Coming
    // from the quiz, the person asked for it. Otherwise Buddy offers only
    // while fewer than two changes are open.
    if (adding?.reason === "idea") ask(moment, [], adding.focus);
    else if (openChangesIn(buddy) < MAX_OPEN_CHANGES) ask(moment, [], null);
  }

  function remove(id: string) {
    change((current) => {
      const { [id]: removedBuddy, ...restBuddy } = current.buddy;
      const { [id]: removedChecks, ...restChecks } = current.checks;
      return {
        ...current,
        moments: current.moments.filter((moment) => moment.id !== id),
        buddy: restBuddy,
        checks: restChecks,
      };
    });
  }

  function accept(id: string) {
    const current = buddy[id];
    if (current?.status !== "offered") return;
    setBuddyFor(change, id, { status: "accepted", habit: current.habit }, true);
  }

  function decline(id: string) {
    const current = buddy[id];
    if (current?.status !== "offered") return;
    // Remember what was turned down, so the next idea is a different one.
    setBuddyFor(change, id, { status: "declined", declined: [...current.declined, current.habit.behavior] }, true);
  }

  // "Another idea" or "Try again": the person asks, so the limit of two
  // open changes does not apply here. It only holds back Buddy's own offers.
  function askAgain(moment: FoodMoment) {
    const current = buddy[moment.id];
    if (current?.status !== "declined" && current?.status !== "failed") return;
    ask(moment, current.declined, null);
  }

  // Ticks or un-ticks one day of a plan. The phone is the record the person
  // sees; the server log is for us, to learn which plans hold.
  function toggleDay(momentId: string, date: string) {
    const current = buddy[momentId];
    if (current?.status !== "accepted") return;
    const done = !(checks[momentId] ?? []).includes(date);

    change((latest) => {
      const dates = latest.checks[momentId] ?? [];
      return {
        ...latest,
        checks: { ...latest.checks, [momentId]: done ? [...dates, date] : dates.filter((each) => each !== date) },
      };
    });
    // If the log cannot be reached, the tick still counts on the phone.
    // That line is then missing in the log; we don't send it again later.
    postCheckin({ userId, momentId, habit: current.habit, date, done }).catch(console.error);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Who is using the app right now, and the way to become someone
          else. It is here for testing with different people in mind. */}
      <PressScale
        style={styles.user}
        onPress={onChangeUser}
        accessibilityRole="button"
        accessibilityLabel={`${name}. Change user`}
      >
        <Text style={styles.userName} numberOfLines={1}>
          👤 {name}
        </Text>
        <Text style={styles.userLink}>Change user</Text>
      </PressScale>

      <HereCard about={about} onTakeQuiz={onTakeQuiz} onShowKnown={onShowKnown} />

      {moments.length === 0 ? (
        <>
          {/* Buddy is present on the empty map: this is who answers. */}
          <Essence mood="idle" />
          <Text style={styles.title}>Your food day</Text>
          <Text style={styles.body}>
            Tell Buddy one moment when food happens in your week. Buddy answers with one small idea
            for that moment.
          </Text>
          {/* An example shows what you give and what you get faster than a definition. */}
          <View style={styles.example}>
            <Text style={styles.exampleLabel}>You add</Text>
            <Text style={styles.exampleText}>🛒 Shopping, in the evening, on Wed and Sat</Text>
            <Text style={[styles.exampleLabel, styles.exampleGap]}>Buddy's idea</Text>
            <Text style={styles.exampleText}>
              Before I leave for the shop, I will take a photo of my fridge.
            </Text>
          </View>
        </>
      ) : (
        // All four parts of the day are always shown, also the empty ones:
        // that is what makes this a map of the day and not just a list.
        SLOTS.map((slot) => (
          // layout: when a card appears, grows or leaves, the rest glides to its new place.
          <Animated.View key={slot} style={styles.slot} layout={LinearTransition}>
            <Text style={styles.slotLabel}>{SLOT_LABEL[slot]}</Text>
            <View style={styles.line}>
              {moments
                .filter((moment) => moment.slot === slot)
                .map((moment) => (
                  <MomentCard
                    key={moment.id}
                    moment={moment}
                    buddy={buddy[moment.id]}
                    week={week}
                    today={today}
                    doneDates={checks[moment.id] ?? []}
                    onToggleDay={(date) => toggleDay(moment.id, date)}
                    onAccept={() => accept(moment.id)}
                    onDecline={() => decline(moment.id)}
                    onAsk={() => askAgain(moment)}
                    onRemove={() => remove(moment.id)}
                  />
                ))}
            </View>
          </Animated.View>
        ))
      )}

      <Animated.View layout={LinearTransition} style={styles.actions}>
        <PressScale style={styles.button} onPress={() => setAdding({ reason: "map" })} accessibilityRole="button">
          <Text style={styles.buttonLabel}>Add a food moment</Text>
        </PressScale>
        {/* For developers: the lab where Buddy's suggestions are reviewed. */}
        <Link href="/lab" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryLabel}>Developer lab</Text>
          </Pressable>
        </Link>
      </Animated.View>

      {/* A Modal covers the screen and closes with Android's back gesture
          (onRequestClose). While it is hidden, the form inside does not exist,
          so every time it opens the form starts empty. */}
      <Modal visible={adding !== null} animationType="slide" onRequestClose={() => setAdding(null)}>
        <SafeAreaView style={styles.modal}>
          <FoodMomentForm onSave={add} onCancel={() => setAdding(null)} />
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

async function postCheckin(body: CheckinRequest) {
  const response = await fetch("/api/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`/api/checkin failed (${response.status}): ${await response.text()}`);
  }
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: "600" },
  body: { fontSize: 16, lineHeight: 24 },
  example: { backgroundColor: "#E7F2EE", borderRadius: 12, padding: 16, gap: 4 },
  exampleLabel: { fontSize: 14, opacity: 0.6 },
  exampleGap: { marginTop: 8 },
  exampleText: { fontSize: 16, fontWeight: "600", color: "#1F6F5C", lineHeight: 24 },
  slot: { gap: 8 },
  slotLabel: { fontSize: 14, fontWeight: "600", opacity: 0.6 },
  // The vertical line down the left edge is the timeline.
  line: { borderLeftWidth: 2, borderLeftColor: "#C9CFCC", paddingLeft: 12, gap: 8, minHeight: 24 },
  actions: { gap: 12 },
  button: { backgroundColor: "#1F6F5C", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 12 },
  buttonLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  secondaryButton: { borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#1F6F5C" },
  secondaryLabel: { color: "#1F6F5C", fontSize: 16, fontWeight: "600" },
  // 48 is the smallest height Android recommends for something you tap.
  user: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  userName: { fontSize: 16, fontWeight: "600", flexShrink: 1 },
  userLink: { color: "#1F6F5C", fontSize: 16, fontWeight: "600" },
  modal: { flex: 1, backgroundColor: "#FFFFFF" },
});
