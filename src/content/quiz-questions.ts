// The quiz questions. This file is the question bank: to add a question,
// add an entry. The quiz picks one the person has not seen yet.
//
// Every entry needs a source that was actually checked, and the numbers have
// to hold for Switzerland (or the question has to say "worldwide"). A quiz
// that teaches something false does more harm than no quiz. The same goes
// for what a named person said or did: only what the source reports.

type Shared = {
  id: string;
  question: string;
  reveal: string; // one or two sentences shown with the answer
  source: string;
};

// A guess at a number. The answer is shown as two bars: the guess and reality.
export type NumberQuestion = Shared & {
  kind: "number";
  options: number[]; // the guesses on offer, lowest first
  answer: number; // must be one of the options
  // How a number is shown: prefix + number + suffix, e.g. "CHF 600" or "80 kg".
  prefix: string;
  suffix: string;
};

// A choice between statements, for facts that are not a number.
export type ChoiceQuestion = Shared & {
  kind: "choice";
  options: string[];
  answer: string; // must be one of the options
};

export type QuizQuestion = NumberQuestion | ChoiceQuestion;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    kind: "number",
    id: "waste-kg",
    question: "How much food does one person in Switzerland throw away at home in a year?",
    options: [30, 80, 130],
    answer: 80,
    prefix: "",
    suffix: " kg",
    reveal: "About 80 kg per person, every year. That is food worth around CHF 600.",
    source: "ZHAW and BAFU, food loss monitoring 2025",
  },
  {
    kind: "number",
    id: "waste-chf",
    question: "What is the food worth that one person in Switzerland throws away at home in a year?",
    options: [150, 350, 600],
    answer: 600,
    prefix: "CHF ",
    suffix: "",
    reveal: "Around CHF 600 per person, every year. That is about CHF 12 a week.",
    source: "ZHAW and BAFU, food loss monitoring 2025",
  },
  {
    kind: "number",
    id: "chain-kg",
    question: "From field to plate, how much food is lost per person in Switzerland in a year?",
    options: [110, 210, 310],
    answer: 310,
    prefix: "",
    suffix: " kg",
    reveal: "About 310 kg per person across the whole chain. Around 80 kg of that happens at home.",
    source: "ZHAW and BAFU, food loss monitoring 2025",
  },
  {
    kind: "number",
    id: "meat-kg",
    question: "How much meat does one person in Switzerland eat in a year?",
    options: [25, 50, 75],
    answer: 50,
    prefix: "",
    suffix: " kg",
    reveal: "About 50 kg per person a year. That is close to a kilo a week.",
    source: "Proviande, 2022",
  },
  {
    kind: "number",
    id: "beef-vs-peas",
    question: "Worldwide, producing 1 kg of beef causes how many times the greenhouse gases of 1 kg of peas?",
    options: [6, 20, 60],
    answer: 60,
    prefix: "",
    suffix: " times",
    reveal: "About 60 times, as a world average. Swiss beef is lower, but still many times above peas.",
    source: "Poore and Nemecek 2018; WWF Schweiz",
  },
  {
    kind: "number",
    id: "lentil-protein",
    question: "How much protein is in 100 g of dried red lentils?",
    options: [6, 12, 24],
    answer: 24,
    prefix: "",
    suffix: " g",
    reveal: "About 24 g, close to a quarter of their weight. Cooked lentils hold water, so 100 g on the plate has less.",
    source: "Thünen-Institut, from the German food composition database (BLS)",
  },
  {
    kind: "choice",
    id: "hamilton-2017",
    question: "In 2017, Formula 1 world champion Lewis Hamilton changed how he eats. To what?",
    options: ["Mostly fish", "Plant-based", "Meat with every meal"],
    answer: "Plant-based",
    reveal: "He switched to a plant-based diet in 2017, and said two years later that he felt much better with it.",
    source: "F1i.com, 8 December 2019",
  },
];

// A question the person has not seen yet. Once they have seen them all,
// any question may come again.
export function pickQuiz(seenIds: string[]): QuizQuestion {
  const unseen = QUIZ_QUESTIONS.filter((question) => !seenIds.includes(question.id));
  const pool = unseen.length > 0 ? unseen : QUIZ_QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}
