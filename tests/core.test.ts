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
import { assessDiscoveredJob, prioritizeDiscoveredJobs } from "@/lib/job-discovery/prioritize";
import { parseCompanyDirectory, rankCompanyMatches } from "@/lib/job-discovery/stapply";
import { encouragementForDate, greetingForHour } from "@/lib/daily-welcome";
import { extractResumeEvidence } from "@/lib/resume-evidence";

describe("résumé evidence import", () => {
  it("preserves exact résumé wording and classifies measurable evidence", () => {
    const source = [
      "Led a cross-functional learning team and improved program engagement by 35%.",
      "Managed stakeholder partnerships across regional learning programs and workshops.",
      "Short heading",
    ].join("\n");
    const evidence = extractResumeEvidence(source);
    expect(evidence).toHaveLength(2);
    expect(evidence[0]).toMatchObject({
      content:
        "Led a cross-functional learning team and improved program engagement by 35%.",
      type: "Achievement",
    });
    expect(evidence[0].tags).toEqual(
      expect.arrayContaining(["leadership", "learning", "programs"]),
    );
    expect(evidence[1].content).toBe(
      "Managed stakeholder partnerships across regional learning programs and workshops.",
    );
  });
});

describe("daily welcome",()=>{it("uses the visitor's local hour for the greeting",()=>{expect(greetingForHour(8)).toBe("Good morning");expect(greetingForHour(14)).toBe("Good afternoon");expect(greetingForHour(20)).toBe("Good evening")});it("keeps one encouragement for the entire local day",()=>{expect(encouragementForDate(new Date(2026,7,23,1))).toBe(encouragementForDate(new Date(2026,7,23,23)));expect(encouragementForDate(new Date(2026,7,23))).not.toBe(encouragementForDate(new Date(2026,7,24)))});});

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
describe("strict discovery fit",()=>{const job=(title:string,location="US - Remote")=>({externalId:title,title,company:"Example",location,postedAt:null,jobUrl:"https://example.com/job",provider:"Ashby" as const});it("excludes machine-learning and technical program roles even when program is a preference",()=>{expect(assessDiscoveredJob(job("Machine Learning Program Manager")).eligible).toBe(false);expect(assessDiscoveredJob(job("Technical Program Manager, Cloud AI Partnerships")).eligible).toBe(false)});it("excludes remote roles tied to a foreign market",()=>{expect(assessDiscoveredJob(job("Learning Program Manager","India - Remote")).eligible).toBe(false)});it("explains a credible target-market match",()=>{const result=prioritizeDiscoveredJobs([job("Customer Learning Program Lead")]);expect(result[0].matchReason).toContain("learning");expect(result[0].matchScore).toBeGreaterThanOrEqual(60)});});
describe("Stapply company directory",()=>{it("parses quoted company names and ranks exact matches first",()=>{const entries=parseCompanyDirectory('ats,name,slug,url\nashby,"Example, Inc.",example,https://jobs.ashbyhq.com/example\nlever,Example Labs,example-labs,https://jobs.lever.co/example-labs');expect(entries[0].name).toBe("Example, Inc.");expect(rankCompanyMatches(entries,"Example")[0].slug).toBe("example");});});
describe("job analysis", () => {
  it("extracts requirements and produces explainable bounded scoring", () => {
    const result = analyzeDeterministically({ title:"Learning Program Manager", company:"Example Co", location:"New York, NY", description:"We require experience designing learning programs and managing stakeholder relationships. The manager will own project timelines, training workshops, analytics and impact reporting. Hybrid in New York. Full-time. Salary $95,000–$110,000 per year. Candidates must communicate across teams and improve program outcomes." });
    expect(result.requirements.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(0); expect(result.score).toBeLessThanOrEqual(100);
    expect(result.arrangement).toBe("Hybrid"); expect(result.salary).toContain("$95,000");
  });
  it("changes fit evidence and score when the latest résumé changes", () => {
    const vacancy = { title:"Learning Program Manager", company:"Example Co", location:"New York, NY", description:"We require experience designing learning programs, facilitating training workshops, managing stakeholder partnerships and reporting program outcomes." };
    const aligned = analyzeDeterministically(vacancy, "Learning program manager who designed training workshops, managed stakeholder partnerships and reported measurable program outcomes.");
    const unrelated = analyzeDeterministically(vacancy, "Retail assistant responsible for cash handling, stock replenishment and customer checkout operations.");
    expect(aligned.score).toBeGreaterThan(unrelated.score);
    expect(aligned.requirements.some(item => item.evidence.includes("Learning program manager"))).toBe(true);
    expect(unrelated.requirements.some(item => item.evidence.includes("No evidence identified"))).toBe(true);
  });
  it("excludes company marketing, culture and benefits from candidate requirements", () => {
    const result = analyzeDeterministically({ title:"Social Media Manager", company:"Example", location:"Remote", description:"We predict market movements that help investors make decisions. We value transparency and an inclusive culture. We invest in our team with competitive compensation and equity. The ideal candidate has 5 years of experience building social media strategy and must be proficient with analytics tools." }, "Led social media strategy and analytics reporting for national campaigns.");
    expect(result.requirements).toHaveLength(1);
    expect(result.requirements[0].sourceQuote).toContain("ideal candidate");
    expect(result.requirements.some(item => /inclusive|compensation|investors/i.test(item.requirement))).toBe(false);
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
