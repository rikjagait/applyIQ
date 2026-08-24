import "server-only";
import type { CompleteJobAnalysis } from "@/lib/ai/job-analysis";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, requireUser } from "@/lib/supabase/server";
import { normalizeTitle } from "@/lib/job-providers";
import type { ApplicationStage, Job, MatchCategory, WorkArrangement } from "@/lib/types";
import { jobs as demoJobs } from "@/lib/data";
import { isPreviewMode } from "@/lib/preview";

type JobRow = {
  id:string; title:string; location:string|null; arrangement:"remote"|"hybrid"|"onsite"|null; salary_min:number|null; salary_max:number|null;
  employment_type:string|null; role_family:string|null; date_posted:string|null; created_at:string; description:string; is_demo:boolean;
  companies:{name:string;industry:string|null}|Array<{name:string;industry:string|null}>|null;
  job_matches:Array<{score:number|string;category:string;interview_probability:number|string|null;strengths:unknown;gaps:unknown;explanation:string|null}>;
  applications:Array<{status:string}>; job_requirements?:Array<{requirement:string;importance:string}>;
};

const statusMap: Record<string, ApplicationStage> = { discovered:"Discovered",shortlisted:"Shortlisted",preparing:"Preparing Application",ready:"Ready to Apply",applied:"Applied",recruiter_screen:"Recruiter Screen",interview:"Interview",final_interview:"Final Interview",offer:"Offer",rejected:"Rejected",withdrawn:"Withdrawn",closed:"Closed" };
function textArray(value: unknown): string[] { return Array.isArray(value) ? value.filter((v):v is string=>typeof v === "string") : []; }
function mapRow(row: JobRow): Job {
  const company=Array.isArray(row.companies)?row.companies[0]:row.companies; const match=row.job_matches?.[0];
  const score=Number(match?.score??0); const category=(match?.category || (score>=80?"Strong Match":score>=65?"Good / Stretch":"Weak Match")) as MatchCategory;
  const salary=row.salary_min ? `$${row.salary_min.toLocaleString()}${row.salary_max?`–$${row.salary_max.toLocaleString()}`:"+"}` : null;
  return {id:row.id,title:row.title,company:company?.name??"Unknown company",location:row.location??"Location not specified",arrangement:(row.arrangement==="remote"?"Remote":row.arrangement==="hybrid"?"Hybrid":"On-site") as WorkArrangement,salary,employmentType:row.employment_type==="Part-time"?"Part-time":"Full-time",roleFamily:row.role_family??"Adjacent Opportunity",industry:company?.industry??"Not specified",postedDaysAgo:row.date_posted?Math.max(0,Math.floor((Date.now()-new Date(row.date_posted).getTime())/86400000)):Math.max(0,Math.floor((Date.now()-new Date(row.created_at).getTime())/86400000)),source:"Saved URL",score,probability:Number(match?.interview_probability??0),category,summary:match?.explanation??"Analysis pending.",strengths:textArray(match?.strengths),gaps:textArray(match?.gaps),requirements:(row.job_requirements??[]).map(r=>({requirement:r.requirement,importance:r.importance==="preferred"?"Preferred":"Required",evidence:"See verified Experience Bank",strength:"Moderate",gap:"Review evidence mapping"})),status:statusMap[row.applications?.[0]?.status]??"Discovered"};
}

export async function listJobs(): Promise<Job[]> {
  if (!isSupabaseConfigured() || await isPreviewMode()) return demoJobs;
  const supabase=await createSupabaseServerClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) return [];
  const {data,error}=await supabase.from("jobs").select("id,title,location,arrangement,salary_min,salary_max,employment_type,role_family,date_posted,created_at,description,is_demo,companies(name,industry),job_matches(score,category,interview_probability,strengths,gaps,explanation),applications(status),job_requirements(requirement,importance)").is("dismissed_at",null).order("created_at",{ascending:false});
  if(error){console.error("Could not list jobs",error);return [];} return (data as unknown as JobRow[]).map(mapRow);
}

export async function getJob(id:string): Promise<Job|null> { const all=await listJobs(); return all.find(job=>job.id===id)??null; }

export async function persistAnalyzedJob(input: { description: string; sourceUrl?: string }, analysis: CompleteJobAnalysis) {
  if (!isSupabaseConfigured() || await isPreviewMode()) return null;
  const { supabase, user } = await requireUser();
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
  if (profileError || !profile) throw new Error("Authenticated profile is missing");
  const { data: company, error: companyError } = await supabase.from("companies").upsert({ profile_id:profile.id, name: analysis.company, industry: analysis.industry }, { onConflict: "profile_id,name" }).select("id").single();
  if (companyError) throw companyError;
  const { data: source, error: sourceError } = await supabase.from("job_sources").insert({ profile_id:profile.id, provider:"manual", source_url:input.sourceUrl || null, original_url:input.sourceUrl || null }).select("id").single();
  if (sourceError) throw sourceError;
  const salaryNumbers = analysis.salary?.match(/\d[\d,]*/g)?.map(n=>Number(n.replaceAll(",",""))) ?? [];
  const arrangement = analysis.arrangement === "On-site" ? "onsite" : analysis.arrangement.toLowerCase();
  const { data: job, error: jobError } = await supabase.from("jobs").insert({
    profile_id:profile.id, company_id:company.id, source_id:source.id, title:analysis.title, normalized_title:normalizeTitle(analysis.title), location:analysis.location,
    arrangement, salary_min:salaryNumbers[0] || null, salary_max:salaryNumbers[1] || null, employment_type:analysis.employmentType,
    description:input.description, role_family:analysis.roleFamily, is_demo:false,
  }).select("id").single();
  if (jobError) throw jobError;
  const { error: reqError } = await supabase.from("job_requirements").insert(analysis.requirements.map((r,index)=>({job_id:job.id,requirement:r.requirement,importance:r.importance.toLowerCase(),sort_order:index})));
  if (reqError) throw reqError;
  const { error: matchError } = await supabase.from("job_matches").insert({job_id:job.id,profile_id:profile.id,score:analysis.score,category:analysis.category,interview_probability:analysis.probability,factor_scores:analysis.factorScores,strengths:analysis.strengths,gaps:analysis.gaps,explanation:analysis.summary});
  if (matchError) throw matchError;
  const { error: appError } = await supabase.from("applications").insert({profile_id:profile.id,job_id:job.id,status:"discovered"});
  if (appError) throw appError;
  return job.id as string;
}
