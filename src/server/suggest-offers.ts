import type { MomentDetails } from "@/shared/food-moment";
import type { LabSuggestions } from "@/shared/lab";
import type { FoodProfile } from "@/shared/offer";
import type { ModelId } from "@/shared/tiny-habit";
import type { ModelOutput } from "./models/model";
import { MODELS } from "./models/registry";
import { offerInput } from "./offer-input";

export const SUGGESTION_COUNT = 3;

// Added to the rule sheet for lab requests only. Everything else is the
// same sheet the app uses, so what the lab shows is what the app would say.
const LAB_INSTRUCTION = `# Lab mode
This request comes from the team's test lab. It replaces the "Reply" section of "7 · Food offers": reply with \`move\` = "propose", \`message\` = "", and exactly ${SUGGESTION_COUNT} tiny habits in \`tinyHabits\`. Each one follows every rule above. Make them clearly different from each other: a different action each, not a rewording. The scope rule F1 still applies: if it does, the move is decline.`;

// Three candidate offers for one statement, for a person to choose from.
export async function suggestOffers(
  id: ModelId,
  moment: MomentDetails,
  about: FoodProfile | null,
  avoid: string[],
  rules: string,
): Promise<LabSuggestions> {
  const text = await MODELS[id].generate(`${rules}\n\n${LAB_INSTRUCTION}`, [
    { role: "user", content: offerInput(moment, about, avoid) },
  ]);
  const output = JSON.parse(text) as ModelOutput;

  if (output.move === "decline") {
    if (output.message.trim() === "") {
      throw new Error('Move "decline" came without a message');
    }
    return { kind: "decline", message: output.message };
  }
  if (output.move !== "propose" || output.tinyHabits.length !== SUGGESTION_COUNT) {
    throw new Error(`Expected ${SUGGESTION_COUNT} proposed tiny habits, got "${output.move}" with ${output.tinyHabits.length}`);
  }
  return { kind: "suggestions", suggestions: output.tinyHabits };
}
