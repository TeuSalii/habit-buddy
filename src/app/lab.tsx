import { type ReactNode, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  DAY_GROUPS,
  type DayGroup,
  KIND_LABEL,
  PLACE_LABEL,
  PLACE_PHRASE,
  SLOT_LABEL,
  SLOT_PHRASE,
} from "@/components/food-moment-labels";
import { PressScale } from "@/components/press-scale";
import { SELF_QUESTIONS, TOPICS } from "@/content/self-questions";
import { MOMENT_KINDS, type MomentDetails, type MomentKind, PLACES, type Place, SLOTS, type Slot } from "@/shared/food-moment";
import {
  type LabChoiceRequest,
  type LabChoiceResponse,
  type LabSuggestRequest,
  type LabSuggestResponse,
  MAX_NOTE_LENGTH,
} from "@/shared/lab";
import { type FoodArea, type FoodProfile, MAX_ANSWER_LENGTH } from "@/shared/offer";
import { MODEL_IDS, type ModelId, type TinyHabit } from "@/shared/tiny-habit";

// Developer lab. Not part of the app a person uses.
//
// You build a statement: what a person could have decided in the app
// (a food moment, and what they told Buddy). The model answers with three
// suggestions. You pick the right one, and it is saved as an approved offer.
// From the next request on, both models are shown the approved offers,
// in the lab and in the real app.

const MODEL_LABEL: Record<ModelId, string> = { claude: "Claude", gemma: "Gemma" };

// The topic row has one extra choice: a person who skipped the introduction.
type TopicChoice = FoodArea | "skipped";

// One round: the suggestions that came back, and what was done with them.
type Round =
  | { status: "suggested"; rulesVersion: string; suggestions: TinyHabit[] }
  | { status: "declined"; message: string }
  | { status: "saved"; chosen: TinyHabit | null };

