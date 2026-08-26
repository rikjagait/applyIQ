import "server-only";
import { z } from "zod";
import { responseText, type ResponsesPayload } from "@/lib/ai/response-text";
import type { DiscoveredJob } from "@/lib/job-discovery/ats";

const resultSchema = z.object({
  assessments: z.array(z.object({
    externalId: z.string(),
    fitScore: z.number().min(0).max(100),
    recommended: z.boolean(),
    reason: z.string().min(10).max(320),
  })).max(12),
});

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    assessments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          externalId: { type: "string" },
          fitScore: { type: "number", minimum: 0, maximum: 100 },
          recommended: { type: "boolean" },
          reason: { type: "string" },
        },
        required: ["externalId", "fitScore", "recommended", "reason"],
      },
    },
  },
  required: ["assessments"],
};

export async function rerankProactiveJobs(jobs: DiscoveredJob[], resumeText?: string) {
  if (!process.env.OPENAI_API_KEY || !resumeText || !jobs.length) return jobs;
  const candidates = jobs.slice(0, 12);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        store: false,
        instructions: "Rank jobs for this candidate using only the supplied résumé and vacancy facts. Prefer clear evidence of relevant scope, skills and seniority. Reject technical, machine-learning, engineering, or otherwise unsuitable roles even when they share generic words such as program or manager. Do not invent experience. Write one specific, supportive reason naming the strongest evidence and any material caveat. Recommend only credible applications worth the candidate's time.",
        input: `LATEST RÉSUMÉ:\n${resumeText.slice(0, 7000)}\n\nCANDIDATE JOBS:\n${JSON.stringify(candidates.map(job => ({ externalId: job.externalId, title: job.title, company: job.company, location: job.location, description: (job.description || "").slice(0, 1400), initialScore: job.matchScore })))}`,
        text: { format: { type: "json_schema", name: "proactive_job_ranking", strict: true, schema } },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI discovery ranking failed (${response.status})`);
    const data = await response.json() as ResponsesPayload;
    const parsed = resultSchema.parse(JSON.parse(responseText(data) || "{}"));
    const assessments = new Map(parsed.assessments.map(item => [item.externalId, item]));
    return candidates
      .map(job => {
        const assessment = assessments.get(job.externalId);
        if (!assessment) return job;
        const score = Math.round((job.matchScore || 0) * 0.4 + assessment.fitScore * 0.6);
        return { ...job, matchScore: score, matchReason: assessment.reason, aiAssessed: true, aiRecommended: assessment.recommended };
      })
      .filter(job => job.aiRecommended !== false && (job.matchScore || 0) >= 60)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  } catch (error) {
    console.error("AI discovery ranking fallback", error);
    return jobs;
  }
}
