import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { iconRegistry, IconName, IconEntry } from "./registry";
import { cn } from "../../utils/cn";

const SIZE_CLASS: Record<string,string> = {
  xs:"w-3 h-3", sm:"w-3.5 h-3.5", md:"w-4 h-4", lg:"w-5 h-5",
  xl:"w-6 h-6", "2xl":"w-8 h-8", hero:"w-12 h-12",
};

const TONE_CLASS: Record<string,string> = {
  neutral:"text-current", brand:"text-primary", primary:"text-brand-tangerine",
  success:"text-success", warning:"text-warning", danger:"text-danger", info:"text-info",
};

export function AppIcon({
  name, size="md", tone, spin, className,
}: { name: IconName; size?: keyof typeof SIZE_CLASS; tone?: keyof typeof TONE_CLASS;
     spin?: boolean; className?: string; }) {
  const entry = iconRegistry[name];
  if (!entry) {
    console.warn(`AppIcon: missing icon in registry for name: ${name}`);
    return null;
  }
  const resolvedTone = tone ?? (entry as IconEntry).tone ?? "neutral";
  return (
    <FontAwesomeIcon
      icon={entry.icon}
      spin={spin ?? (name === "loading")}
      className={cn(SIZE_CLASS[size], TONE_CLASS[resolvedTone], "shrink-0", className)}
      aria-hidden="true"
    />
  );
}
