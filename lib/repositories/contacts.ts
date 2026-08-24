import "server-only";
import { isPreviewMode } from "@/lib/preview";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, requireUser } from "@/lib/supabase/server";

export type SavedContact={id:string;name:string;title:string|null;relationship:string|null;publicProfileUrl:string|null;contactedAt:string|null;response:string|null;followupDate:string|null};

export async function listContactsForJob(jobId:string):Promise<SavedContact[]>{
  if(!isSupabaseConfigured()||await isPreviewMode()) return [];
  const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return [];
  const {data:job}=await supabase.from("jobs").select("company_id").eq("id",jobId).single();if(!job?.company_id)return [];
  const {data,error}=await supabase.from("contacts").select("id,name,title,relationship,public_profile_url,contacted_at,response,followup_date").eq("company_id",job.company_id).order("created_at",{ascending:false});
  if(error){console.error("Could not list contacts",error);return []}
  return (data??[]).map(row=>({id:row.id,name:row.name,title:row.title,relationship:row.relationship,publicProfileUrl:row.public_profile_url,contactedAt:row.contacted_at,response:row.response,followupDate:row.followup_date}));
}

export async function createContactForJob(input:{jobId:string;name:string;title?:string;relationship?:string;publicProfileUrl?:string;notes?:string}){
  if(await isPreviewMode()) return {id:crypto.randomUUID(),preview:true};
  const {supabase,user}=await requireUser();const {data:profile}=await supabase.from("profiles").select("id").eq("auth_user_id",user.id).single();if(!profile)throw new Error("Private profile not found");
  const {data:job}=await supabase.from("jobs").select("company_id").eq("id",input.jobId).eq("profile_id",profile.id).single();if(!job?.company_id)throw new Error("Job company not found");
  const {data,error}=await supabase.from("contacts").insert({profile_id:profile.id,company_id:job.company_id,name:input.name,title:input.title||null,relationship:input.relationship||null,source:"manual public-profile research",public_profile_url:input.publicProfileUrl||null,notes:input.notes||null}).select("id").single();
  if(error)throw error;return {id:data.id as string,preview:false};
}

export async function updateContactOutreach(input:{contactId:string;contacted:boolean;response:string;followupDate:string|null}){
  if(await isPreviewMode())return {preview:true};
  const {supabase,user}=await requireUser();const {data:profile}=await supabase.from("profiles").select("id").eq("auth_user_id",user.id).single();if(!profile)throw new Error("Private profile not found");
  const {error}=await supabase.from("contacts").update({contacted_at:input.contacted?new Date().toISOString():null,response:input.response||null,followup_date:input.followupDate||null}).eq("id",input.contactId).eq("profile_id",profile.id);
  if(error)throw error;return {preview:false};
}

export type FollowupItem={id:string;name:string;title:string|null;company:string;followupDate:string;response:string|null;publicProfileUrl:string|null};
export async function listContactFollowups():Promise<FollowupItem[]>{
  if(!isSupabaseConfigured()||await isPreviewMode())return [{id:"demo-followup",name:"Maya Chen",title:"Talent Partner",company:"Northstar Health",followupDate:new Date().toISOString().slice(0,10),response:"Awaiting response",publicProfileUrl:null}];
  const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return [];
  const horizon=new Date();horizon.setDate(horizon.getDate()+14);
  const {data,error}=await supabase.from("contacts").select("id,name,title,followup_date,response,public_profile_url,companies(name)").not("followup_date","is",null).lte("followup_date",horizon.toISOString().slice(0,10)).order("followup_date");
  if(error){console.error("Could not list follow-ups",error);return []}
  return (data??[]).map(row=>{const company=Array.isArray(row.companies)?row.companies[0]:row.companies;return {id:row.id,name:row.name,title:row.title,company:company?.name||"Company",followupDate:row.followup_date!,response:row.response,publicProfileUrl:row.public_profile_url}});
}
