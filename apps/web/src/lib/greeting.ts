export type TimeTier = "morning" | "afternoon" | "evening" | "night";

export function getTimeTier(d = new Date()): TimeTier {
  const h = d.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

const GREETINGS: Record<TimeTier, { salutation: string; titles: string[]; subtitles: string[] }> = {
  morning:   { salutation: "Good morning",
    titles:     ["Rise & grind", "Let's cook today", "Morning, legend", "Early bird mode: on"],
    subtitles:  ["Fresh slate, full tank — let's make it count.", "Coffee in hand, goals locked in.", "New day, same mission: ship it.", "Ready to tackle the day's challenges."] },
  afternoon: { salutation: "Good afternoon",
    titles:     ["Keep the streak alive", "Midday momentum", "You're locked in", "Halfway to the finish"],
    subtitles:  ["Momentum looks good on you.", "Stay sharp — momentum compounds.", "Small wins stacking up nicely.", "Power through the afternoon slump."] },
  evening:   { salutation: "Good evening",
    titles:     ["Wrapping up strong", "Finishing finesse", "Closing-time energy", "One last push"],
    subtitles:  ["Tie up the loose ends with style.", "Good day? Make the last hour count.", "Wind down smart, not hard.", "Almost there, finish strong."] },
  night:     { salutation: "Good night",
    titles:     ["Burning the midnight oil", "Night owl active", "Late grind", "Still going strong"],
    subtitles:  ["Quiet hours, deep work — pace yourself.", "Owl hours: ship quietly.", "Don't forget to rest after this.", "Take it easy and wrap up soon."] },
};

export function getGreeting(d = new Date(), seed = 0) {
  const t = getTimeTier(d);
  const g = GREETINGS[t];
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const i = (seed + dayOfYear) % g.titles.length;
  return { tier: t, salutation: g.salutation, title: g.titles[i], subtitle: g.subtitles[i] };
}
