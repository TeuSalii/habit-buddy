import { appendLog } from "@/server/log";
import type { FeedbackRequest } from "@/shared/tiny-habit";

// POST /api/feedback  body: FeedbackRequest  →  204
// A rating is its own log line, linked to its answer by exchangeId.
export async function POST(request: Request) {
  const { exchangeId, rating } = (await request.json()) as FeedbackRequest;

  if (typeof exchangeId !== "string" || (rating !== "helpful" && rating !== "not_helpful")) {
    return Response.json({ error: "Body must be { exchangeId, rating }" }, { status: 400 });
  }

  await appendLog({ type: "rating", exchangeId, at: new Date().toISOString(), rating });
  return new Response(null, { status: 204 });
}
