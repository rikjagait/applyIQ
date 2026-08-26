import "server-only";
import { z } from "zod";
import { responseText, type ResponsesPayload } from "@/lib/ai/response-text";
import { experiences } from "@/lib/data";
import { calculateMatchScore, matchCategory } from "@/lib/scoring";

const requirementSchema = z.object({
  requirement: z.string().min(2),
  importance: z.enum(["Required", "Preferred"]),
  category: z.enum(["Experience", "Skill", "Education", "Tool", "Leadership", "Certification"]),
  sourceQuote: z.string().min(2),
  evidence: z.string(),
  strength: z.enum(["Strong", "Moderate", "None"]),
  gap: z.string(),
});
export const jobAnalysisSchema = z.object({
  title: z.string().min(2),
  company: z.string().min(2),
  location: z.string().min(2),
  arrangement: z.enum(["Remote", "Hybrid", "On-site"]),
  salary: z.string().nullable(),
  employmentType: z.enum(["Full-time", "Part-time"]),
  roleFamily: z.string().min(2),
  industry: z.string().min(2),
  requirements: z.array(requirementSchema).min(1).max(15),
  strengths: z.array(z.string()).max(8),
  gaps: z.array(z.string()).max(8),
  strategy: z.string().min(20),
  summary: z.string().min(20),
});
export type ParsedJobAnalysis = z.infer<typeof jobAnalysisSchema>;
export type CompleteJobAnalysis = ParsedJobAnalysis & {
  score: number;
  category: ReturnType<typeof matchCategory>;
  probability: number;
  provider: "openai" | "deterministic";
  factorScores: Record<string, number>;
};

const defaultTruth = experiences
  .map((e) => `${e.position}, ${e.employer}: ${e.text}`)
  .join("\n");
const skillGroups = {
  learning: [
    "learning",
    "training",
    "facilitation",
    "workshop",
    "curriculum",
    "content",
  ],
  program: ["program", "project", "timeline", "delivery", "logistics"],
  stakeholder: [
    "stakeholder",
    "partnership",
    "relationship",
    "cross-functional",
    "communication",
  ],
  leadership: ["manage", "manager", "leadership", "mentor", "team"],
  analytics: ["analytics", "reporting", "dashboard", "data", "metrics"],
};

function evidenceChunks(truth: string) {
  return truth
    .split(/\n+|(?<=[.!?])\s+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 25);
}
function findRequirements(description: string, truth: string) {
  const chunks = evidenceChunks(truth);
  const evidenceTokens = new Set(
    truth.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [],
  );
  const lines = description
    .replace(/([.!?])(?=[A-Z])/g, "$1\n")
    .split(/\n|(?<=[.;])\s+/)
    .map((s) => s.replace(/^[-•*]\s*/, "").trim())
    .filter((s) => s.length > 18);
  const signal = /\b(must|require[ds]?|requirements?|qualifications?|you (?:have|bring|are)|ideal candidate|minimum of|at least \d+ years?|years? of experience|proficien(?:t|cy)|demonstrated|track record|ability to|knowledge of|bachelor(?:'s)?|master(?:'s)?|degree|certification|preferred|nice to have|a plus)\b/i;
  const nonRequirement = /\b(we are|our mission|our values|we value|we believe|we invest|benefits?|compensation|salary|equity|equal opportunity|diversity|diverse|inclusive culture|remote-first|what you can expect|about us|our company|our team)\b/i;
  const category = (line: string) => {
    if (/degree|bachelor|master/i.test(line)) return "Education" as const;
    if (/certif/i.test(line)) return "Certification" as const;
    if (/software|platform|tool|salesforce|hubspot|tableau|jira|asana/i.test(line)) return "Tool" as const;
    if (/lead|manage|mentor|team/i.test(line)) return "Leadership" as const;
    if (/years? of experience|track record|demonstrated experience/i.test(line)) return "Experience" as const;
    return "Skill" as const;
  };
  return lines
    .filter((l) => signal.test(l) && !nonRequirement.test(l))
    .slice(0, 12)
    .map((line) => {
      const words = line.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [];
      const hits = words.filter((w) => evidenceTokens.has(w));
      const evidence = chunks.find((chunk) =>
        hits.some((hit) => chunk.toLowerCase().includes(hit)),
      );
      const strength: "Strong" | "Moderate" | "None" =
        hits.length >= 3 ? "Strong" : hits.length ? "Moderate" : "None";
      return {
        requirement: line.slice(0, 240),
        sourceQuote: line.slice(0, 400),
        category: category(line),
        importance: /preferred|nice to have|plus/i.test(line)
          ? ("Preferred" as const)
          : ("Required" as const),
        evidence: evidence ?? "No evidence identified in the latest résumé",
        strength,
        gap:
          strength === "None"
            ? "No direct evidence in Career Truth"
            : strength === "Moderate"
              ? "Transferable or partial evidence"
              : "None",
      };
    });
}

