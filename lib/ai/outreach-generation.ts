import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getCachedGeneration, saveGeneration } from "@/lib/repositories/ai-generations";
import { getLatestResumeText } from "@/lib/repositories/resumes";
import type { Job } from "@/lib/types";

const planSchema=z.object({people:z.array(z.object({name:z.string(),title:z.string(),why:z.string(),publicUrl:z.string().url(),message:z.string()})).max(6),connection:z.string(),followup:z.string()});
const schema={type:"object",additionalProperties:false,properties:{people:{type:"array",items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},title:{type:"string"},why:{type:"string"},publicUrl:{type:"string"},message:{type:"string"}},required:["name","title","why","publicUrl","message"]}},connection:{type:"string"},followup:{type:"string"}},required:["people","connection","followup"]};

export function outreachSearchTargets(job:Job){
  const context=`${job.title} ${job.roleFamily} ${job.description}`.toLowerCase();
  const educationSales=/education|k-12|workspace for education/.test(context)&&/sales|territor|pipeline|close deals|revenue/.test(context);
  if(educationSales)return [
    {label:"1 · Education sales leader",why:"Most likely reporting line: the leader responsible for K-12 Google Workspace for Education sales or specialists.",query:`${job.company} \"Google for Education\" K-12 sales leader`},
    {label:"2 · Education sales recruiter",why:"Look for a recruiter who explicitly supports Google Education, Workspace, Cloud or sales hiring.",query:`${job.company} recruiter \"Google for Education\" sales`},
    {label:"3 · Workspace for Education specialist",why:"A current specialist or solutions seller can give the most relevant view of the role and team.",query:`${job.company} \"Workspace for Education\" specialist K-12`},
  ];
  return [
    {label:"1 · Likely functional leader",why:"Look for a current leader in the same function, usually one level above this role.",query:`${job.company} ${job.roleFamily} director head`},
    {label:"2 · Specialist recruiter",why:"Look for a current recruiter who explicitly supports this function—not a generic company recruiter.",query:`${job.company} recruiter talent acquisition ${job.roleFamily}`},
    {label:"3 · Relevant team member",why:"A current person doing closely related work can offer practical context about the team.",query:`${job.company} \"${job.title}\"`},
  ];
}

export async function getOutreachPlan(job:Job){
  const resume=await getLatestResumeText();const fallback={people:[],connection:`Hi [Name] — I’m exploring the ${job.title} opportunity at ${job.company}. My background in ${job.roleFamily.toLowerCase()} appears closely aligned, and I’d value connecting and learning more about the team.`,followup:`Hi [Name], thank you for connecting. I’m considering the ${job.title} role at ${job.company} and would appreciate your perspective on what the team values most. If you have 10–15 minutes, I’d be grateful for a brief conversation. No worries if timing is tight.`};
  if(!process.env.OPENAI_API_KEY||!resume)return fallback;
  const targets=outreachSearchTargets(job);const fingerprint=createHash("sha256").update(JSON.stringify({version:2,job,resume,targets})).digest("hex");const cached=await getCachedGeneration<z.infer<typeof planSchema>>("job",job.id,"outreach_plan",fingerprint);if(cached)return cached;
  try{const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",store:false,tools:[{type:"web_search"}],instructions:"Research current public professional contacts for this exact vacancy. First determine the actual job function and likely reporting line from the full description; do not rely on a broad role-family label. A hiring-manager candidate must currently work for the employer, own the matching function/business line, and plausibly manage this role. A recruiter must currently recruit for the matching function, business line, or geography; exclude generic recruiters without evidence of relevance. Prefer official company pages and current LinkedIn profiles. Return no person rather than an uncertain or weak match. Never claim that someone is the confirmed hiring manager unless a public source explicitly verifies it; describe plausible contacts as people to review. Use direct public profile URLs only. Draft concise messages grounded only in the résumé and role.",input:`JOB:\n${JSON.stringify(job)}\n\nROLE-SPECIFIC SEARCH TARGETS:\n${JSON.stringify(targets)}\n\nLATEST RÉSUMÉ:\n${resume}`,text:{format:{type:"json_schema",name:"outreach_plan",strict:true,schema}}})});if(!response.ok)throw new Error(`OpenAI outreach research failed (${response.status})`);const data=await response.json() as {output_text?:string};const plan=planSchema.parse(JSON.parse(data.output_text||"{}"));await saveGeneration("job",job.id,"outreach_plan",fingerprint,plan);return plan}catch(error){console.error("AI outreach fallback",error);return fallback}
}
