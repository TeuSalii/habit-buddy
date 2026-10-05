import type { FoodArea } from "@/shared/offer";

// The topics a person can choose to work on, and one question about
// themselves for each topic. Like the quiz, this is a bank: adding a topic
// or changing a question happens here, not in the screen's code.

export type Topic = { area: FoodArea; label: string; icon: string };

export const TOPICS: Topic[] = [
  { area: "waste", label: "Throwing less away", icon: "🗑️" },
  { area: "shopping", label: "How I shop", icon: "🛒" },
  { area: "cooking", label: "Cooking and leftovers", icon: "🍳" },
  { area: "plate", label: "What I eat", icon: "🍽️" },
  { area: "on_the_go", label: "Eating out and on the go", icon: "🥡" },
  { area: "other", label: "Something else", icon: "✏️" },
  { area: "not_sure", label: "I'm not sure yet", icon: "🤔" },
];

export type SelfQuestion = { question: string; options: string[] };

// "not_sure" has no question on purpose: nothing to answer, Buddy starts
// with throwing less away. "other" has no options: only the person's words.
export const SELF_QUESTIONS: Record<Exclude<FoodArea, "not_sure">, SelfQuestion> = {
  waste: {
    question: "How often does food end up in the bin at your place?",
    options: ["Almost never", "Now and then", "Every week", "Most days"],
  },
  shopping: {
    question: "How do you usually shop for food?",
    options: ["With a list", "I decide in the shop", "Small trips most days", "One big shop a week"],
  },
  cooking: {
    question: "What usually happens to leftovers at your place?",
    options: ["We eat them the next day", "They get forgotten in the fridge", "There are rarely any", "They get thrown away"],
  },
  plate: {
    question: "How do you eat?",
    options: ["Meat most days", "Meat sometimes", "Vegetarian", "Vegan"],
  },
  on_the_go: {
    question: "How often do you eat out or on the go?",
    options: ["Almost never", "A few times a week", "Most days"],
  },
  other: {
    question: "What would you like to change around food?",
    options: [],
  },
};
