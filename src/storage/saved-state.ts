import AsyncStorage from "@react-native-async-storage/async-storage";

import type { FoodMoment } from "@/shared/food-moment";
import { OWN_TOPIC } from "@/content/self-questions";
import { type FoodProfile, MAX_ANSWERS } from "@/shared/offer";
import type { TinyHabit } from "@/shared/tiny-habit";

// Everything the app remembers, kept on the phone. There is no account and
// no server database: the data stays on this device, under one key, as one
// piece of JSON. That is the simplest database there is, and enough for now.
//
// Several people can use the app on one phone (for testing with different
// people in mind). Each has their own SavedState; the Store holds all of
// them and says who is using the app right now. Switching person changes
// only `activeId`, so nobody's data is ever removed by it.

// The key carries a version: v1 held one person, v2 holds the Store.
const KEY = "happy-habits-buddy:v2";
const KEY_V1 = "happy-habits-buddy:v1";

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
  // A random id for this person. It lets the log tell people apart without
  // knowing who anyone is. The name below never leaves the phone.
  userId: string;
  name: string; // what this person is called on this phone; they can change it
  introDone: boolean;
  about: FoodProfile | null; // what the person told Buddy; null until they do
  moments: FoodMoment[];
  buddy: Record<string, BuddyState>; // by moment id
  seenQuizIds: string[];
  // By moment id: the dates ("2026-10-05") on which the plan was done.
  checks: Record<string, string[]>;
};

export type Store = {
  activeId: string; // the userId of the person using the app right now
  users: SavedState[];
};

// A new person on this phone: nothing known yet, and a new random id.
export function newUser(name: string): SavedState {
  return {
    userId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    name,
    introDone: false,
    about: null,
    moments: [],
    buddy: {},
    seenQuizIds: [],
    checks: {},
  };
}

// The person using the app right now. The Store always has one.
export function activeUser(store: Store): SavedState {
  const user = store.users.find((each) => each.userId === store.activeId);
  if (user === undefined) throw new Error(`No stored user with the id ${store.activeId}`);
  return user;
}

export async function loadStore(): Promise<Store> {
  const text = await AsyncStorage.getItem(KEY);
  if (text !== null) {
    const store = JSON.parse(text) as Store;
    return { ...store, users: store.users.map(settle) };
  }

  // Nothing stored in today's shape. If the phone still holds the one
  // person from before there were several, they become the first user, so
  // nothing they did is lost. Otherwise this is the very first start.
  const v1 = await AsyncStorage.getItem(KEY_V1);
  const first = v1 === null ? newUser("User 1") : settle({ ...JSON.parse(v1), name: "User 1" });
  return { activeId: first.userId, users: [first] };
}

export async function saveStore(store: Store): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(store));
}

// A request that was running when the app closed never got its answer.
// It comes back as "could not be reached", with "Try again".
function settle(user: SavedState): SavedState {
  const buddy: Record<string, BuddyState> = {};
  for (const [id, state] of Object.entries(user.buddy)) {
    buddy[id] = state.status === "thinking" ? { status: "failed", declined: state.declined } : state;
  }
  return { ...user, buddy };
}

// What Buddy knows after the person answered again: the new topic, and the
// new answers on top of the old ones. An answer to a question that was
// already answered replaces the old answer.
export function mergeProfile(current: FoodProfile | null, next: FoodProfile): FoodProfile {
  const asked = next.answers.map((each) => each.question);
  const kept = (current?.answers ?? []).filter((each) => !asked.includes(each.question));
  return { area: next.area, answers: [...kept, ...next.answers].slice(-MAX_ANSWERS) };
}

// What Buddy knows after the person took one answer back. Without the
// answer that describes their own topic, "Something else" would mean
// nothing, so the topic then becomes "not sure".
export function forgetAnswer(about: FoodProfile, question: string): FoodProfile {
  const lostOwnTopic = about.area === "other" && question === OWN_TOPIC.question;
  return {
    area: lostOwnTopic ? "not_sure" : about.area,
    answers: about.answers.filter((each) => each.question !== question),
  };
}
