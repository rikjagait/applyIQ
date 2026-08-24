import { z } from "zod";
import { findCompaniesInStapply } from "@/lib/job-discovery/stapply";

export type DiscoveredJob = {
  externalId: string;
  title: string;
  company: string;
  location: string;
  postedAt: string | null;
  jobUrl: string;
  provider: "Greenhouse" | "Lever" | "Ashby";
};

const inputSchema = z.string().url().max(2000);

function slugFromUrl(value: string) {
  const url = new URL(inputSchema.parse(value));
  const parts = url.pathname.split("/").filter(Boolean);
  if (url.hostname === "boards.greenhouse.io" || url.hostname === "job-boards.greenhouse.io") return { provider:"greenhouse" as const, slug:parts[0] };
  if (url.hostname === "jobs.lever.co" || url.hostname === "api.lever.co") return { provider:"lever" as const, slug:parts.at(-1) };
  if (url.hostname === "jobs.ashbyhq.com") return { provider:"ashby" as const, slug:parts[0] };
  throw new Error("Use a Greenhouse, Lever, or Ashby company careers URL.");
}

async function getJson(url: string) {
  const response = await fetch(url,{signal:AbortSignal.timeout(12_000),headers:{accept:"application/json","user-agent":"ApplyIQ/1.0 job discovery"},cache:"no-store"});
  if(!response.ok) throw new Error(`The careers board returned ${response.status}.`);
  return response.json() as Promise<unknown>;
}

export async function discoverAtsJobs(boardUrl:string):Promise<DiscoveredJob[]> {
  const board=slugFromUrl(boardUrl); if(!board.slug) throw new Error("The careers board URL is missing its company name.");
  if(board.provider==="greenhouse"){
    const data=await getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.slug)}/jobs?content=false`) as {jobs?:Array<{id:number;title:string;updated_at?:string;absolute_url:string;location?:{name?:string}}>};
    return (data.jobs??[]).map(job=>({externalId:String(job.id),title:job.title,company:board.slug!,location:job.location?.name||"Not specified",postedAt:job.updated_at||null,jobUrl:job.absolute_url,provider:"Greenhouse"}));
  }
  if(board.provider==="lever"){
    const data=await getJson(`https://api.lever.co/v0/postings/${encodeURIComponent(board.slug)}?mode=json`) as Array<{id:string;text:string;hostedUrl:string;createdAt?:number;categories?:{location?:string}}>;
    return data.map(job=>({externalId:job.id,title:job.text,company:board.slug!,location:job.categories?.location||"Not specified",postedAt:job.createdAt?new Date(job.createdAt).toISOString():null,jobUrl:job.hostedUrl,provider:"Lever"}));
  }
  const data=await getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board.slug)}?includeCompensation=true`) as {jobs?:Array<{jobUrl:string;title:string;location?:string;publishedAt?:string}>};
  return (data.jobs??[]).map(job=>({externalId:job.jobUrl,title:job.title,company:board.slug!,location:job.location||"Not specified",postedAt:job.publishedAt||null,jobUrl:job.jobUrl,provider:"Ashby"}));
}

function companySlugs(name:string){
  const base=name.toLowerCase().replace(/\b(inc|llc|ltd|limited|company|co|group|holdings)\b\.?/g,"").replace(/[^a-z0-9]+/g," ").trim();
  return [...new Set([base.replaceAll(" ","-"),base.replaceAll(" ",""),base.split(" ")[0]].filter(Boolean))];
}

export async function discoverAtsJobsByCompanyName(companyName:string){
  try {
    const directory = await findCompaniesInStapply(companyName);
    const supported = directory.matches.filter(match => ["greenhouse", "lever", "ashby"].includes(match.ats.toLowerCase()));
    for (const company of supported) {
      try {
        const jobs = await discoverAtsJobs(company.url);
        if (jobs.length) return { jobs: jobs.map(job => ({ ...job, company: company.name })), boardUrl: company.url, directoryUpdatedAt: directory.updatedAt, source: "Stapply open jobs directory" };
      } catch { /* Try the next exact directory match. */ }
    }
  } catch { /* Fall back to direct ATS slug detection when the directory is unavailable. */ }
  const candidates=companySlugs(companyName).flatMap(slug=>[
    `https://job-boards.greenhouse.io/${slug}`,
    `https://jobs.lever.co/${slug}`,
    `https://jobs.ashbyhq.com/${slug}`,
  ]);
  const attempts=await Promise.all(candidates.map(async boardUrl=>{try{const jobs=await discoverAtsJobs(boardUrl);return jobs.length?{jobs,boardUrl}:null}catch{return null}}));
  const match=attempts.find(Boolean);if(!match)throw new Error("ApplyIQ could not automatically locate a supported careers board for that company. Open ‘Advanced’ and paste its careers URL instead.");
  return { ...match, directoryUpdatedAt: null, source: "Direct ATS lookup" };
}
