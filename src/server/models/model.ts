import type { Move, TinyHabit } from "@/shared/tiny-habit";

// What every model has to provide. The rest of the server only knows this
// shape, so swapping Claude for Gemma (or your own fine-tuned model later)
// never touches anything else.

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ModelClient = {
  name: string; // logged with every answer, e.g. "gemma4:12b"
  // Returns the raw JSON text the model produced.
  generate: (rules: string, messages: ChatMessage[]) => Promise<string>;
};

// The JSON every model must return. Flat on purpose: one object shape is the
// easiest for any model to follow; split-habit.ts turns it into our typed union.
export type ModelOutput = { move: Move; message: string; tinyHabits: TinyHabit[] };

export const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    move: { type: "string", enum: ["ask", "propose", "revise", "decline"] },
    message: { type: "string" },
    tinyHabits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          anchor: { type: "string" },
          behavior: { type: "string" },
          why: { type: "string" },
        },
        required: ["anchor", "behavior", "why"],
        additionalProperties: false,
      },
    },
  },
  required: ["move", "message", "tinyHabits"],
  additionalProperties: false,
} as const;
