import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { isPreviewMode } from "@/lib/preview";

const stageSchema=z.enum(["Discovered","Shortlisted","Preparing Application","Ready to Apply","Applied","Recruiter Screen","Interview","Final Interview","Offer","Rejected","Withdrawn","Closed"]);
const toDb:Record<z.infer<typeof stageSchema>,string>={"Discovered":"discovered","Shortlisted":"shortlisted","Preparing Application":"preparing","Ready to Apply":"ready","Applied":"applied","Recruiter Screen":"recruiter_screen","Interview":"interview","Final Interview":"final_interview","Offer":"offer","Rejected":"rejected","Withdrawn":"withdrawn","Closed":"closed"};

export async function PATCH(request:Request,{params}:{params:Promise<{jobId:string}>}) {
  const parsed=stageSchema.safeParse((await request.json().catch(()=>null) as {stage?:unknown}|null)?.stage); if(!parsed.success)return NextResponse.json({error:"Invalid stage"},{status:422});
  if(await isPreviewMode())return NextResponse.json({ok:true,preview:true});
  try { const {jobId}=await params; const {supabase,user}=await requireUser(); const {data:profile}=await supabase.from("profiles").select("id").eq("auth_user_id",user.id).single(); if(!profile)return NextResponse.json({error:"Profile not found"},{status:404});
    const {data:application,error:readError}=await supabase.from("applications").select("id,status").eq("profile_id",profile.id).eq("job_id",jobId).single(); if(readError||!application)return NextResponse.json({error:"Application not found"},{status:404});
    const next=toDb[parsed.data]; const {error:updateError}=await supabase.from("applications").update({status:next,updated_at:new Date().toISOString()}).eq("id",application.id); if(updateError)throw updateError;
    const {error:historyError}=await supabase.from("application_stage_history").insert({application_id:application.id,from_status:application.status,to_status:next}); if(historyError)throw historyError;
    return NextResponse.json({ok:true});
  } catch(error){console.error("Stage update failed",error);return NextResponse.json({error:"Stage could not be updated"},{status:500});}
}
