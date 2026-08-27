export type TimeTier = "morning" | "afternoon" | "evening" | "night";

export function getTimeTier(d = new Date()): TimeTier {
  const h = d.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

const GREETINGS: Record<TimeTier, { titles: string[]; subtitles: string[] }> = {
  morning:   { 
    titles:     ["Good morning"],
    subtitles:  ["Wishing you a productive and successful day ahead.", "Ready to accomplish great things today.", "Let's make today a great day."] },
  afternoon: { 
    titles:     ["Good afternoon"],
    subtitles:  ["Hope your day is going well.", "Keep up the great work this afternoon.", "Wishing you continued focus and energy."] },
  evening:   { 
    titles:     ["Good evening"],
    subtitles:  ["Wrapping up the day's work.", "Hope you had a productive day.", "Time to wind down and review."] },
  night:     { 
    titles:     ["Good night"],
    subtitles:  ["It's getting late, don't forget to rest.", "Taking care of a few last things.", "Rest up for tomorrow."] },
};

export function getGreeting(d = new Date(), seed = 0) {
  const t = getTimeTier(d);
  const g = GREETINGS[t];
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const i = (seed + dayOfYear) % g.subtitles.length;
  return { tier: t, title: g.titles[0], subtitle: g.subtitles[i] };
}
