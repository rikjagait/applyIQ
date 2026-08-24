import type { MatchCategory } from "@/lib/types";

export const MATCH_WEIGHTS = {
  relevantExperience: 25, transferableExperience: 15, requiredSkills: 15,
  seniority: 10, achievements: 10, location: 8, compensation: 7,
  preferredSkills: 5, industry: 3, tools: 2,
} as const;

export function matchCategory(score: number): MatchCategory {
  if (score >= 80) return "Strong Match";
  if (score >= 65) return "Good / Stretch";
  return "Weak Match";
}

export function calculateMatchScore(factors: Partial<Record<keyof typeof MATCH_WEIGHTS, number>>) {
  return Math.round(Object.entries(MATCH_WEIGHTS).reduce((total, [key, weight]) => {
    const value = factors[key as keyof typeof MATCH_WEIGHTS] ?? 0;
    return total + Math.max(0, Math.min(1, value)) * weight;
  }, 0));
}

export function funnelRates(counts: { applied: number; screens: number; interviews: number; offers: number }) {
  const rate = (value: number, base: number) => base ? Math.round((value / base) * 100) : 0;
  return { screenRate: rate(counts.screens, counts.applied), interviewRate: rate(counts.interviews, counts.applied), offerRate: rate(counts.offers, counts.interviews) };
}
