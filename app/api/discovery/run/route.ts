import { refreshJobFeeds } from "@/lib/repositories/job-feeds";
import { isPreviewMode } from "@/lib/preview";
import { createSupabaseServerClient } from "@/lib/supabase/server";
async function authorized(request:Request){if(await isPreviewMode())return true;const cron=process.env.CRON_SECRET;const bearer=request.headers.get("authorization");if(cron&&bearer===`Bearer ${cron}`)return true;const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();return Boolean(user)}
export async function POST(request:Request){if(!await authorized(request))return Response.json({error:"Unauthorized"},{status:401});return Response.json(await refreshJobFeeds())}
