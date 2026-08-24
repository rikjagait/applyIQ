export type ResumeEvidenceItem = {
  content: string;
  type: "Achievement" | "Responsibility";
  tags: string[];
};

const tagSignals: Record<string, RegExp> = {
  leadership: /\b(led|lead|managed|mentor|directed|head|team)\b/i,
  learning: /\b(learning|training|education|curriculum|workshop|facilitat)\w*/i,
  programs: /\b(program|project|delivery|initiative|operations)\b/i,
  partnerships: /\b(partner|stakeholder|relationship|client|employer)\w*/i,
  engagement: /\b(engagement|community|campaign|communication)\w*/i,
  analytics: /\b(data|analytics|report|metric|dashboard|insight)\w*/i,
};

export function extractResumeEvidence(rawText: string): ResumeEvidenceItem[] {
  const unique = new Set<string>();
  return rawText
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^[•●▪◦\-*]+\s*/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line.length >= 35 && line.length <= 900)
    .filter((line) => {
      const key = line.toLowerCase();
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    })
    .slice(0, 80)
    .map((content) => ({
      content,
      type: /(?:\d[%+]?|[$£€]\s?\d|increased|improved|grew|secured|achieved|awarded|recognized)/i.test(
        content,
      )
        ? "Achievement"
        : "Responsibility",
      tags: Object.entries(tagSignals)
        .filter(([, pattern]) => pattern.test(content))
        .map(([tag]) => tag),
    }));
}
