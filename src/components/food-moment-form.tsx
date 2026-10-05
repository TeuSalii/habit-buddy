import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInRight, FlipInEasyX } from "react-native-reanimated";

import {
  DAY_GROUPS,
  DAY_LABEL,
  KIND_ICON,
  KIND_LABEL,
  PLACE_ICON,
  PLACE_LABEL,
  PLACE_PHRASE,
  SLOT_ICON,
  SLOT_LABEL,
  SLOT_PHRASE,
  daysPhrase,
  groupOf,
} from "@/components/food-moment-labels";
import { PressScale } from "@/components/press-scale";
import {
  DAYS,
  type Day,
  type FoodMoment,
  MOMENT_KINDS,
  type MomentKind,
  PLACES,
  type Place,
  SLOTS,
  type Slot,
} from "@/shared/food-moment";

// The form for one food moment. It asks one question at a time, and every
// answer fills a part of a sentence at the top, so the person always sees
// what they are building: "Lunch, at midday, at work or school, on weekdays".
// It returns the answers without an id; the day map gives the moment its id.

type Props = {
  onSave: (moment: Omit<FoodMoment, "id">) => void;
  onCancel: () => void;
};

const STEPS = ["kind", "slot", "place", "days"] as const;
type Step = (typeof STEPS)[number];

const QUESTION: Record<Step, { title: string; hint: string }> = {
  kind: { title: "What is the moment?", hint: "Pick one. You can add more moments afterwards." },
  slot: { title: "When in the day?", hint: "Roughly is enough." },
  place: { title: "Where are you then?", hint: "The place decides which small changes are possible." },
  days: { title: "On which days?", hint: "Tap a shortcut, or pick single days." },
};

// Meals have an obvious part of the day, so we fill it in and skip the
// question. The person can still change it by tapping it in the sentence.
const USUAL_SLOT: Partial<Record<MomentKind, Slot>> = {
  breakfast: "morning",
  lunch: "midday",
  dinner: "evening",
};

// After an answer, go to the first question that is still open.
function firstOpenStep(kind: MomentKind | null, slot: Slot | null, place: Place | null): Step {
  if (kind === null) return "kind";
  if (slot === null) return "slot";
  if (place === null) return "place";
  return "days";
}

export function FoodMomentForm({ onSave, onCancel }: Props) {
  const [kind, setKind] = useState<MomentKind | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [step, setStep] = useState<Step>("kind");

  // A different kind is a different moment, so "when" starts again:
  // either with the usual part of the day, or as an open question.
  function chooseKind(next: MomentKind) {
    const usual = USUAL_SLOT[next] ?? null;
    setKind(next);
    setSlot(usual);
    setStep(firstOpenStep(next, usual, place));
  }

  function chooseSlot(next: Slot) {
    setSlot(next);
    setStep(firstOpenStep(kind, next, place));
  }

  function choosePlace(next: Place) {
    setPlace(next);
    setStep(firstOpenStep(kind, slot, next));
  }

  function toggleDay(day: Day) {
    setDays((current) =>
      current.includes(day) ? current.filter((other) => other !== day) : [...current, day],
    );
  }

  // The moment exists only once all four questions are answered. Until then
  // it is null, and the save button stays disabled.
  const moment =
    kind !== null && slot !== null && place !== null && days.length > 0
      ? { kind, slot, place, days }
      : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add a food moment</Text>
      <Text style={styles.intro}>
        Any time food shows up in your week: a meal, shopping, cooking. Four short questions.
      </Text>

      {/* The sentence being built. Tapping a part goes back to its question. */}
      <View style={styles.sentence}>
        <SentencePart
          text={kind === null ? null : `${KIND_ICON[kind]} ${KIND_LABEL[kind]}`}
          placeholder="what?"
          active={step === "kind"}
          onPress={() => setStep("kind")}
        />
        <SentencePart
          text={slot === null ? null : SLOT_PHRASE[slot]}
          placeholder="when?"
          active={step === "slot"}
          onPress={() => setStep("slot")}
        />
        <SentencePart
          text={place === null ? null : PLACE_PHRASE[place]}
          placeholder="where?"
          active={step === "place"}
          onPress={() => setStep("place")}
        />
        <SentencePart
          text={days.length === 0 ? null : daysPhrase(days)}
          placeholder="which days?"
          active={step === "days"}
          onPress={() => setStep("days")}
        />
      </View>

      <View
        style={styles.dots}
        accessible
        accessibilityLabel={`Question ${STEPS.indexOf(step) + 1} of ${STEPS.length}`}
      >
        {STEPS.map((each) => (
          <View key={each} style={[styles.dot, each === step && styles.dotActive]} />
        ))}
      </View>

      {/* key={step}: a new question is a new element, so it slides in. */}
      <Animated.View key={step} entering={FadeInRight.duration(220)} style={styles.question}>
        <Text style={styles.questionTitle}>{QUESTION[step].title}</Text>
        <Text style={styles.hint}>{QUESTION[step].hint}</Text>

        {step === "kind" && (
          <Options options={MOMENT_KINDS} icons={KIND_ICON} labels={KIND_LABEL} selected={kind} onPress={chooseKind} />
        )}
        {step === "slot" && (
          <Options options={SLOTS} icons={SLOT_ICON} labels={SLOT_LABEL} selected={slot} onPress={chooseSlot} />
        )}
        {step === "place" && (
          <Options options={PLACES} icons={PLACE_ICON} labels={PLACE_LABEL} selected={place} onPress={choosePlace} />
        )}
        {step === "days" && (
          <>
            <View style={styles.chips}>
              {DAY_GROUPS.map((group) => (
                <Chip
                  key={group.label}
                  label={group.label}
                  selected={groupOf(days) === group}
                  onPress={() => setDays([...group.days])}
                />
              ))}
            </View>
            <View style={styles.chips}>
              {DAYS.map((day) => (
                <Chip
                  key={day}
                  label={DAY_LABEL[day]}
                  selected={days.includes(day)}
                  onPress={() => toggleDay(day)}
                />
              ))}
            </View>
            <PressScale
              style={[styles.button, moment === null && styles.buttonDisabled]}
              onPress={() => moment !== null && onSave(moment)}
              disabled={moment === null}
              accessibilityRole="button"
            >
              <Text style={styles.buttonLabel}>Add to my food day</Text>
            </PressScale>
          </>
        )}
      </Animated.View>

      <PressScale style={styles.cancel} onPress={onCancel} accessibilityRole="button">
        <Text style={styles.cancelLabel}>Cancel</Text>
      </PressScale>
    </ScrollView>
  );
}

