import type { FoodMoment } from "@/shared/food-moment";
import type { FoodProfile, OfferRequest, OfferResponse } from "@/shared/offer";
import type { ModelId } from "@/shared/tiny-habit";
import type { BuddyState, SavedState } from "@/storage/saved-state";

// Asking Buddy for an offer. This lives outside the screens, because two
// places ask: the day map (when a moment is added, or "Another idea") and
// the quiz (when the person wants an idea from what they just did).

// The model that makes Buddy's offers. The lab can switch models; the
// product uses one.
export const OFFER_MODEL: ModelId = "claude";

// Buddy offers by itself only while fewer than this many changes are open.
// Starting many habits at once is how none of them sticks. When the person
// asks for an idea, the limit does not apply: it is their call.
export const MAX_OPEN_CHANGES = 2;

export function openChangesIn(buddy: SavedState["buddy"]): number {
  return Object.values(buddy).filter(
    (each) => each.status === "thinking" || each.status === "offered" || each.status === "accepted",
  ).length;
}

// What the person already turned down at a moment, so a new idea differs.
export function declinedAt(state: BuddyState | undefined): string[] {
  return state !== undefined && "declined" in state ? state.declined : [];
}

// `update` gets the newest saved state and returns the changed one. Using
// the newest state matters here, because Buddy's answer arrives later, when
// other things may already have changed.
export type Change = (update: (current: SavedState) => SavedState) => void;

// Sets Buddy's state for one moment, unless the moment was removed in the
// meantime (an answer can arrive after the person tapped "Remove").
export function setBuddyFor(change: Change, id: string, next: BuddyState, mustExist: boolean) {
  change((current) =>
    mustExist && current.buddy[id] === undefined
      ? current
      : { ...current, buddy: { ...current.buddy, [id]: next } },
  );
}

type Ask = {
  userId: string;
  about: FoodProfile | null;
  moment: FoodMoment;
  declined: string[];
  focus: string | null; // a theme the idea should be about, or null
};

export async function askBuddy(change: Change, { userId, about, moment, declined, focus }: Ask) {
  setBuddyFor(change, moment.id, { status: "thinking", declined }, false);
  try {
    const response = await postOffer({ userId, model: OFFER_MODEL, moment, about, declined, focus });
    setBuddyFor(
      change,
      moment.id,
      response.kind === "offer"
        ? { status: "offered", habit: response.offer, declined }
        : { status: "outOfScope", message: response.message },
      true,
    );
  } catch (error) {
    // The server being unreachable is a normal thing to happen on a phone,
    // so the card says so and offers "Try again". The detail goes to the log.
    console.error(error);
    setBuddyFor(change, moment.id, { status: "failed", declined }, true);
  }
}

async function postOffer(body: OfferRequest): Promise<OfferResponse> {
  const response = await fetch("/api/offer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`/api/offer failed (${response.status}): ${await response.text()}`);
  }
  return response.json();
}
