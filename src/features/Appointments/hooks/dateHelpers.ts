import dayjs from "dayjs";




// ─── Pure Utility Helpers (Safe Global Context) ───────────────────────────────
export function getDaysInMonth(year: number, month: number) {
  return dayjs.utc().year(year).month(month).daysInMonth();
}

export function getFirstDayOfMonth(year: number, month: number) {
  return dayjs.utc().year(year).month(month).date(1).day();
}

export function dateKey(y: number, m: number, d: number) {
  return dayjs.utc().year(y).month(m).date(d).format("YYYY-MM-DD");
}

export function formatDisplayDate(y: number, m: number, d: number) {
  return dayjs.utc().year(y).month(m).date(d).format("DD MMM YYYY");
}

export function timeSlotToISO(slot: string) {
  const [timePart, meridiem] = slot.split(" ");
  let [h, m] = timePart.split(":").map(Number);
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}