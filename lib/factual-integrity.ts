export type IntegrityLevel = "GREEN" | "AMBER" | "RED";

export function assessClaim(claim: string, evidence: string[]): IntegrityLevel {
  const words = (text: string) => new Set(text.toLowerCase().match(/[a-z0-9£$%+]+/g)?.filter(w => w.length > 3) ?? []);
  const claimWords = words(claim); const evidenceWords = words(evidence.join(" "));
  const overlap = [...claimWords].filter(w => evidenceWords.has(w)).length / Math.max(1, claimWords.size);
  const unsupportedMetric = /(?:[$£]\s?\d|\d+(?:\.\d+)?[%+])/.test(claim) && !evidence.some(e => (claim.match(/[$£]?\d+(?:\.\d+)?[%+]?/g) ?? []).some(n => e.includes(n)));
  if (unsupportedMetric || overlap < .2) return "RED";
  if (overlap < .5) return "AMBER";
  return "GREEN";
}
