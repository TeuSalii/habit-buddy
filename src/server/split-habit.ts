import type { ChatTurn, ModelId, SplitResult } from "@/shared/tiny-habit";
import type { ChatMessage, ModelOutput } from "./models/model";
import { MODELS } from "./models/registry";

const MAX_TINY_HABITS = 2;

export function modelName(id: ModelId): string {
  return MODELS[id].name;
}

export async function splitHabit(id: ModelId, turns: ChatTurn[], rules: string): Promise<SplitResult> {
  const text = await MODELS[id].generate(rules, turns.map(toChatMessage));
  return toSplitResult(JSON.parse(text) as ModelOutput);
}

// The schema can't enforce which fields each move fills, so we check here
// and fail loudly: a broken answer never reaches the app.
function toSplitResult(output: ModelOutput): SplitResult {
  if (output.move === "ask" || output.move === "decline") {
    if (output.message.trim() === "") {
      throw new Error(`Move "${output.move}" came without a message`);
    }
    return { move: output.move, message: output.message };
  }
  const count = output.tinyHabits.length;
  if (count === 0 || count > MAX_TINY_HABITS) {
    throw new Error(`Expected 1–${MAX_TINY_HABITS} tiny habits, got ${count}`);
  }
  return { move: output.move, tinyHabits: output.tinyHabits, note: output.message };
}

// Earlier answers go back to the model in the same JSON shape it produced,
// so it recognizes its own replies.
function toChatMessage(turn: ChatTurn): ChatMessage {
  if (turn.role === "user") {
    return { role: "user", content: turn.text };
  }
  return { role: "assistant", content: JSON.stringify(toModelOutput(turn.result)) };
}

function toModelOutput(result: SplitResult): ModelOutput {
  if ("tinyHabits" in result) {
    return { move: result.move, message: result.note, tinyHabits: result.tinyHabits };
  }
  return { move: result.move, message: result.message, tinyHabits: [] };
}
