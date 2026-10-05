import type { TinyHabit } from "@/shared/tiny-habit";

// The contract for a check-off: the person marks that they did (or, when
// they untick it, did not do) their plan on one day.

export type CheckinRequest = {
  userId: string;
  momentId: string;
  habit: TinyHabit; // the plan as it read when it was checked
  date: string; // the day it is about, as "2026-10-05"
  done: boolean; // false when a tick is taken back
};

export const MAX_ID_LENGTH = 64;