export function analyzeDeterministically(
  input: {
    title: string;
    company: string;
    location: string;
    description: string;
  },
  resumeText = defaultTruth,
): CompleteJobAnalysis {
  const text = `${input.title}\n${input.description}`;
  const lower = text.toLowerCase();
  const resumeLower = resumeText.toLowerCase();
  const groupCoverage = Object.fromEntries(
    Object.entries(skillGroups).map(([group, terms]) => [
      group,
      terms.filter((term) => lower.includes(term) && resumeLower.includes(term))
        .length / terms.length,
    ]),
  );
  const locationFit = /new york|nyc|jersey city|new jersey|remote/.test(
    `${input.location} ${lower}`,
  )
    ? 1
    : 0.25;
  const required = findRequirements(input.description, resumeText);
  const requiredStrength = required.length
    ? required.reduce(
        (n, r) =>
          n +
          (r.strength === "Strong" ? 1 : r.strength === "Moderate" ? 0.5 : 0),
        0,
      ) / required.length
    : 0.35;
  const factors = {
    relevantExperience: Math.max(
      groupCoverage.learning,
      groupCoverage.program,
      groupCoverage.stakeholder,
    ),
    transferableExperience:
      (groupCoverage.learning +
        groupCoverage.program +
        groupCoverage.stakeholder) /
      3,
    requiredSkills: requiredStrength,
    seniority: /director|vice president|vp|chief/.test(lower)
      ? 0.25
      : /manager|lead|senior/.test(lower)
        ? 1
        : 0.7,
    achievements: /impact|results|metrics|improve|increase|outcome/.test(lower)
      ? 1
      : 0.6,
    location: locationFit,
    compensation: /\$(?:7\d|8\d|9\d|1\d\d)[,.]?\d{0,3}/.test(lower) ? 1 : 0.65,
    preferredSkills: requiredStrength,
    industry: 0.55,
    tools: /salesforce|hubspot|sharepoint|asana|jira|tableau|microsoft/.test(
      lower,
    )
      ? 1
      : 0.4,
  };
  const score = calculateMatchScore(factors);
  const strengths = required
    .filter((r) => r.strength !== "None")
    .slice(0, 4)
    .map((r) => r.evidence);
  const gaps = required
    .filter((r) => r.strength === "None")
    .slice(0, 4)
    .map((r) => r.requirement);
  const arrangement = /hybrid/i.test(text)
    ? "Hybrid"
    : /remote/i.test(text)
      ? "Remote"
      : "On-site";
  const salaryMatch = text.match(
    /\$\s?[\d,]+(?:\s*[-–—]\s*\$?\s?[\d,]+)?(?:\s*(?:per year|annually|a year))?/i,
  );
  return {
    title: input.title,
    company: input.company,
    location: input.location,
    arrangement,
    salary: salaryMatch?.[0] ?? null,
    employmentType: /part[- ]time/i.test(text) ? "Part-time" : "Full-time",
    roleFamily: inferRoleFamily(text),
    industry: "Not specified",
    requirements: required.length
      ? required
      : [
          {
            requirement: "Complete role requirements",
            importance: "Required",
            category: "Skill",
            sourceQuote: "No explicit candidate qualifications were detected in the supplied posting.",
            evidence: "Insufficient structured requirements detected",
            strength: "None",
            gap: "Review the pasted description",
          },
        ],
    strengths: [...new Set(strengths)].slice(0, 4),
    gaps,
    score,
    category: matchCategory(score),
    probability: Math.max(3, Math.round((score - 45) * 0.55)),
    factorScores: factors,
    provider: "deterministic",
    summary:
      score >= 80
        ? "Strong alignment with verified learning, program and stakeholder experience."
        : score >= 65
          ? "Credible transferable fit with several areas requiring careful positioning."
          : "Material gaps reduce the likely return on application effort.",
    strategy:
      "Lead with the verified experiences that directly match required responsibilities. Use transferable framing for adjacent work and explicitly acknowledge requirements with no supporting evidence.",
  };
}