export default function Lab() {
  const [model, setModel] = useState<ModelId>("claude");

  // The statement.
  const [kind, setKind] = useState<MomentKind | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [days, setDays] = useState<DayGroup | null>(null);
  const [topic, setTopic] = useState<TopicChoice | null>(null);
  const [answer, setAnswer] = useState("");

  const [round, setRound] = useState<Round | null>(null);
  // Behaviors already shown for this statement, so "three more" are different.
  const [shown, setShown] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedCount, setApprovedCount] = useState<number | null>(null);

  // A changed statement is a new statement: what was suggested no longer belongs to it.
  function changeStatement(apply: () => void) {
    apply();
    setRound(null);
    setShown([]);
    setNote("");
    setError(null);
  }

  const moment: MomentDetails | null =
    kind !== null && slot !== null && place !== null && days !== null
      ? { kind, slot, place, days: [...days.days] }
      : null;
  const about = topic === null ? undefined : toProfile(topic, answer);
  const ready = moment !== null && about !== undefined;

  async function suggest() {
    if (moment === null || about === undefined) return;
    setBusy(true);
    setError(null);
    try {
      const response = await post<LabSuggestRequest, LabSuggestResponse>("/api/lab/suggest", {
        model,
        moment,
        about,
        avoid: shown,
      });
      setApprovedCount(response.approvedCount);
      if (response.kind === "decline") {
        setRound({ status: "declined", message: response.message });
      } else {
        setRound({ status: "suggested", rulesVersion: response.rulesVersion, suggestions: response.suggestions });
        setShown((current) => [...current, ...response.suggestions.map((each) => each.behavior)]);
      }
    } catch (caught) {
      // A developer tool shows the real error, not a friendly sentence.
      setError(String(caught));
    }
    setBusy(false);
  }

  async function choose(chosen: number | null) {
    if (moment === null || about === undefined || round?.status !== "suggested") return;
    setBusy(true);
    setError(null);
    try {
      const response = await post<LabChoiceRequest, LabChoiceResponse>("/api/lab/choice", {
        model,
        rulesVersion: round.rulesVersion,
        moment,
        about,
        suggestions: round.suggestions,
        chosen,
        note: note.trim(),
      });
      setApprovedCount(response.approvedCount);
      setRound({ status: "saved", chosen: chosen === null ? null : round.suggestions[chosen] });
      setNote("");
    } catch (caught) {
      setError(String(caught));
    }
    setBusy(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        For developers. Build a statement, get three suggestions, choose the right one. Chosen
        suggestions are shown to both models with every request, here and in the app.
      </Text>
      {approvedCount !== null && <Text style={styles.count}>Approved offers so far: {approvedCount}</Text>}

      <Section title="Model">
        <Chips options={MODEL_IDS} labels={MODEL_LABEL} selected={model} onPress={(next) => changeStatement(() => setModel(next))} />
      </Section>

      <Text style={styles.heading}>Statement</Text>
      <Section title="What">
        <Chips options={MOMENT_KINDS} labels={KIND_LABEL} selected={kind} onPress={(next) => changeStatement(() => setKind(next))} />
      </Section>
      <Section title="When in the day">
        <Chips options={SLOTS} labels={SLOT_LABEL} selected={slot} onPress={(next) => changeStatement(() => setSlot(next))} />
      </Section>
      <Section title="Where">
        <Chips options={PLACES} labels={PLACE_LABEL} selected={place} onPress={(next) => changeStatement(() => setPlace(next))} />
      </Section>
      <Section title="Days">
        <View style={styles.chips}>
          {DAY_GROUPS.map((group) => (
            <Chip key={group.label} label={group.label} selected={group === days} onPress={() => changeStatement(() => setDays(group))} />
          ))}
        </View>
      </Section>
      <Section title="Topic the person chose">
        <View style={styles.chips}>
          {TOPICS.map((each) => (
            <Chip
              key={each.area}
              label={each.label}
              selected={each.area === topic}
              onPress={() =>
                changeStatement(() => {
                  setTopic(each.area);
                  setAnswer("");
                })
              }
            />
          ))}
          <Chip
            label="Skipped the intro"
            selected={topic === "skipped"}
            onPress={() =>
              changeStatement(() => {
                setTopic("skipped");
                setAnswer("");
              })
            }
          />
        </View>
      </Section>
      {/* The statement holds one answer: to the topic's first question. */}
      {topic !== null && topic !== "skipped" && topic !== "not_sure" && (
        <Section title={`Their answer to "${SELF_QUESTIONS[topic][0].question}" (optional)`}>
          <View style={styles.chips}>
            {SELF_QUESTIONS[topic][0].options.map((option) => (
              <Chip key={option} label={option} selected={option === answer} onPress={() => changeStatement(() => setAnswer(option))} />
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={answer}
            onChangeText={(text) => changeStatement(() => setAnswer(text))}
            placeholder="Or their own words"
            placeholderTextColor="#7F8986"
            maxLength={MAX_ANSWER_LENGTH}
            accessibilityLabel="The person's own answer"
          />
        </Section>
      )}

      {moment !== null && topic !== null && (
        <Text style={styles.statement}>
          {KIND_LABEL[moment.kind]}, {SLOT_PHRASE[moment.slot]}, {PLACE_PHRASE[moment.place]}, {days?.phrase}
          {" · "}
          {topic === "skipped" ? "skipped the intro" : TOPICS.find((each) => each.area === topic)?.label}
          {answer.trim() !== "" ? ` · “${answer.trim()}”` : ""}
        </Text>
      )}

      <PressScale
        style={[styles.primary, (!ready || busy) && styles.disabled]}
        onPress={suggest}
        disabled={!ready || busy}
        accessibilityRole="button"
      >
        <Text style={styles.primaryLabel}>{shown.length === 0 ? "Get 3 suggestions" : "Get 3 different ones"}</Text>
      </PressScale>

      {busy && <ActivityIndicator color={GREEN} />}
      {error !== null && <Text style={styles.error}>{error}</Text>}

      {round?.status === "declined" && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>The model declined (scope rule)</Text>
          <Text style={styles.behavior}>{round.message}</Text>
        </View>
      )}

      {round?.status === "suggested" && (
        <>
          {round.suggestions.map((habit, index) => (
            <View key={habit.behavior} style={styles.card}>
              <Text style={styles.cardLabel}>Suggestion {index + 1}</Text>
              <Text style={styles.anchor}>{habit.anchor}</Text>
              <Text style={styles.behavior}>{habit.behavior}</Text>
              <Text style={styles.why}>{habit.why}</Text>
              <PressScale
                style={[styles.pick, busy && styles.disabled]}
                onPress={() => choose(index)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`Suggestion ${index + 1} is the right one`}
              >
                <Text style={styles.pickLabel}>This is the right one</Text>
              </PressScale>
            </View>
          ))}
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Note (optional), for example why none of them fits"
            placeholderTextColor="#7F8986"
            maxLength={MAX_NOTE_LENGTH}
            accessibilityLabel="Note"
          />
          <PressScale style={[styles.secondary, busy && styles.disabled]} onPress={() => choose(null)} disabled={busy} accessibilityRole="button">
            <Text style={styles.secondaryLabel}>None of these fits</Text>
          </PressScale>
        </>
      )}

      {round?.status === "saved" && (
        <View style={styles.card}>
          {round.chosen === null ? (
            <Text style={styles.behavior}>Logged: none of them fits. Nothing was added to the approved offers.</Text>
          ) : (
            <>
              <Text style={styles.cardLabel}>Saved as an approved offer</Text>
              <Text style={styles.anchor}>{round.chosen.anchor}</Text>
              <Text style={styles.behavior}>{round.chosen.behavior}</Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// What the statement says about the person, in the form the app sends it.
function toProfile(topic: TopicChoice, answer: string): FoodProfile | null {
  if (topic === "skipped") return null;
  if (topic === "not_sure" || answer.trim() === "") return { area: topic, answers: [] };
  return { area: topic, answers: [{ question: SELF_QUESTIONS[topic][0].question, answer: answer.trim() }] };
}

async function post<Body, Result>(url: string, body: Body): Promise<Result> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${url} failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

type ChipsProps<T extends string> = {
  options: readonly T[];
  labels: Record<T, string>;
  selected: T | null;
  onPress: (option: T) => void;
};

function Chips<T extends string>({ options, labels, selected, onPress }: ChipsProps<T>) {
  return (
    <View style={styles.chips}>
      {options.map((option) => (
        <Chip key={option} label={labels[option]} selected={option === selected} onPress={() => onPress(option)} />
      ))}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <PressScale
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </PressScale>
  );
}

const GREEN = "#1F6F5C";
const LINE = "#C9CFCC";

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  intro: { fontSize: 14, lineHeight: 20, opacity: 0.8 },
  count: { fontSize: 14, fontWeight: "600" },
  heading: { fontSize: 18, fontWeight: "600", marginTop: 8 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: "600", opacity: 0.6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  // Smaller than in the app: this is a dense tool for a developer, on purpose.
  chip: { minHeight: 40, justifyContent: "center", paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF" },
  chipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  chipLabel: { fontSize: 14 },
  chipLabelSelected: { color: "#FFFFFF", fontWeight: "600" },
  input: { minHeight: 44, borderWidth: 1, borderColor: LINE, borderRadius: 8, paddingHorizontal: 12, fontSize: 14, backgroundColor: "#FFFFFF" },
  statement: { fontSize: 15, lineHeight: 22, fontWeight: "600", backgroundColor: "#E7F2EE", borderRadius: 8, padding: 12 },
  primary: { backgroundColor: GREEN, borderRadius: 8, padding: 14, alignItems: "center" },
  primaryLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  secondary: { borderRadius: 8, padding: 14, alignItems: "center", borderWidth: 1, borderColor: GREEN },
  secondaryLabel: { color: GREEN, fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.4 },
  error: { fontSize: 13, lineHeight: 18, color: "#9B2C2C", backgroundColor: "#FDECEC", borderRadius: 8, padding: 12 },
  card: { borderWidth: 1, borderColor: LINE, borderRadius: 8, padding: 12, gap: 4, backgroundColor: "#FFFFFF" },
  cardLabel: { fontSize: 12, fontWeight: "600", color: GREEN, textTransform: "uppercase", letterSpacing: 0.5 },
  anchor: { fontSize: 15, lineHeight: 21 },
  behavior: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  why: { fontSize: 13, lineHeight: 19, opacity: 0.7 },
  pick: { alignSelf: "flex-start", marginTop: 6, minHeight: 40, justifyContent: "center", paddingHorizontal: 14, borderRadius: 8, backgroundColor: GREEN },
  pickLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});
