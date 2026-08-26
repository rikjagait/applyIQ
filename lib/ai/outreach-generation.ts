import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getCachedGeneration, saveGeneration } from "@/lib/repositories/ai-generations";
import { getLatestResumeText } from "@/lib/repositories/resumes";
import type { Job } from "@/lib/types";
import { responseText, type ResponsesPayload } from "@/lib/ai/response-text";

const planSchema=z.object({people:z.array(z.object({name:z.string(),title:z.string(),why:z.string(),publicUrl:z.string().url(),message:z.string(),currentEmployer:z.string(),currentEmploymentVerified:z.boolean()})).max(6),connection:z.string(),followup:z.string()});
const schema={type:"object",additionalProperties:false,properties:{people:{type:"array",items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},title:{type:"string"},why:{type:"string"},publicUrl:{type:"string"},message:{type:"string"},currentEmployer:{type:"string"},currentEmploymentVerified:{type:"boolean"}},required:["name","title","why","publicUrl","message","currentEmployer","currentEmploymentVerified"]}},connection:{type:"string"},followup:{type:"string"}},required:["people","connection","followup"]};
const employerMatches=(actual:string,expected:string)=>{const clean=(value:string)=>value.toLowerCase().replace(/\b(inc|llc|ltd|corporation|corp|company)\b/g,"").replace(/[^a-z0-9]/g,"");return clean(actual)===clean(expected)};

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
  const resume=await getLatestResumeText();const fallback=getOutreachFallback(job);
  if(!process.env.OPENAI_API_KEY||!resume)return fallback;
  const targets=outreachSearchTargets(job);const fingerprint=createHash("sha256").update(JSON.stringify({version:3,job,resume,targets})).digest("hex");const cached=await getCachedGeneration<z.infer<typeof planSchema>>("job",job.id,"outreach_plan",fingerprint);if(cached)return {...cached,people:cached.people.filter(person=>person.currentEmploymentVerified&&employerMatches(person.currentEmployer,job.company))};
  try{const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",store:false,tools:[{type:"web_search"}],instructions:`Research current public professional contacts for this exact vacancy at ${job.company}. Every returned person must currently work at ${job.company}; verify this from a current public professional profile and set currentEmploymentVerified true only when the current employer is explicit. Exclude former employees, contractors at other companies, generic recruiters, and anyone whose present employer cannot be confirmed. Then determine whether the person's current remit matches the vacancy's function, business line, and geography. Return no person rather than an uncertain match. Never call someone the confirmed hiring manager unless a public source explicitly says so. Use direct public profile URLs only. Draft concise messages grounded only in the résumé and role.`,input:`JOB:\n${JSON.stringify(job)}\n\nROLE-SPECIFIC SEARCH TARGETS:\n${JSON.stringify(targets)}\n\nLATEST RÉSUMÉ:\n${resume}`,text:{format:{type:"json_schema",name:"outreach_plan",strict:true,schema}}})});if(!response.ok)throw new Error(`OpenAI outreach research failed (${response.status})`);const data=await response.json() as ResponsesPayload;const plan=planSchema.parse(JSON.parse(responseText(data)||"{}"));const verified={...plan,people:plan.people.filter(person=>person.currentEmploymentVerified&&employerMatches(person.currentEmployer,job.company))};await saveGeneration("job",job.id,"outreach_plan",fingerprint,verified);return verified}catch(error){console.error("AI outreach fallback",error);return fallback}
}
export function getOutreachFallback(job:Job){return {people:[],connection:`Hi [Name] — I’m exploring the ${job.title} opportunity at ${job.company}. My background in ${job.roleFamily.toLowerCase()} appears closely aligned, and I’d value connecting and learning more about the team.`,followup:`Hi [Name], thank you for connecting. I’m considering the ${job.title} role at ${job.company} and would appreciate your perspective on what the team values most. If you have 10–15 minutes, I’d be grateful for a brief conversation. No worries if timing is tight.`};}
