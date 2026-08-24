import { discoverAtsJobs, discoverAtsJobsByCompanyName } from "@/lib/job-discovery/ats";
import { prioritizeDiscoveredJobs } from "@/lib/job-discovery/prioritize";
import { getJobPreferences } from "@/lib/repositories/preferences";

export async function POST(request:Request){
  try{
    const body=await request.json() as {boardUrl?:unknown;companyName?:unknown};
    const boardUrl=typeof body.boardUrl==="string"?body.boardUrl.trim():"";const companyName=typeof body.companyName==="string"?body.companyName.trim():"";
    if(!boardUrl&&companyName.length<2) return Response.json({error:"Add a company name."},{status:400});
    const discovered=boardUrl?{jobs:await discoverAtsJobs(boardUrl),boardUrl}:await discoverAtsJobsByCompanyName(companyName);
    const preferences=await getJobPreferences();const allJobs=discovered.jobs;const jobs=prioritizeDiscoveredJobs(allJobs,50,preferences);
    jobs.sort((a,b)=>(b.postedAt?Date.parse(b.postedAt):0)-(a.postedAt?Date.parse(a.postedAt):0));
    return Response.json({jobs,scanned:allJobs.length,boardUrl:discovered.boardUrl});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Could not read that careers board."},{status:400});}
}
