import { z } from "zod";
import { findCompaniesInStapply } from "@/lib/job-discovery/stapply";

export type DiscoveredJob = {
  externalId: string;
  title: string;
  company: string;
  location: string;
  postedAt: string | null;
  jobUrl: string;
  provider: "Greenhouse" | "Lever" | "Ashby" | "SmartRecruiters" | "Workday";
  discoveredVia?: "Stapply" | "Direct employer feed";
  description?: string;
  employmentType?: string;
  department?: string;
  arrangement?: string;
  matchScore?: number;
  matchReason?: string;
  isNew?: boolean;
  lastVerifiedAt?: string;
};

const inputSchema = z.string().url().max(2000);

function slugFromUrl(value: string) {
  const url = new URL(inputSchema.parse(value));
  const parts = url.pathname.split("/").filter(Boolean);
  if (url.hostname === "boards.greenhouse.io" || url.hostname === "job-boards.greenhouse.io") return { provider:"greenhouse" as const, slug:parts[0] };
  if (url.hostname === "jobs.lever.co" || url.hostname === "api.lever.co") return { provider:"lever" as const, slug:parts.at(-1) };
  if (url.hostname === "jobs.ashbyhq.com") return { provider:"ashby" as const, slug:parts[0] };
  if (url.hostname === "careers.smartrecruiters.com") return {provider:"smartrecruiters" as const,slug:parts[0]};
  if (url.hostname.endsWith(".myworkdayjobs.com")) return {provider:"workday" as const,slug:url.hostname.split(".")[0],instance:url.hostname.split(".").slice(1,-2).join("."),site:parts[0]};
  throw new Error("Use a Greenhouse, Lever, Ashby, SmartRecruiters, or Workday company careers URL.");
}

function plain(value?:string){return (value||"").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();}

async function getJson(url: string) {
  const response = await fetch(url,{signal:AbortSignal.timeout(12_000),headers:{accept:"application/json","user-agent":"ApplyIQ/1.0 job discovery"},cache:"no-store"});
  if(!response.ok) throw new Error(`The careers board returned ${response.status}.`);
  return response.json() as Promise<unknown>;
}

