import { MAX_ID_LENGTH } from "@/shared/checkin";
import { DAYS, type MomentDetails, MOMENT_KINDS, PLACES, SLOTS } from "@/shared/food-moment";
import { FOOD_AREAS, type FoodProfile, MAX_ANSWERS, MAX_ANSWER_LENGTH } from "@/shared/offer";
import { MAX_HABIT_LENGTH, type TinyHabit } from "@/shared/tiny-habit";

// Checks for what arrives at the server. TypeScript's types are gone at
// runtime, and anyone can send anything to a server, so every route checks
// its input with these before using it.

export function isId(value: string): boolean {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH;
}

export function isMoment(value: MomentDetails): value is MomentDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    MOMENT_KINDS.includes(value.kind) &&
    SLOTS.includes(value.slot) &&
    PLACES.includes(value.place) &&
    Array.isArray(value.days) &&
    value.days.length > 0 &&
    value.days.every((day) => DAYS.includes(day))
  );
}

export function isFoodProfile(value: FoodProfile): value is FoodProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    FOOD_AREAS.includes(value.area) &&
    Array.isArray(value.answers) &&
    value.answers.length <= MAX_ANSWERS &&
    value.answers.every(
      (each) =>
        typeof each === "object" &&
        each !== null &&
        isText(each.question, MAX_ANSWER_LENGTH) &&
        isText(each.answer, MAX_ANSWER_LENGTH),
    )
  );
}

export function isHabit(value: TinyHabit): value is TinyHabit {
  return (
    typeof value === "object" &&
    value !== null &&
    [value.anchor, value.behavior, value.why].every((text) => isText(text, MAX_HABIT_LENGTH))
  );
}

export function isText(value: string, maxLength: number): boolean {
  return typeof value === "string" && value.length <= maxLength;
}

// A list of short texts, such as the behaviors a person turned down.
export function isTextList(value: string[], maxItems: number): boolean {
  return Array.isArray(value) && value.length <= maxItems && value.every((text) => isText(text, MAX_HABIT_LENGTH));
}
