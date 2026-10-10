import type { FoodMoment } from "@/shared/food-moment";
import type { ModelId, TinyHabit } from "@/shared/tiny-habit";

// The contract for Buddy's offer: the app sends a food moment and what the
// person told Buddy about themselves; the server answers with one tiny habit.

// The part of their food life the person wants to work on. They choose it
// themselves: a change you picked is one you are more likely to keep.
export const FOOD_AREAS = ["waste", "shopping", "cooking", "plate", "on_the_go", "other", "not_sure"] as const;
export type FoodArea = (typeof FOOD_AREAS)[number];

// One thing the person told Buddy about themselves: the question as it was
// asked, and their answer (an option they tapped, or their own words).
export type SelfAnswer = { question: string; answer: string };

// What Buddy knows about the person. A list of answers, so more questions
// can be added over time without changing this shape.
export type FoodProfile = { area: FoodArea; answers: SelfAnswer[] };

export const MAX_ANSWERS = 20;
export const MAX_ANSWER_LENGTH = 200;

export type OfferRequest = {
  userId: string; // the random name of this installation, for the log
  model: ModelId;
  moment: FoodMoment;
  // null: the person skipped the introduction, so Buddy must not assume anything.
  about: FoodProfile | null;
  // Behaviors the person already turned down for this moment,
  // so Buddy offers something different.
  declined: string[];
  // A theme the person asked an idea about (from a quiz question), or null.
  focus: string | null;
};

export const MAX_FOCUS_LENGTH = 200;

// Buddy either offers a tiny habit, or says that this is not something it
// can help with (the scope rules in rules/5-guardrails.md).
export type OfferResponse = { kind: "offer"; offer: TinyHabit } | { kind: "decline"; message: string };

// After this many "not for me", Buddy stops offering for the moment.
export const MAX_DECLINED = 5;
