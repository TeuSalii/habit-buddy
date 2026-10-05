import { appendLog } from "@/server/log";
import { MODELS } from "@/server/models/registry";
import { offerForMoment } from "@/server/offer-for-moment";
import { loadOfferRuleSheet } from "@/server/rule-sheet";
import { isFoodProfile, isId, isMoment, isTextList } from "@/server/validate";
import { MAX_DECLINED, type OfferRequest } from "@/shared/offer";
import { MODEL_IDS } from "@/shared/tiny-habit";

// POST /api/offer  body: OfferRequest  →  OfferResponse
// Runs on the server only. The app never sees the API key.
export async function POST(request: Request) {
  const { userId, model, moment, about, declined } = (await request.json()) as OfferRequest;

  if (!isId(userId)) {
    return Response.json({ error: "userId must be a short text" }, { status: 400 });
  }
  if (!MODEL_IDS.includes(model)) {
    return Response.json({ error: `model must be one of: ${MODEL_IDS.join(", ")}` }, { status: 400 });
  }
  if (!isMoment(moment)) {
    return Response.json({ error: "moment must be a food moment with kind, slot, place and days" }, { status: 400 });
  }
  if (about !== null && !isFoodProfile(about)) {
    return Response.json({ error: "about must be null or { area, answers } with short question and answer texts" }, { status: 400 });
  }
  if (!isTextList(declined, MAX_DECLINED)) {
    return Response.json({ error: `declined must be a list of at most ${MAX_DECLINED} short texts` }, { status: 400 });
  }

  // The rules, plus the offers approved in the lab.
  const rules = await loadOfferRuleSheet();
  const result = await offerForMoment(model, moment, about, declined, rules.text);
  await appendLog({
    type: "offer",
    at: new Date().toISOString(),
    userId,
    model: MODELS[model].name,
    rulesVersion: rules.version,
    moment,
    about,
    declined,
    result,
  });

  return Response.json(result);
}
