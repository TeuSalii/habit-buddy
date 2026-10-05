import { DAYS, type Day } from "@/shared/food-moment";

// Dates are kept as text in the form "2026-10-05": one day, no time and no
// time zone. Two such texts compare correctly with < and >.

export function toDateText(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// The date of each weekday in the week that contains `today`.
// The week starts on Monday, as it does in Switzerland.
export function datesOfWeek(today: Date): Record<Day, string> {
  // JavaScript counts Sunday as 0; shifting by 6 makes Monday 0.
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const dates = {} as Record<Day, string>;
  DAYS.forEach((day, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysSinceMonday + index);
    dates[day] = toDateText(date);
  });
  return dates;
}
