const BRUSSELS = "Europe/Brussels";

export function todayInBrussels(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRUSSELS, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function timeInBrussels(now = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BRUSSELS, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(now);
}

export function dateInBrussels(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BRUSSELS, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(value));
}

export function daysBefore(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}

export function displayDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric", ...options,
  }).format(new Date(`${value}T12:00:00Z`));
}

export function capturedTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BRUSSELS, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(value));
}
