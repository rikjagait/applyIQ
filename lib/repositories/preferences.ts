import "server-only";
import { isPreviewMode } from "@/lib/preview";
import { createSupabaseServerClient, requireUser } from "@/lib/supabase/server";

export type JobPreferences={roles:string[];locations:string[];arrangements:string[];employmentTypes:string[];minimumSalary:number};
export const defaultJobPreferences:JobPreferences={roles:["Learning","Training","Program","Engagement","Partnerships"],locations:["New York","New Jersey","Remote"],arrangements:["Remote","Hybrid"],employmentTypes:["Full-time"],minimumSalary:70000};
const strings=(value:unknown,fallback:string[])=>Array.isArray(value)?value.filter((x):x is string=>typeof x==="string"&&x.trim().length>0):fallback;

export async function getJobPreferences():Promise<JobPreferences>{
  if(await isPreviewMode())return defaultJobPreferences;
  const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return defaultJobPreferences;
  const {data}=await supabase.from("profiles").select("minimum_salary,preferences").eq("auth_user_id",user.id).single();const stored=(data?.preferences??{}) as Record<string,unknown>;
  return {roles:strings(stored.roles,defaultJobPreferences.roles),locations:strings(stored.locations,defaultJobPreferences.locations),arrangements:strings(stored.arrangements,defaultJobPreferences.arrangements),employmentTypes:strings(stored.employmentTypes,defaultJobPreferences.employmentTypes),minimumSalary:Number(data?.minimum_salary??defaultJobPreferences.minimumSalary)};
}

export async function saveJobPreferences(input:JobPreferences){
  if(await isPreviewMode())return {preview:true};const {supabase,user}=await requireUser();
  const {data:current}=await supabase.from("profiles").select("preferences").eq("auth_user_id",user.id).single();
  const {error}=await supabase.from("profiles").update({minimum_salary:input.minimumSalary,preferences:{...((current?.preferences??{}) as object),roles:input.roles,locations:input.locations,arrangements:input.arrangements,employmentTypes:input.employmentTypes},updated_at:new Date().toISOString()}).eq("auth_user_id",user.id);if(error)throw error;return {preview:false};
}
