export type MatchCategory = "Strong Match" | "Good / Stretch" | "Weak Match";
export type WorkArrangement = "Remote" | "Hybrid" | "On-site";
export type ApplicationStage =
  | "Discovered" | "Shortlisted" | "Preparing Application" | "Ready to Apply"
  | "Applied" | "Recruiter Screen" | "Interview" | "Final Interview" | "Offer"
  | "Rejected" | "Withdrawn" | "Closed";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  arrangement: WorkArrangement;
  salary: string | null;
  employmentType: "Full-time" | "Part-time";
  roleFamily: string;
  industry: string;
  postedDaysAgo: number;
  source: string;
  sourceUrl?: string;
  description?: string;
  score: number;
  probability: number;
  category: MatchCategory;
  summary: string;
  strengths: string[];
  gaps: string[];
  requirements: Array<{ requirement: string; importance: "Required" | "Preferred"; category?: string; sourceQuote?: string; evidence: string; strength: "Strong" | "Moderate" | "None"; gap: string }>;
  status: ApplicationStage;
  saved?: boolean;
}

export interface Experience {
  id: string;
  employer: string;
  position: string;
  period: string;
  text: string;
  type: "Achievement" | "Responsibility" | "Leadership";
  tags: string[];
  verified: true;
}
