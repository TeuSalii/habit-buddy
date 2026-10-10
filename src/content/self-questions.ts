import type { FoodArea } from "@/shared/offer";

// The topics a person can choose to work on, and the questions about
// themselves for each topic. Like the quiz, this is a bank: adding a topic
// or a question happens here, not in the screen's code.
//
// One question is asked per visit, the first one the person has not
// answered yet. So each visit adds something, and a topic is "complete"
// only after several visits.

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

export type SelfQuestion = {
  question: string;
  short: string; // the question in a few words, for the summary of what Buddy knows
  options: string[];
};

// This one has a name, because the quiz looks at its answer: an idea about
// eating less meat is only offered to someone who said they eat meat.
export const MEAT_ANSWERS = ["Meat most days", "Meat sometimes"];
export const HOW_I_EAT: SelfQuestion = {
  question: "How do you eat?",
  short: "Way of eating",
  options: [...MEAT_ANSWERS, "Vegetarian", "Vegan"],
};

// Named, because without its answer the topic "Something else" says nothing.
export const OWN_TOPIC: SelfQuestion = {
  question: "What would you like to change around food?",
  short: "Own topic",
  options: [],
};

// "not_sure" has no questions on purpose: nothing to answer, Buddy starts
// with throwing less away. "other" has no options: only the person's words.
export const SELF_QUESTIONS: Record<Exclude<FoodArea, "not_sure">, SelfQuestion[]> = {
  waste: [
    {
      question: "How often does food end up in the bin at your place?",
      short: "Food in the bin",
      options: ["Almost never", "Now and then", "Every week", "Most days"],
    },
    {
      question: "What gets thrown away most at your place?",
      short: "Thrown away most",
      options: ["Bread", "Fruit and vegetables", "Leftovers from cooking", "Dairy"],
    },
    {
      question: "When food gets thrown away, what is usually the reason?",
      short: "Why food gets thrown away",
      options: ["We bought too much", "It was forgotten", "We cooked too much", "Nobody felt like eating it"],
    },
  ],
  shopping: [
    {
      question: "How do you usually shop for food?",
      short: "Shopping",
      options: ["With a list", "I decide in the shop", "Small trips most days", "One big shop a week"],
    },
    {
      question: "Before you go shopping, do you look at what is still at home?",
      short: "Checks what is at home before shopping",
      options: ["Always", "Sometimes", "Rarely"],
    },
    {
      question: "What decides most what goes into your basket?",
      short: "What decides the basket",
      options: ["The price", "What I feel like", "What is in season", "What I planned to cook"],
    },
  ],
  cooking: [
    {
      question: "What usually happens to leftovers at your place?",
      short: "Leftovers",
      options: ["We eat them the next day", "They get forgotten in the fridge", "There are rarely any", "They get thrown away"],
    },
    {
      question: "How often do you cook at home?",
      short: "Cooking at home",
      options: ["Most days", "A few times a week", "Rarely"],
    },
    {
      question: "Who do you usually cook for?",
      short: "Cooks for",
      options: ["Just me", "Two of us", "Family or flatmates"],
    },
  ],
  plate: [
    HOW_I_EAT,
    {
      question: "How often do you eat pulses like lentils, beans or chickpeas?",
      short: "Lentils, beans, chickpeas",
      options: ["Almost never", "Now and then", "Every week", "Most days"],
    },
    {
      question: "Do you know which fruit and vegetables are in season right now?",
      short: "Knows what is in season",
      options: ["Yes, mostly", "For a few", "Not really"],
    },
  ],
  on_the_go: [
    {
      question: "How often do you eat out or on the go?",
      short: "Eating out or on the go",
      options: ["Almost never", "A few times a week", "Most days"],
    },
    {
      question: "What do you usually do for lunch on work or school days?",
      short: "Lunch on work or school days",
      options: ["Bring food from home", "Canteen", "Buy something on the way"],
    },
    {
      question: "When you can't finish a meal while eating out, what happens to it?",
      short: "Unfinished meals when eating out",
      options: ["I take it with me", "It stays on the plate", "That rarely happens"],
    },
  ],
  other: [OWN_TOPIC],
};

// The question a stored answer belongs to. An answer is stored with the
// question's text; if that text is no longer in the bank (the wording was
// changed since), the answer is still shown, as a question without options.
export function questionFor(text: string): SelfQuestion {
  const all = Object.values(SELF_QUESTIONS).flat();
  return all.find((each) => each.question === text) ?? { question: text, short: text, options: [] };
}
