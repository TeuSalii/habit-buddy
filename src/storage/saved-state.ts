import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FoodMoment } from "@/shared/food-moment";
import { type FoodProfile, MAX_ANSWERS } from "@/shared/offer";
import type { TinyHabit } from "@/shared/tiny-habit";

// Everything the app remembers, kept on the phone. There is no account and
// no server database: the data stays on this device, under one key, as one
// piece of JSON. That is the simplest database there is, and enough for now.

// The key carries a version. If the shape below changes in a way old data
// does not fit, raise the version: the app then starts fresh instead of
// reading data it would misunderstand.
const KEY = "happy-habits-buddy:v1";

// Where Buddy stands with one moment. Each state carries exactly the data
// that exists in it: there is a habit only once Buddy has offered one.
export type BuddyState =
  | { status: "thinking"; declined: string[] }
  | { status: "offered"; habit: TinyHabit; declined: string[] }
  | { status: "accepted"; habit: TinyHabit }
  | { status: "declined"; declined: string[] }
  // Buddy read something in the person's own words that it must not coach.
  | { status: "outOfScope"; message: string }
  | { status: "failed"; declined: string[] };

export type SavedState = {
  // A random name for this installation. It lets the log tell people apart
  // without knowing who anyone is.
  userId: string;
  introDone: boolean;
  about: FoodProfile | null; // what the person told Buddy; null until they do
  moments: FoodMoment[];
  buddy: Record<string, BuddyState>; // by moment id
  seenQuizIds: string[];
  // By moment id: the dates ("2026-10-05") on which the plan was done.
  checks: Record<string, string[]>;
};

function freshState(): SavedState {
  return {
    userId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    introDone: false,
    about: null,
    moments: [],
    buddy: {},
    seenQuizIds: [],
    checks: {},
  };
}

export async function loadState(): Promise<SavedState> {
  const text = await AsyncStorage.getItem(KEY);
  if (text === null) return freshState();

  const saved = JSON.parse(text) as SavedState;
  // A request that was running when the app closed never got its answer.
  // It comes back as "could not be reached", with "Try again".
  const buddy: Record<string, BuddyState> = {};
  for (const [id, state] of Object.entries(saved.buddy)) {
    buddy[id] = state.status === "thinking" ? { status: "failed", declined: state.declined } : state;
  }
  return { ...saved, buddy };
}

export async function saveState(state: SavedState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

// What Buddy knows after the person answered again: the new topic, and the
// new answers on top of the old ones. An answer to a question that was
// already answered replaces the old answer.
export function mergeProfile(current: FoodProfile | null, next: FoodProfile): FoodProfile {
  const asked = next.answers.map((each) => each.question);
  const kept = (current?.answers ?? []).filter((each) => !asked.includes(each.question));
  return { area: next.area, answers: [...kept, ...next.answers].slice(-MAX_ANSWERS) };
}
