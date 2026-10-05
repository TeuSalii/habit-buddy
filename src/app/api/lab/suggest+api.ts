import { readApproved } from "@/server/approved-offers";
import { loadOfferRuleSheet } from "@/server/rule-sheet";
import { suggestOffers } from "@/server/suggest-offers";
import { isFoodProfile, isMoment, isTextList } from "@/server/validate";
import { type LabSuggestRequest, type LabSuggestResponse, MAX_AVOID } from "@/shared/lab";
import { MODEL_IDS } from "@/shared/tiny-habit";

// POST /api/lab/suggest  body: LabSuggestRequest  →  LabSuggestResponse
// Developer lab only: three candidate offers for one statement.
export async function POST(request: Request) {
  const { model, moment, about, avoid } = (await request.json()) as LabSuggestRequest;

  if (!MODEL_IDS.includes(model)) {
    return Response.json({ error: `model must be one of: ${MODEL_IDS.join(", ")}` }, { status: 400 });
  }
  if (!isMoment(moment)) {
    return Response.json({ error: "moment must have kind, slot, place and days" }, { status: 400 });
  }
  if (about !== null && !isFoodProfile(about)) {
    return Response.json({ error: "about must be null or { area, answers }" }, { status: 400 });
  }
  if (!isTextList(avoid, MAX_AVOID)) {
    return Response.json({ error: `avoid must be a list of at most ${MAX_AVOID} short texts` }, { status: 400 });
  }

  const rules = await loadOfferRuleSheet();
  const result = await suggestOffers(model, moment, about, avoid, rules.text);
  const body: LabSuggestResponse = {
    ...result,
    rulesVersion: rules.version,
    approvedCount: (await readApproved()).length,
  };
  return Response.json(body);
}
