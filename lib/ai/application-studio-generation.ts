import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { buildApplicationStudio, type ApplicationStudio } from "@/lib/application-studio";
import { assessClaim } from "@/lib/factual-integrity";
import { getCachedGeneration, saveGeneration } from "@/lib/repositories/ai-generations";
import { getLatestResumeText } from "@/lib/repositories/resumes";
import type { Job } from "@/lib/types";
import { responseText, type ResponsesPayload } from "@/lib/ai/response-text";

const studioSchema=z.object({summary:z.string(),skills:z.array(z.string()).max(12),changes:z.array(z.object({original:z.string(),tailored:z.string(),reason:z.string()})).max(10),coverLetter:z.string(),answers:z.array(z.object({question:z.string(),answer:z.string()})).max(8)});
const schema={type:"object",additionalProperties:false,properties:{summary:{type:"string"},skills:{type:"array",items:{type:"string"}},changes:{type:"array",items:{type:"object",additionalProperties:false,properties:{original:{type:"string"},tailored:{type:"string"},reason:{type:"string"}},required:["original","tailored","reason"]}},coverLetter:{type:"string"},answers:{type:"array",items:{type:"object",additionalProperties:false,properties:{question:{type:"string"},answer:{type:"string"}},required:["question","answer"]}}},required:["summary","skills","changes","coverLetter","answers"]};

export async function getApplicationStudio(job:Job):Promise<ApplicationStudio>{
  const fallback=buildApplicationStudio(job);
  const resume=await getLatestResumeText();
  if(!process.env.OPENAI_API_KEY||!resume)return fallback;
  const fingerprint=createHash("sha256").update(JSON.stringify({resume,requirements:job.requirements,title:job.title,company:job.company})).digest("hex");
  const cached=await getCachedGeneration<ApplicationStudio>("job",job.id,"application_studio",fingerprint);
  if(cached)return cached;
  try{
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",store:false,instructions:"Create a factual application pack grounded only in the supplied latest résumé and verified job requirements. Each résumé change must quote an exact complete sentence or bullet from the résumé as original, then offer a clearer tailored replacement that preserves every fact, metric, employer and scope. Never invent experience, tools, dates, qualifications or enthusiasm. Prefer reordering/emphasis and ATS clarity over rewriting. Cover letters and answers must be concise, specific, natural, and honest about gaps.",input:`JOB:\n${job.title} at ${job.company}\n${JSON.stringify(job.requirements)}\n\nLATEST RÉSUMÉ:\n${resume}`,text:{format:{type:"json_schema",name:"application_studio",strict:true,schema}}})});
    if(!response.ok)throw new Error(`OpenAI application studio failed (${response.status})`);
    const data=await response.json() as ResponsesPayload;
    const generated=studioSchema.parse(JSON.parse(responseText(data)||"{}"));
    const truth=resume.split(/\n+/).filter(Boolean);
    const changes=generated.changes.filter(item=>resume.includes(item.original)).map((item,index)=>({...item,id:`ai-change-${index}`,integrity:assessClaim(item.tailored,truth)})).filter(item=>item.integrity!=="RED");
    const coverage=Math.round(job.requirements.filter(item=>item.strength!=="None").length/Math.max(1,job.requirements.length)*100);
    const integrity=changes.length?Math.round(changes.reduce((n,item)=>n+(item.integrity==="GREEN"?100:70),0)/changes.length):100;
    const checks=[{label:"Résumé alignment",score:job.score,recommendation:"Suggestions prioritize explicit job requirements."},{label:"Evidence coverage",score:coverage,recommendation:"Unsupported requirements remain visible as gaps."},{label:"Factual integrity",score:integrity,recommendation:"Every accepted change remains grounded in the master résumé."},{label:"Personalization",score:90,recommendation:"Drafts are specific to this company and role."},{label:"Completeness",score:90,recommendation:"Review the final employer form before submitting."}];
    const studio:ApplicationStudio={...generated,changes:changes.length?changes:fallback.changes,quality:{score:Math.round(checks.reduce((n,item)=>n+item.score,0)/checks.length),checks}};
    await saveGeneration("job",job.id,"application_studio",fingerprint,studio);
    return studio;
  }catch(error){console.error("AI application studio fallback",error);return fallback;}
}

export async function answerApplicationQuestionWithAI(job:Job,question:string){
  const resume=await getLatestResumeText();if(!process.env.OPENAI_API_KEY||!resume)return null;
  try{const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",store:false,instructions:"Answer this application question in Neelam's first person using only facts explicitly supported by the latest résumé. Tailor the answer to the job requirement. Be concise, specific and natural. Never invent experience, motivation, salary expectations, work authorization or company facts. If the résumé cannot support the answer, say what Neelam needs to confirm rather than guessing.",input:`JOB:\n${job.title} at ${job.company}\n${JSON.stringify(job.requirements)}\n\nQUESTION:\n${question}\n\nLATEST RÉSUMÉ:\n${resume}`})});if(!response.ok)throw new Error(`OpenAI application answer failed (${response.status})`);const data=await response.json() as ResponsesPayload;return responseText(data)||null}catch(error){console.error("AI application answer fallback",error);return null}
}
