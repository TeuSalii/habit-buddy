// One entry on the day map: a moment in the week when food happens.
// Part of the app↔server contract, because Buddy will later attach its
// offers to these moments (the moment is the anchor of a tiny habit).

// The routine. Chosen from a short list instead of typed, so adding a
// moment takes taps only and Buddy always knows what kind of moment it is.
export const MOMENT_KINDS = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "shopping",
  "cooking",
  "packing_food",
] as const;
export type MomentKind = (typeof MOMENT_KINDS)[number];

// The position on the timeline. A part of the day, not a clock time:
// a habit is anchored to the event, the slot only orders the map and
// later tells Buddy roughly when the moment comes up.
export const SLOTS = ["morning", "midday", "afternoon", "evening"] as const;
export type Slot = (typeof SLOTS)[number];

// The place decides what is possible there (no cooking swap in a canteen).
export const PLACES = ["home", "work_or_school", "shop", "on_the_way"] as const;
export type Place = (typeof PLACES)[number];

// The days the moment happens. An anchor has to occur as often as the
// habit should: lunch is daily, shopping may be once a week.
export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];

export type FoodMoment = {
  id: string;
  kind: MomentKind;
  slot: Slot;
  place: Place;
  days: Day[]; // at least one
};

// The moment without its id: what the person decides when they add one.
export type MomentDetails = Omit<FoodMoment, "id">;
