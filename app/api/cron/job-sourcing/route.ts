import { refreshAllScheduledFeeds } from "@/lib/job-discovery/scheduled";

export const maxDuration=60;
export async function GET(request:Request){const secret=process.env.CRON_SECRET;if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return Response.json({error:"Unauthorized"},{status:401});try{return Response.json(await refreshAllScheduledFeeds())}catch(error){console.error("Daily sourcing failed",error);return Response.json({error:"Daily sourcing could not complete"},{status:500})}}

