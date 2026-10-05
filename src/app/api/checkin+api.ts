import { appendLog } from "@/server/log";
import { isHabit, isId } from "@/server/validate";
import type { CheckinRequest } from "@/shared/checkin";

// POST /api/checkin  body: CheckinRequest  →  204 (no content)
// Writes one line to the log: this person did (or un-ticked) this plan on this day.
export async function POST(request: Request) {
  const { userId, momentId, habit, date, done } = (await request.json()) as CheckinRequest;

  if (!isId(userId) || !isId(momentId)) {
    return Response.json({ error: "userId and momentId must be short texts" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: 'date must look like "2026-10-05"' }, { status: 400 });
  }
  if (typeof done !== "boolean") {
    return Response.json({ error: "done must be true or false" }, { status: 400 });
  }
  if (!isHabit(habit)) {
    return Response.json({ error: "habit must have anchor, behavior and why as short texts" }, { status: 400 });
  }

  await appendLog({ type: "checkin", at: new Date().toISOString(), userId, momentId, habit, date, done });
  return new Response(null, { status: 204 });
}
