// The contract between app and server. Both sides import this file,
// so it must never contain anything secret.

export type TinyHabit = {
  anchor: string; // an existing routine that triggers it: "After I pour my morning coffee"
  behavior: string; // the tiny action: "I will read one page"
  why: string; // one plain sentence on why this works
};

// The four moves Buddy can make (see rules/2-moves.md).
export type Move = "ask" | "propose" | "revise" | "decline";

export type SplitResult =
  // note: usually empty; carries support info for harmful habits (rules A1–A3)
  | { move: "propose" | "revise"; tinyHabits: TinyHabit[]; note: string }
  | { move: "ask" | "decline"; message: string };

export const MAX_HABIT_LENGTH = 500;

// ---- Chat (test lab) ----

// One turn of the conversation, as the app sends it to the server.
export type ChatTurn =
  | { role: "user"; text: string }
  | { role: "assistant"; result: SplitResult };

// The models the lab can talk to. One model per conversation.
export const MODEL_IDS = ["claude", "gemma"] as const;
export type ModelId = (typeof MODEL_IDS)[number];

export type SplitRequest = { model: ModelId; turns: ChatTurn[] };

// exchangeId links a rating back to the exact answer it rates.
export type SplitResponse = { exchangeId: string; result: SplitResult };

export type Rating = "helpful" | "not_helpful";

export type FeedbackRequest = { exchangeId: string; rating: Rating };

export const MAX_TURNS = 20;
