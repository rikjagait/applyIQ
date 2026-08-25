import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { getCachedGeneration, saveGeneration } from "@/lib/repositories/ai-generations";
import { getLatestResumeText } from "@/lib/repositories/resumes";
import type { Job } from "@/lib/types";

const planSchema=z.object({people:z.array(z.object({name:z.string(),title:z.string(),why:z.string(),publicUrl:z.string().url(),message:z.string()})).max(6),connection:z.string(),followup:z.string()});
const schema={type:"object",additionalProperties:false,properties:{people:{type:"array",items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},title:{type:"string"},why:{type:"string"},publicUrl:{type:"string"},message:{type:"string"}},required:["name","title","why","publicUrl","message"]}},connection:{type:"string"},followup:{type:"string"}},required:["people","connection","followup"]};

export async function getOutreachPlan(job:Job){
  const resume=await getLatestResumeText();const fallback={people:[],connection:`Hi [Name] — I’m exploring the ${job.title} opportunity at ${job.company}. My background in ${job.roleFamily.toLowerCase()} appears closely aligned, and I’d value connecting and learning more about the team.`,followup:`Hi [Name], thank you for connecting. I’m considering the ${job.title} role at ${job.company} and would appreciate your perspective on what the team values most. If you have 10–15 minutes, I’d be grateful for a brief conversation. No worries if timing is tight.`};
  if(!process.env.OPENAI_API_KEY||!resume)return fallback;
  const fingerprint=createHash("sha256").update(JSON.stringify({job,resume})).digest("hex");const cached=await getCachedGeneration<z.infer<typeof planSchema>>("job",job.id,"outreach_plan",fingerprint);if(cached)return cached;
  try{const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",store:false,tools:[{type:"web_search"}],instructions:"Find up to six currently relevant public professional contacts for this vacancy: likely hiring manager, functional leader, recruiter, and one useful peer. Use only current public professional information and direct public profile URLs. Do not infer private information. Explain why each person is relevant. Draft concise, warm LinkedIn messages grounded only in the candidate résumé and the role. Never claim a personal connection or company knowledge that is not verified. The user reviews and sends every message manually.",input:`JOB:\n${JSON.stringify(job)}\n\nLATEST RÉSUMÉ:\n${resume}`,text:{format:{type:"json_schema",name:"outreach_plan",strict:true,schema}}})});if(!response.ok)throw new Error(`OpenAI outreach research failed (${response.status})`);const data=await response.json() as {output_text?:string};const plan=planSchema.parse(JSON.parse(data.output_text||"{}"));await saveGeneration("job",job.id,"outreach_plan",fingerprint,plan);return plan}catch(error){console.error("AI outreach fallback",error);return fallback}
}
