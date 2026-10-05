import { appendLog } from "@/server/log";
import { CHAT_RULES, loadRuleSheet } from "@/server/rule-sheet";
import { modelName, splitHabit } from "@/server/split-habit";
import { MAX_HABIT_LENGTH, MAX_TURNS, MODEL_IDS, type SplitRequest, type SplitResponse } from "@/shared/tiny-habit";

// POST /api/split  body: SplitRequest  →  SplitResponse
// Runs on the server only. The app never sees the API key.
export async function POST(request: Request) {
  const { model, turns } = (await request.json()) as SplitRequest;

  if (!MODEL_IDS.includes(model)) {
    return Response.json({ error: `model must be one of: ${MODEL_IDS.join(", ")}` }, { status: 400 });
  }
  if (!Array.isArray(turns) || turns.length === 0 || turns.length > MAX_TURNS) {
    return Response.json({ error: `Body must be { turns } with 1–${MAX_TURNS} turns` }, { status: 400 });
  }
  const last = turns[turns.length - 1];
  if (last.role !== "user" || last.text.trim() === "") {
    return Response.json({ error: "The last turn must be a non-empty user message" }, { status: 400 });
  }
  if (turns.some((t) => t.role === "user" && t.text.length > MAX_HABIT_LENGTH)) {
    return Response.json({ error: `Messages are limited to ${MAX_HABIT_LENGTH} characters` }, { status: 400 });
  }

  const rules = await loadRuleSheet(CHAT_RULES);
  const result = await splitHabit(model, turns, rules.text);
  const exchangeId = crypto.randomUUID();
  await appendLog({
    type: "exchange",
    exchangeId,
    at: new Date().toISOString(),
    model: modelName(model),
    rulesVersion: rules.version,
    turns,
    result,
  });

  const body: SplitResponse = { exchangeId, result };
  return Response.json(body);
}
