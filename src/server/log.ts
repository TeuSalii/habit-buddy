import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

import type { FoodMoment, MomentDetails } from "@/shared/food-moment";
import type { FoodProfile, OfferResponse } from "@/shared/offer";
import type { ChatTurn, Rating, SplitResult, TinyHabit } from "@/shared/tiny-habit";

// Every exchange and every rating becomes one line of JSON in data/log.jsonl.
// This file is the training data. It holds what people type, so it's
// git-ignored and stays on this machine. Works in development only
// (hosted servers have no writable disk).
const LOG_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "log.jsonl");

export type LogEvent =
  | {
      type: "exchange";
      exchangeId: string;
      at: string;
      model: string;
      rulesVersion: string; // matches data/rules/<rulesVersion>.md
      turns: ChatTurn[];
      result: SplitResult;
    }
  | { type: "rating"; exchangeId: string; at: string; rating: Rating }
  | {
      type: "offer";
      at: string;
      userId: string;
      model: string;
      rulesVersion: string;
      moment: FoodMoment;
      about: FoodProfile | null;
      declined: string[];
      focus: string | null;
      result: OfferResponse;
    }
  // A check-off under a plan: this person did (done) or un-ticked (not done)
  // this habit on this day.
  | {
      type: "checkin";
      at: string;
      userId: string;
      momentId: string;
      habit: TinyHabit;
      date: string;
      done: boolean;
    }
  // A round in the developer lab: the statement, the suggestions the model
  // made for it, and which one a person chose (null: none of them fit).
  | {
      type: "lab-choice";
      at: string;
      model: string;
      rulesVersion: string;
      moment: MomentDetails;
      about: FoodProfile | null;
      suggestions: TinyHabit[];
      chosen: number | null;
      note: string;
    };

export async function appendLog(event: LogEvent) {
  await mkdir(LOG_DIR, { recursive: true });
  await appendFile(LOG_FILE, JSON.stringify(event) + "\n");
}
