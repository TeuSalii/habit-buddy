import type { MomentDetails } from "@/shared/food-moment";
import type { FoodProfile, OfferResponse } from "@/shared/offer";
import type { ModelId } from "@/shared/tiny-habit";
import type { ModelOutput } from "./models/model";
import { MODELS } from "./models/registry";
import { offerInput } from "./offer-input";

// Buddy's offer: one tiny habit for one food moment (rules/7-food-offers.md).
export async function offerForMoment(
  id: ModelId,
  moment: MomentDetails,
  about: FoodProfile | null,
  declined: string[],
  focus: string | null,
  rules: string,
): Promise<OfferResponse> {
  const input = offerInput(moment, about, declined, focus);

  const text = await MODELS[id].generate(rules, [{ role: "user", content: input }]);
  const output = JSON.parse(text) as ModelOutput;

  // The person's own words can touch something Buddy must not coach
  // (rules S1–S4). Then the answer is a message, not a habit.
  if (output.move === "decline") {
    if (output.message.trim() === "") {
      throw new Error('Move "decline" came without a message');
    }
    return { kind: "decline", message: output.message };
  }

  // Otherwise an offer is exactly one proposal. Anything else is a broken
  // answer, and it fails loudly here instead of reaching the app.
  if (output.move !== "propose" || output.tinyHabits.length !== 1) {
    throw new Error(`Expected one proposed tiny habit, got "${output.move}" with ${output.tinyHabits.length}`);
  }
  return { kind: "offer", offer: output.tinyHabits[0] };
}