export async function discoverAtsJobs(boardUrl:string):Promise<DiscoveredJob[]> {
  const board=slugFromUrl(boardUrl); if(!board.slug) throw new Error("The careers board URL is missing its company name.");
  if(board.provider==="greenhouse"){
    const data=await getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.slug)}/jobs?content=true`) as {jobs?:Array<{id:number;title:string;updated_at?:string;absolute_url:string;content?:string;departments?:Array<{name:string}>;location?:{name?:string}}>};
    return (data.jobs??[]).map(job=>({externalId:String(job.id),title:job.title,company:board.slug!,location:job.location?.name||"Not specified",postedAt:job.updated_at||null,jobUrl:job.absolute_url,provider:"Greenhouse",description:plain(job.content),department:job.departments?.map(x=>x.name).join(", ")}));
  }
  if(board.provider==="lever"){
    const data=await getJson(`https://api.lever.co/v0/postings/${encodeURIComponent(board.slug)}?mode=json`) as Array<{id:string;text:string;hostedUrl:string;createdAt?:number;descriptionPlain?:string;categories?:{location?:string;team?:string;commitment?:string}}>;
    return data.map(job=>({externalId:job.id,title:job.text,company:board.slug!,location:job.categories?.location||"Not specified",postedAt:job.createdAt?new Date(job.createdAt).toISOString():null,jobUrl:job.hostedUrl,provider:"Lever",description:job.descriptionPlain,department:job.categories?.team,employmentType:job.categories?.commitment}));
  }
  if(board.provider==="ashby"){const data=await getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board.slug)}?includeCompensation=true`) as {jobs?:Array<{jobUrl:string;title:string;location?:string;publishedAt?:string;descriptionPlain?:string;department?:string;employmentType?:string;isRemote?:boolean}>};return (data.jobs??[]).map(job=>({externalId:job.jobUrl,title:job.title,company:board.slug!,location:job.location||"Not specified",postedAt:job.publishedAt||null,jobUrl:job.jobUrl,provider:"Ashby",description:job.descriptionPlain,department:job.department,employmentType:job.employmentType,arrangement:job.isRemote?"Remote":undefined}));}
  if(board.provider==="smartrecruiters"){const data=await getJson(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(board.slug)}/postings?limit=100&offset=0`) as {content?:Array<{id:string;name:string;releasedDate?:string;location?:{city?:string;region?:string;country?:string};department?:{label?:string};typeOfEmployment?:{label?:string}}>};return (data.content??[]).map(job=>({externalId:job.id,title:job.name,company:board.slug!,location:[job.location?.city,job.location?.region,job.location?.country].filter(Boolean).join(", ")||"Not specified",postedAt:job.releasedDate||null,jobUrl:`https://jobs.smartrecruiters.com/${board.slug}/${job.id}`,provider:"SmartRecruiters",department:job.department?.label,employmentType:job.typeOfEmployment?.label}));}
  const endpoint=`https://${board.slug}.${board.instance}.myworkdayjobs.com/wday/cxs/${board.slug}/${board.site}/jobs`;const response=await fetch(endpoint,{method:"POST",signal:AbortSignal.timeout(12_000),headers:{"content-type":"application/json",accept:"application/json"},body:JSON.stringify({appliedFacets:{},limit:100,offset:0,searchText:""}),cache:"no-store"});if(!response.ok)throw new Error(`The careers board returned ${response.status}.`);const data=await response.json() as {jobPostings?:Array<{title:string;externalPath:string;locationsText?:string;postedOn?:string}>};return (data.jobPostings??[]).map(job=>({externalId:job.externalPath,title:job.title,company:board.slug!,location:job.locationsText||"Not specified",postedAt:job.postedOn||null,jobUrl:`https://${board.slug}.${board.instance}.myworkdayjobs.com${job.externalPath}`,provider:"Workday"}));
}

function companySlugs(name:string){
  const base=name.toLowerCase().replace(/\b(inc|llc|ltd|limited|company|co|group|holdings)\b\.?/g,"").replace(/[^a-z0-9]+/g," ").trim();
  return [...new Set([base.replaceAll(" ","-"),base.replaceAll(" ",""),base.split(" ")[0]].filter(Boolean))];
}

export async function discoverAtsJobsByCompanyName(companyName:string){
  try {
    const directory = await findCompaniesInStapply(companyName);
    const supported = directory.matches.filter(match => ["greenhouse", "lever", "ashby", "smartrecruiters", "workday"].includes(match.ats.toLowerCase()));
    for (const company of supported) {
      try {
        const jobs = await discoverAtsJobs(company.url);
        if (jobs.length) return { jobs: jobs.map(job => ({ ...job, company: company.name, discoveredVia: "Stapply" as const })), boardUrl: company.url, directoryUpdatedAt: directory.updatedAt, source: "Stapply open jobs directory" };
      } catch { /* Try the next exact directory match. */ }
    }
  } catch { /* Fall back to direct ATS slug detection when the directory is unavailable. */ }
  const candidates=companySlugs(companyName).flatMap(slug=>[
    `https://job-boards.greenhouse.io/${slug}`,
    `https://jobs.lever.co/${slug}`,
    `https://jobs.ashbyhq.com/${slug}`,
    `https://careers.smartrecruiters.com/${slug}`,
  ]);
  const attempts=await Promise.all(candidates.map(async boardUrl=>{try{const jobs=await discoverAtsJobs(boardUrl);return jobs.length?{jobs,boardUrl}:null}catch{return null}}));
  const match=attempts.find(Boolean);if(!match)throw new Error("ApplyIQ could not automatically locate a supported careers board for that company. Open ‘Advanced’ and paste its careers URL instead.");
  return { ...match, jobs: match.jobs.map(job => ({ ...job, discoveredVia: "Direct employer feed" as const })), directoryUpdatedAt: null, source: "Direct ATS lookup" };
}
