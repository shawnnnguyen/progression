const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });
const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

export function formatEventTimestamp(iso: string): string {
  const date = new Date(iso);
  return `${DATE_FORMATTER.format(date)}, ${TIME_FORMATTER.format(date)}`;
}

export function formatDateOnly(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso));
}

export function formatTimeOnly(iso: string): string {
  return TIME_FORMATTER.format(new Date(iso));
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat(undefined, { numeric: "always" });

export function formatRelativeTime(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return "just now";

  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (seconds >= unitSeconds) {
      return RELATIVE_FORMATTER.format(-Math.floor(seconds / unitSeconds), unit);
    }
  }
  return "just now";
}
