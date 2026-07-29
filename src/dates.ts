export function localDateInTimezone(
  date: Date,
  timezone = "America/Los_Angeles",
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function todayInTimezone(timezone: string): string {
  return localDateInTimezone(new Date(), timezone);
}

export function addDays(localDate: string, days: number): string {
  const [year, month, day] = localDate.split("-").map(Number);
  if (!year || !month || !day) throw new Error(`Invalid local date: ${localDate}`);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return date.toISOString().slice(0, 10);
}

export function dateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  for (
    let cursor = startDate;
    cursor <= endDate;
    cursor = addDays(cursor, 1)
  ) {
    dates.push(cursor);
  }
  return dates;
}

export function isLocalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  try {
    return addDays(value, 0) === value;
  } catch {
    return false;
  }
}
