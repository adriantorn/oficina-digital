const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

type DateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsInTimeZone(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour"), minute: read("minute"), second: read("second") };
}

export function zonedDateTimeToUtc(date: string, time: string, timeZone: string) {
  if (!datePattern.test(date) || !timePattern.test(time)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = target;
  try {
    for (let iteration = 0; iteration < 4; iteration += 1) {
      const actual = partsInTimeZone(new Date(instant), timeZone);
      const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, 0);
      const adjustment = target - actualAsUtc;
      if (!adjustment) break;
      instant += adjustment;
    }
    const verified = partsInTimeZone(new Date(instant), timeZone);
    if (verified.year !== year || verified.month !== month || verified.day !== day || verified.hour !== hour || verified.minute !== minute) return null;
    return new Date(instant).toISOString();
  } catch {
    return null;
  }
}

export function dateInTimeZone(date = new Date(), timeZone = "Europe/Madrid") {
  const parts = partsInTimeZone(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function addLocalDays(date: string, days: number) {
  if (!datePattern.test(date)) return date;
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

export function startOfWeek(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addLocalDays(date, -(weekday === 0 ? 6 : weekday - 1));
}

export function localDateRangeUtc(date: string, timeZone = "Europe/Madrid") {
  const start = zonedDateTimeToUtc(date, "00:00", timeZone);
  const end = zonedDateTimeToUtc(addLocalDays(date, 1), "00:00", timeZone);
  if (!start || !end) throw new Error("Fecha o zona horaria no válidas.");
  return { start, end };
}

export function localWeekRangeUtc(date: string, timeZone = "Europe/Madrid") {
  const weekStart = startOfWeek(date);
  const start = zonedDateTimeToUtc(weekStart, "00:00", timeZone);
  const end = zonedDateTimeToUtc(addLocalDays(weekStart, 7), "00:00", timeZone);
  if (!start || !end) throw new Error("Semana o zona horaria no válidas.");
  return { weekStart, start, end };
}

export function localInputValues(iso: string, timeZone: string) {
  const parts = partsInTimeZone(new Date(iso), timeZone);
  return {
    date: `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
    time: `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`,
  };
}
