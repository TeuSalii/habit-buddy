import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { approvedSection, readApproved } from "./approved-offers";

// Model v0 = an LLM + the rule sheet in /rules. The rule sheet is design
// material: edit the markdown files, and the next message uses them
// (they're read fresh on every request, no restart needed).

const RULES_DIR = path.join(process.cwd(), "rules");
const SNAPSHOT_DIR = path.join(process.cwd(), "data", "rules");

// Explicit lists: the order is the order the model reads them in,
// and a missing file fails loudly instead of being skipped.

// The conversation in the test lab: a person describes a habit, Buddy answers.
export const CHAT_RULES = [
  "1-purpose.md",
  "2-moves.md",
  "3-behavior-science.md",
  "4-voice.md",
  "5-guardrails.md",
  "6-examples.md",
];

// Buddy's offer for a food moment: there is no conversation, so the rules
// about moves and the chat examples are left out and "7" takes their place.
export const OFFER_RULES = ["3-behavior-science.md", "4-voice.md", "5-guardrails.md", "7-food-offers.md"];

export type RuleSheet = { text: string; version: string };

export async function loadRuleSheet(files: readonly string[]): Promise<RuleSheet> {
  return toRuleSheet(await readRules(files));
}

// The rule sheet for Buddy's offers: the rule files, followed by the offers
// a person on the team approved in the lab. This is how the lab reaches the
// real app: every approved offer is shown to the model with each request.
export async function loadOfferRuleSheet(): Promise<RuleSheet> {
  const [rules, approved] = await Promise.all([readRules(OFFER_RULES), readApproved()]);
  const section = approvedSection(approved);
  return toRuleSheet(section === "" ? rules : `${rules}\n\n${section}`);
}

async function readRules(files: readonly string[]): Promise<string> {
  const parts = await Promise.all(files.map((file) => readFile(path.join(RULES_DIR, file), "utf8")));
  return parts.join("\n\n");
}

async function toRuleSheet(text: string): Promise<RuleSheet> {
  // The version is a fingerprint of the text itself: any edit gives a new
  // version automatically, so it can never be forgotten.
  const version = createHash("sha256").update(text).digest("hex").slice(0, 8);
  await snapshot(text, version);
  return { text, version };
}

// Keep a copy of every version, so a logged answer can always be traced
// back to the exact rules that produced it.
async function snapshot(text: string, version: string) {
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  await writeFile(path.join(SNAPSHOT_DIR, `${version}.md`), text, { flag: "w" });
}
