import { describe, expect, it } from "vitest";
import { calculateMatchScore, funnelRates, matchCategory } from "@/lib/scoring";
import { duplicateKey, normalizeTitle } from "@/lib/job-providers";
import { assessClaim } from "@/lib/factual-integrity";
import { analyzeDeterministically } from "@/lib/ai/job-analysis";
import { extractJobFromHtml } from "@/lib/job-ingestion/extract";
import { isPrivateAddress, validateJobUrl } from "@/lib/job-ingestion/url-safety";
import { jobIntakeSchema } from "@/lib/validation";
import { buildApplicationStudio } from "@/lib/application-studio";
import { jobs } from "@/lib/data";
import { prioritizeDiscoveredJobs } from "@/lib/job-discovery/prioritize";

describe("match scoring", () => {
  it("applies weights and clamps inputs", () => expect(calculateMatchScore({ relevantExperience: 1, transferableExperience: .5, location: 2 })).toBe(41));
  it("uses configurable category boundaries", () => { expect(matchCategory(80)).toBe("Strong Match"); expect(matchCategory(65)).toBe("Good / Stretch"); expect(matchCategory(64)).toBe("Weak Match"); });
});
describe("job normalization and duplicates", () => {
  it("normalizes seniority and punctuation", () => expect(normalizeTitle("Sr. Learning & Development Manager")).toBe("learning development manager"));
  it("generates matching duplicate keys", () => {
    const a = duplicateKey({company:"Acme",title:"Senior Program Manager",location:"New York, NY"});
    const b = duplicateKey({company:" acme ",title:"Program Manager",location:"new york, ny"}); expect(a).toBe(b);
  });
});
describe("analytics", () => { it("handles rates and empty denominators", () => expect(funnelRates({applied:10,screens:3,interviews:2,offers:1})).toEqual({screenRate:30,interviewRate:20,offerRate:50})); });
describe("factual integrity", () => {
  const evidence = ["Launched campaigns that increased educator engagement by 30%."];
  it("accepts supported claims", () => expect(assessClaim("Increased educator engagement by 30% through campaigns", evidence)).toBe("GREEN"));
  it("rejects invented metrics", () => expect(assessClaim("Increased employee engagement by 75%", evidence)).toBe("RED"));
});
describe("application studio",()=>{it("maps each tailored claim to its exact source evidence",()=>{const studio=buildApplicationStudio(jobs[0]);expect(studio.changes[3].original).toContain("team of three");expect(studio.changes.every(change=>change.integrity!=="RED")).toBe(true);expect(studio.coverLetter).toContain("Northstar Health");});});
describe("discovery prioritization",()=>{it("keeps relevant target-market roles ahead of unrelated technical jobs",()=>{const found=prioritizeDiscoveredJobs([{externalId:"1",title:"Learning Program Manager",company:"A",location:"New York City",postedAt:null,jobUrl:"https://example.com/1",provider:"Ashby"},{externalId:"2",title:"Software Engineer",company:"A",location:"San Francisco",postedAt:null,jobUrl:"https://example.com/2",provider:"Ashby"}]);expect(found.map(job=>job.externalId)).toEqual(["1"])});});
describe("job analysis", () => {
  it("extracts requirements and produces explainable bounded scoring", () => {
    const result = analyzeDeterministically({ title:"Learning Program Manager", company:"Example Co", location:"New York, NY", description:"We require experience designing learning programs and managing stakeholder relationships. The manager will own project timelines, training workshops, analytics and impact reporting. Hybrid in New York. Full-time. Salary $95,000–$110,000 per year. Candidates must communicate across teams and improve program outcomes." });
    expect(result.requirements.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(0); expect(result.score).toBeLessThanOrEqual(100);
    expect(result.arrangement).toBe("Hybrid"); expect(result.salary).toContain("$95,000");
  });
});
describe("URL job ingestion", () => {
  it("extracts a schema.org JobPosting", () => {
    const html = `<html><script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"JobPosting",title:"Learning Manager",hiringOrganization:{"@type":"Organization",name:"Good Company"},jobLocation:{address:{addressLocality:"New York",addressRegion:"NY",addressCountry:"US"}},description:"Lead learning programs, stakeholder workshops, project timelines, analytics, reporting and cross-functional program delivery for a growing organization. This role partners with leaders to improve measurable outcomes."})}</script></html>`;
    const result=extractJobFromHtml(html,"https://careers.example.com/job/123");
    expect(result).toMatchObject({title:"Learning Manager",company:"Good Company",location:"New York, NY, US",extractionMethod:"json-ld"});
    expect(result.description).not.toContain("<");
  });
  it("rejects local and private network targets", () => {
    expect(()=>validateJobUrl("http://example.com/job")).toThrow(/HTTPS/);
    expect(()=>validateJobUrl("https://localhost/job")).toThrow(/Private-network/);
    expect(()=>validateJobUrl("https://192.168.1.4/job")).toThrow(/Private-network/);
    expect(isPrivateAddress("10.0.0.5")).toBe(true); expect(isPrivateAddress("8.8.8.8")).toBe(false);
  });
  it("accepts URL-only intake", () => expect(jobIntakeSchema.parse({sourceUrl:"https://jobs.example.com/role"}).sourceUrl).toContain("jobs.example.com"));
});
