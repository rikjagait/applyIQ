import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { isPreviewMode } from "@/lib/preview";

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  if(await isPreviewMode())return NextResponse.json({ok:true,preview:true});
  try{const {id}=await params;const {supabase,user}=await requireUser();const {data:profile}=await supabase.from("profiles").select("id").eq("auth_user_id",user.id).single();if(!profile)return NextResponse.json({error:"Profile not found"},{status:404});const {data,error}=await supabase.from("jobs").update({dismissed_at:new Date().toISOString()}).eq("id",id).eq("profile_id",profile.id).select("id").maybeSingle();if(error)throw error;if(!data)return NextResponse.json({error:"Job not found"},{status:404});return NextResponse.json({ok:true})}catch(error){console.error("Job removal failed",error);return NextResponse.json({error:"The job could not be removed."},{status:500})}
}
