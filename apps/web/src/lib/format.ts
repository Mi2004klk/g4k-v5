import { formatDistanceToNow, isValid } from "date-fns";

export function safeFromNow(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (!isValid(d)) return "";
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}