function inferRoleFamily(text: string) {
  if (/learning|training|development/i.test(text))
    return "Learning & Development";
  if (/engagement|community/i.test(text)) return "Engagement";
  if (/partnership/i.test(text)) return "Partnerships";
  if (/program|project/i.test(text)) return "Program Management";
  return "Adjacent Opportunity";
}

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    company: { type: "string" },
    location: { type: "string" },
    arrangement: { type: "string", enum: ["Remote", "Hybrid", "On-site"] },
    salary: { type: ["string", "null"] },
    employmentType: { type: "string", enum: ["Full-time", "Part-time"] },
    roleFamily: { type: "string" },
    industry: { type: "string" },
    requirements: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          requirement: { type: "string" },
          importance: { type: "string", enum: ["Required", "Preferred"] },
          category: { type: "string", enum: ["Experience", "Skill", "Education", "Tool", "Leadership", "Certification"] },
          sourceQuote: { type: "string" },
          evidence: { type: "string" },
          strength: { type: "string", enum: ["Strong", "Moderate", "None"] },
          gap: { type: "string" },
        },
        required: ["requirement", "importance", "category", "sourceQuote", "evidence", "strength", "gap"],
      },
    },
    strengths: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
    strategy: { type: "string" },
    summary: { type: "string" },
  },
  required: [
    "title",
    "company",
    "location",
    "arrangement",
    "salary",
    "employmentType",
    "roleFamily",
    "industry",
    "requirements",
    "strengths",
    "gaps",
    "strategy",
    "summary",
  ],
};

async function analyzeWithOpenAI(
  input: {
    title: string;
    company: string;
    location: string;
    description: string;
  },
  truth: string,
): Promise<ParsedJobAnalysis> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      store: false,
      instructions:
        "Act as an evidence-based recruiter. Return the canonical employer and job title stated inside the vacancy; ignore job-board domains, page-title suffixes, sign-in text, and phrases such as LinkedIn Jobs. Extract only explicit candidate qualifications: experience, skills, education, credentials, tools, or leadership capability. Never treat company descriptions, mission, values, culture, benefits, compensation, EEO language, location/remote policy, or ordinary role duties as candidate requirements. Include a duty only when the posting explicitly frames it as a required or preferred candidate capability. If uncertain, omit it. Mark Required only when the posting says must, required, need, minimum, or equivalent; mark Preferred only for preferred, ideally, nice-to-have, or plus. Every requirement must include a short exact contiguous sourceQuote from the vacancy. Match evidence only against Career Truth; never invent or infer unsupported claims. Keep requirements concise and non-duplicative.",
      input: `CAREER TRUTH:\n${truth}\n\nVACANCY:\nTitle: ${input.title}\nCompany: ${input.company}\nLocation: ${input.location}\n${input.description}`,
      text: {
        format: {
          type: "json_schema",
          name: "job_analysis",
          strict: true,
          schema: jsonSchema,
        },
      },
    }),
  });
  if (!response.ok)
    throw new Error(`OpenAI analysis failed (${response.status})`);
  const data = (await response.json()) as ResponsesPayload;
  const output=responseText(data);
  if (!output)
    throw new Error("OpenAI returned no structured output");
  return jobAnalysisSchema.parse(JSON.parse(output));
}

export async function analyzeJob(
  input: {
    title: string;
    company: string;
    location: string;
    description: string;
  },
  resumeText = defaultTruth,
): Promise<CompleteJobAnalysis> {
  const base = analyzeDeterministically(input, resumeText);
  if (!process.env.OPENAI_API_KEY) return base;
  try {
    const parsed = await analyzeWithOpenAI(input, resumeText);
    const weighted = parsed.requirements.reduce((total, item) => {
      const weight = item.importance === "Required" ? 2 : 1;
      const value = item.strength === "Strong" ? 1 : item.strength === "Moderate" ? 0.5 : 0;
      return { earned: total.earned + weight * value, possible: total.possible + weight };
    }, { earned: 0, possible: 0 });
    const requirementFit = weighted.possible ? weighted.earned / weighted.possible : base.factorScores.requiredSkills;
    const factorScores = { ...base.factorScores, requiredSkills: requirementFit, preferredSkills: requirementFit };
    const score = calculateMatchScore(factorScores);
    return {
      ...parsed,
      score,
      category: matchCategory(score),
      probability: Math.max(3, Math.round((score - 45) * 0.55)),
      factorScores,
      provider: "openai",
    };
  } catch (error) {
    console.error("OpenAI job analysis fallback", error);
    return base;
  }
}
