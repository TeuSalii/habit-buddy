import { DAYS, type Day, type MomentKind, type Place, type Slot } from "@/shared/food-moment";

// The words and icons the person sees for each value. Kept out of the
// contract (src/shared), because wording is a concern of the screen, not
// the data. Icons are emoji for now: no image files, no licences, and they
// are easy to replace with your own illustrations later.

export const KIND_LABEL: Record<MomentKind, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  shopping: "Shopping",
  cooking: "Cooking",
  packing_food: "Packing food",
};

export const KIND_ICON: Record<MomentKind, string> = {
  breakfast: "🥣",
  lunch: "🥪",
  dinner: "🍝",
  snack: "🍎",
  shopping: "🛒",
  cooking: "🍳",
  packing_food: "🥡",
};

export const SLOT_LABEL: Record<Slot, string> = {
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  evening: "Evening",
};

export const SLOT_ICON: Record<Slot, string> = {
  morning: "🌅",
  midday: "☀️",
  afternoon: "🌤️",
  evening: "🌙",
};

// The same value as it reads inside a sentence.
export const SLOT_PHRASE: Record<Slot, string> = {
  morning: "in the morning",
  midday: "at midday",
  afternoon: "in the afternoon",
  evening: "in the evening",
};

export const PLACE_LABEL: Record<Place, string> = {
  home: "At home",
  work_or_school: "At work or school",
  shop: "In the shop",
  on_the_way: "On the way",
};

export const PLACE_ICON: Record<Place, string> = {
  home: "🏠",
  work_or_school: "🏫",
  shop: "🏪",
  on_the_way: "🚆",
};

export const PLACE_PHRASE: Record<Place, string> = {
  home: "at home",
  work_or_school: "at work or school",
  shop: "in the shop",
  on_the_way: "on the way",
};

export const DAY_LABEL: Record<Day, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

// Sets of days people think in. They are shortcuts in the form and
// shorter wording on the map ("Weekdays" instead of five day names).
export type DayGroup = { label: string; phrase: string; days: readonly Day[] };

export const DAY_GROUPS: readonly DayGroup[] = [
  { label: "Every day", phrase: "every day", days: DAYS },
  { label: "Weekdays", phrase: "on weekdays", days: ["mon", "tue", "wed", "thu", "fri"] },
  { label: "Weekend", phrase: "at the weekend", days: ["sat", "sun"] },
];

// The group that is exactly these days, if there is one.
export function groupOf(days: readonly Day[]): DayGroup | undefined {
  return DAY_GROUPS.find(
    (group) => group.days.length === days.length && group.days.every((day) => days.includes(day)),
  );
}

// The days listed in week order: "Wed, Sat".
function listDays(days: readonly Day[]): string {
  return DAYS.filter((day) => days.includes(day))
    .map((day) => DAY_LABEL[day])
    .join(", ");
}

// For the map: "Every day", "Weekdays", "Weekend" or "Wed, Sat".
export function describeDays(days: readonly Day[]): string {
  return groupOf(days)?.label ?? listDays(days);
}

// For a sentence: "every day", "on weekdays" or "on Wed, Sat".
export function daysPhrase(days: readonly Day[]): string {
  return groupOf(days)?.phrase ?? `on ${listDays(days)}`;
}
