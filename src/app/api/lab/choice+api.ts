import { appendApproved, readApproved } from "@/server/approved-offers";
import { appendLog } from "@/server/log";
import { MODELS } from "@/server/models/registry";
import { SUGGESTION_COUNT } from "@/server/suggest-offers";
import { isFoodProfile, isHabit, isMoment, isText } from "@/server/validate";
import { type LabChoiceRequest, type LabChoiceResponse, MAX_NOTE_LENGTH } from "@/shared/lab";
import { MODEL_IDS } from "@/shared/tiny-habit";

// POST /api/lab/choice  body: LabChoiceRequest  →  LabChoiceResponse
// Developer lab only: records which of the suggestions is the right one.
// A chosen suggestion is added to the approved offers, and from the next
// request on it is part of the rule sheet the app uses.
export async function POST(request: Request) {
  const { model, rulesVersion, moment, about, suggestions, chosen, note } = (await request.json()) as LabChoiceRequest;

  if (!MODEL_IDS.includes(model)) {
    return Response.json({ error: `model must be one of: ${MODEL_IDS.join(", ")}` }, { status: 400 });
  }
  if (!isMoment(moment)) {
    return Response.json({ error: "moment must have kind, slot, place and days" }, { status: 400 });
  }
  if (about !== null && !isFoodProfile(about)) {
    return Response.json({ error: "about must be null or { area, answers }" }, { status: 400 });
  }
  if (!Array.isArray(suggestions) || suggestions.length !== SUGGESTION_COUNT || !suggestions.every(isHabit)) {
    return Response.json({ error: `suggestions must be ${SUGGESTION_COUNT} tiny habits` }, { status: 400 });
  }
  if (chosen !== null && !(Number.isInteger(chosen) && chosen >= 0 && chosen < suggestions.length)) {
    return Response.json({ error: "chosen must be the position of a suggestion, or null" }, { status: 400 });
  }
  if (!isText(rulesVersion, 16) || !isText(note, MAX_NOTE_LENGTH)) {
    return Response.json({ error: "rulesVersion and note must be short texts" }, { status: 400 });
  }

  const at = new Date().toISOString();
  if (chosen !== null) {
    await appendApproved({ at, model: MODELS[model].name, moment, about, habit: suggestions[chosen] });
  }
  // The log keeps everything, also the suggestions that were not chosen and
  // the rounds where none fit: that is the material for fine-tuning later.
  await appendLog({ type: "lab-choice", at, model: MODELS[model].name, rulesVersion, moment, about, suggestions, chosen, note });

  const body: LabChoiceResponse = { approvedCount: (await readApproved()).length };
  return Response.json(body);
}
