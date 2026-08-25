import "server-only";
import { requireUser } from "@/lib/supabase/server";

export async function getCachedGeneration<T>(entityType:string, entityId:string, operation:string, fingerprint:string):Promise<T|null>{
  const {supabase,user}=await requireUser();
  const {data:profile}=await supabase.from("profiles").select("id").eq("auth_user_id",user.id).single();
  if(!profile)return null;
  const {data}=await supabase.from("ai_generations").select("source_data,output").eq("profile_id",profile.id).eq("entity_type",entityType).eq("entity_id",entityId).eq("operation",operation).order("created_at",{ascending:false}).limit(1).maybeSingle();
  const source=data?.source_data as {fingerprint?:unknown}|null;
  return source?.fingerprint===fingerprint ? data?.output as T : null;
}

export async function saveGeneration(entityType:string,entityId:string,operation:string,fingerprint:string,output:unknown){
  const {supabase,user}=await requireUser();
  const {data:profile}=await supabase.from("profiles").select("id").eq("auth_user_id",user.id).single();
  if(!profile)throw new Error("Private profile not found");
  const {error}=await supabase.from("ai_generations").insert({profile_id:profile.id,entity_type:entityType,entity_id:entityId,operation,model:process.env.OPENAI_MODEL||"gpt-5.6-luna",prompt_version:"application-studio-v2",source_data:{fingerprint},output});
  if(error)throw error;
}
