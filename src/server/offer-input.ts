import type { MomentDetails } from "@/shared/food-moment";
import type { FoodProfile } from "@/shared/offer";

// The text the model receives for an offer, as rules/7-food-offers.md
// describes it. One function builds it everywhere (the app's offer, the
// lab, and the approved examples in the rule sheet), so the model always
// sees the same shape.
export function offerInput(moment: MomentDetails, about: FoodProfile | null, declined: string[]): string {
  // We pick the fields ourselves instead of passing the objects through:
  // the model sees exactly what rule 7 describes, and nothing else.
  const { kind, slot, place, days } = moment;
  return JSON.stringify({
    moment: { kind, slot, place, days },
    about:
      about === null
        ? null
        : { area: about.area, answers: about.answers.map(({ question, answer }) => ({ question, answer })) },
    declined,
  });
}
