import type { MomentDetails } from "@/shared/food-moment";
import type { FoodProfile } from "@/shared/offer";
import type { ModelId, TinyHabit } from "@/shared/tiny-habit";

// The contract of the developer lab. A "statement" is what a person could
// have decided in the app: a food moment, and what they told Buddy.

export type LabSuggestRequest = {
  model: ModelId;
  moment: MomentDetails;
  about: FoodProfile | null;
  avoid: string[]; // behaviors already shown for this statement, so new ones differ
};

export type LabSuggestions =
  | { kind: "suggestions"; suggestions: TinyHabit[] }
  | { kind: "decline"; message: string };

export type LabSuggestResponse = LabSuggestions & {
  rulesVersion: string;
  approvedCount: number; // how many approved offers exist so far
};

export type LabChoiceRequest = {
  model: ModelId;
  rulesVersion: string;
  moment: MomentDetails;
  about: FoodProfile | null;
  suggestions: TinyHabit[];
  chosen: number | null; // position of the right suggestion; null: none of them fits
  note: string; // why none fits, or anything worth remembering
};

export type LabChoiceResponse = { approvedCount: number };

export const MAX_AVOID = 15;
export const MAX_NOTE_LENGTH = 500;
