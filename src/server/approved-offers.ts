import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";

import type { MomentDetails } from "@/shared/food-moment";
import type { FoodProfile } from "@/shared/offer";
import type { TinyHabit } from "@/shared/tiny-habit";
import { offerInput } from "./offer-input";

// The offers a person on the team chose in the lab as the right answer.
// They live next to the rules, one JSON object per line, because they are
// design material like the rules: they decide how Buddy answers, so they
// belong under version control (unlike data/, which is only a log).
const FILE = path.join(process.cwd(), "rules", "approved-offers.jsonl");

// How many approved offers go into the rule sheet: the newest ones. A model
// reads everything it is given on every request, so the list has to stay short.
const MAX_IN_RULE_SHEET = 12;

export type ApprovedOffer = {
  at: string;
  model: string; // which model wrote it, e.g. "gemma4:12b"
  moment: MomentDetails;
  about: FoodProfile | null;
  habit: TinyHabit;
};

export async function readApproved(): Promise<ApprovedOffer[]> {
  let text: string;
  try {
    text = await readFile(FILE, "utf8");
  } catch (error) {
    // No file yet simply means nothing was approved yet.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as ApprovedOffer);
}

export async function appendApproved(offer: ApprovedOffer): Promise<void> {
  await appendFile(FILE, JSON.stringify(offer) + "\n");
}

// The approved offers as a section of the rule sheet, in the same
// "Input / Buddy" form as the examples in rule 7.
export function approvedSection(approved: ApprovedOffer[]): string {
  if (approved.length === 0) return "";
  const examples = approved.slice(-MAX_IN_RULE_SHEET).map((each) => {
    const reply = JSON.stringify({ move: "propose", message: "", tinyHabits: [each.habit] });
    return `Input: ${offerInput(each.moment, each.about, [])}\nBuddy: ${reply}`;
  });
  return [
    "# 8 · Approved offers",
    "",
    "A person on the team chose each of these as the right offer for its input. They show what a good offer is here. Offer in this spirit. Reuse one only when the input is the same, and never when it is in `declined`.",
    "",
    examples.join("\n\n"),
  ].join("\n");
}
