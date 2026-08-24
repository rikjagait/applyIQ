import type { Job } from "@/lib/types";

export interface JobProvider {
  readonly name: string;
  discover(query: { locations: string[]; keywords: string[] }): Promise<Job[]>;
}

export function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/\b(senior|sr\.?|lead)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function duplicateKey(job: Pick<Job, "company" | "title" | "location">) {
  return [job.company.toLowerCase().trim(), normalizeTitle(job.title), job.location.toLowerCase().trim()].join("|");
}