// One part of the sentence. Empty: a dashed placeholder. Filled: the answer,
// which flips in like a tile on a departure board whenever it changes
// (key={text} makes a changed answer a new element, so it animates again).
type SentencePartProps = {
  text: string | null;
  placeholder: string;
  active: boolean;
  onPress: () => void;
};

function SentencePart({ text, placeholder, active, onPress }: SentencePartProps) {
  return (
    <PressScale
      style={[styles.part, text !== null && styles.partFilled, active && styles.partActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text === null ? `Answer ${placeholder}` : `Change ${text}`}
    >
      {text === null ? (
        <Text style={styles.partPlaceholder}>{placeholder}</Text>
      ) : (
        <Animated.Text key={text} entering={FlipInEasyX.duration(350)} style={styles.partText}>
          {text}
        </Animated.Text>
      )}
    </PressScale>
  );
}

// The answers to a "pick one" question, as large cards with an icon.
type OptionsProps<T extends string> = {
  options: readonly T[];
  icons: Record<T, string>;
  labels: Record<T, string>;
  selected: T | null;
  onPress: (option: T) => void;
};

function Options<T extends string>({ options, icons, labels, selected, onPress }: OptionsProps<T>) {
  return (
    <View style={styles.options}>
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <PressScale
            key={option}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onPress(option)}
            accessibilityRole="button"
            accessibilityLabel={labels[option]}
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={styles.optionIcon}>{icons[option]}</Text>
            <Text style={[styles.optionLabel, isSelected && styles.selectedLabel]}>{labels[option]}</Text>
          </PressScale>
        );
      })}
    </View>
  );
}

// A small on/off pill, used for the days.
type ChipProps = { label: string; selected: boolean; onPress: () => void };

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <PressScale
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipLabel, selected && styles.selectedLabel]}>{label}</Text>
    </PressScale>
  );
}

const GREEN = "#1F6F5C";
const PALE_GREEN = "#E7F2EE";
const LINE = "#C9CFCC";

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: "600" },
  intro: { fontSize: 16, lineHeight: 24, opacity: 0.7 },

  sentence: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  // 48 is the smallest height Android recommends for something you tap.
  part: { minHeight: 48, justifyContent: "center", paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: LINE },
  partFilled: { backgroundColor: PALE_GREEN, borderStyle: "solid", borderColor: PALE_GREEN },
  partActive: { borderStyle: "solid", borderColor: GREEN },
  partPlaceholder: { fontSize: 16, opacity: 0.5 },
  partText: { fontSize: 16, fontWeight: "600", color: GREEN },

  dots: { flexDirection: "row", gap: 6, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LINE },
  dotActive: { width: 24, backgroundColor: GREEN },

  question: { gap: 12 },
  questionTitle: { fontSize: 20, fontWeight: "600" },
  hint: { fontSize: 14, opacity: 0.6, marginTop: -8 },

  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  option: { width: "48%", minHeight: 88, justifyContent: "center", gap: 4, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: "#FFFFFF" },
  optionSelected: { backgroundColor: GREEN, borderColor: GREEN },
  optionIcon: { fontSize: 28 },
  optionLabel: { fontSize: 16, fontWeight: "600" },
  selectedLabel: { color: "#FFFFFF" },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 48, minWidth: 56, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: LINE },
  chipSelected: { backgroundColor: GREEN, borderColor: GREEN },
  chipLabel: { fontSize: 16, fontWeight: "600" },

  button: { backgroundColor: GREEN, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 12 },
  buttonDisabled: { opacity: 0.4 },
  buttonLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  cancel: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 8 },
  cancelLabel: { color: GREEN, fontSize: 16, fontWeight: "600" },
});
