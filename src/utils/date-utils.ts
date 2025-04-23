import {
  format,
  formatDistance,
  formatRelative,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  parseISO,
  differenceInDays,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

/**
 * Format a date with a specified format string
 */
export function formatDate(
  date: Date | string | number,
  formatString = "PPP",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return format(dateObj, formatString);
}

/**
 * Format a date relative to the current date
 */
export function formatRelativeDate(date: Date | string | number): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);

  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, "h:mm a")}`;
  }

  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, "h:mm a")}`;
  }

  if (isTomorrow(dateObj)) {
    return `Tomorrow at ${format(dateObj, "h:mm a")}`;
  }

  if (isThisWeek(dateObj)) {
    return format(dateObj, "EEEE");
  }

  if (isThisMonth(dateObj)) {
    return format(dateObj, "MMMM d");
  }

  if (isThisYear(dateObj)) {
    return format(dateObj, "MMMM d");
  }

  return format(dateObj, "PPP");
}

/**
 * Format a date as a time ago string
 */
export function formatTimeAgo(date: Date | string | number): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Get date range for a specified period
 */
export function getDateRange(
  period: "day" | "week" | "month" | "year" | "custom",
  customRange?: { start: Date; end: Date },
): { start: Date; end: Date } {
  const now = new Date();

  switch (period) {
    case "day":
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
    case "week":
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case "year":
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    case "custom":
      if (!customRange) {
        throw new Error('Custom range is required for period "custom"');
      }
      return customRange;
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
  }
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return dateObj < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return dateObj > new Date();
}

/**
 * Get the number of days between two dates
 */
export function getDaysBetween(
  startDate: Date | string | number,
  endDate: Date | string | number,
): number {
  const start =
    typeof startDate === "string" ? parseISO(startDate) : new Date(startDate);
  const end =
    typeof endDate === "string" ? parseISO(endDate) : new Date(endDate);
  return differenceInDays(end, start);
}

/**
 * Get an array of dates between two dates
 */
export function getDatesBetween(
  startDate: Date | string | number,
  endDate: Date | string | number,
): Date[] {
  const start =
    typeof startDate === "string" ? parseISO(startDate) : new Date(startDate);
  const end =
    typeof endDate === "string" ? parseISO(endDate) : new Date(endDate);

  const dates: Date[] = [];
  let currentDate = start;

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}
