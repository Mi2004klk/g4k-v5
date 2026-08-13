import { formatDistanceToNow, isValid, format } from "date-fns";

export function safeFromNow(value?: string | number | Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (!isValid(d)) return "";
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export function safeFormat(value: string | Date | null | undefined, fmt: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (!isValid(d)) return "";
  try {
    return format(d, fmt);
  } catch {
    return "";
  }
}
