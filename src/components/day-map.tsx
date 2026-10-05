import { Link } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Essence } from "@/components/essence";
import { FoodMomentForm } from "@/components/food-moment-form";
import { SLOT_LABEL } from "@/components/food-moment-labels";
import { HereCard } from "@/components/here-card";
import { MomentCard } from "@/components/moment-card";
import { PressScale } from "@/components/press-scale";
import type { CheckinRequest } from "@/shared/checkin";
import { type FoodMoment, SLOTS } from "@/shared/food-moment";
import type { OfferRequest, OfferResponse } from "@/shared/offer";
import type { ModelId } from "@/shared/tiny-habit";
import { datesOfWeek, toDateText } from "@/shared/week";
import type { BuddyState, SavedState } from "@/storage/saved-state";

// The model that makes Buddy's offers. The lab can switch models; the
// product uses one.
const OFFER_MODEL: ModelId = "claude";

// Buddy offers by itself only while fewer than this many changes are open.
// Starting many habits at once is how none of them sticks.
const MAX_OPEN_CHANGES = 2;

// The day map. The person adds the moments when food happens in their week,
// Buddy offers one tiny habit for a moment, and an accepted plan can be
// ticked off day by day.
//
// This component does not own the data: it receives the saved state and
// asks for changes through `change`. The owner (the home screen) stores
// every change on the phone.

type Props = {
  state: SavedState;
  // `update` gets the newest state and returns the changed one. Using the
  // newest state matters here, because Buddy's answer arrives later, when
  // other things may already have changed.
  change: (update: (current: SavedState) => SavedState) => void;
  startAdding: boolean; // open the "add a food moment" form right away
  onTakeQuiz: () => void;
};

export function DayMap({ state, change, startAdding, onTakeQuiz }: Props) {
  const { moments, buddy, checks, about, userId } = state;
  const [adding, setAdding] = useState(startAdding);

  const now = new Date();
  const today = toDateText(now);
  const week = datesOfWeek(now);

  const openChanges = Object.values(buddy).filter(
    (each) => each.status === "thinking" || each.status === "offered" || each.status === "accepted",
  ).length;

  function add(details: Omit<FoodMoment, "id">) {
    const moment = { ...details, id: Date.now().toString() };
    change((current) => ({ ...current, moments: [...current.moments, moment] }));
    setAdding(false);
    // The payoff comes right away: Buddy looks at the new moment.
    if (openChanges < MAX_OPEN_CHANGES) askBuddy(moment, []);
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

  // Sets Buddy's state for one moment, unless the moment was removed in the
  // meantime (an answer can arrive after the person tapped "Remove").
  function setBuddyFor(id: string, next: BuddyState, mustExist: boolean) {
    change((current) =>
      mustExist && current.buddy[id] === undefined
        ? current
        : { ...current, buddy: { ...current.buddy, [id]: next } },
    );
  }

  async function askBuddy(moment: FoodMoment, declined: string[]) {
    setBuddyFor(moment.id, { status: "thinking", declined }, false);
    try {
      const response = await postOffer({ userId, model: OFFER_MODEL, moment, about, declined });
      setBuddyFor(
        moment.id,
        response.kind === "offer"
          ? { status: "offered", habit: response.offer, declined }
          : { status: "outOfScope", message: response.message },
        true,
      );
    } catch (error) {
      // The server being unreachable is a normal thing to happen on a phone,
      // so the card says so and offers "Try again". The detail goes to the log.
      console.error(error);
      setBuddyFor(moment.id, { status: "failed", declined }, true);
    }
  }

  function accept(id: string) {
    const current = buddy[id];
    if (current?.status !== "offered") return;
    setBuddyFor(id, { status: "accepted", habit: current.habit }, true);
  }

  function decline(id: string) {
    const current = buddy[id];
    if (current?.status !== "offered") return;
    // Remember what was turned down, so the next idea is a different one.
    setBuddyFor(id, { status: "declined", declined: [...current.declined, current.habit.behavior] }, true);
  }

  // "Another idea" or "Try again": the person asks, so the limit of two
  // open changes does not apply here. It only holds back Buddy's own offers.
  function askAgain(moment: FoodMoment) {
    const current = buddy[moment.id];
    if (current?.status !== "declined" && current?.status !== "failed") return;
    askBuddy(moment, current.declined);
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
      <HereCard about={about} onTakeQuiz={onTakeQuiz} />

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
        <PressScale style={styles.button} onPress={() => setAdding(true)} accessibilityRole="button">
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
      <Modal visible={adding} animationType="slide" onRequestClose={() => setAdding(false)}>
        <SafeAreaView style={styles.modal}>
          <FoodMomentForm onSave={add} onCancel={() => setAdding(false)} />
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

async function postOffer(body: OfferRequest): Promise<OfferResponse> {
  const response = await fetch("/api/offer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`/api/offer failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
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
  modal: { flex: 1, backgroundColor: "#FFFFFF" },
});
