import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { Job } from "@/lib/types";
import { getCachedGeneration, saveGeneration } from "@/lib/repositories/ai-generations";
import { responseText, type ResponsesPayload } from "@/lib/ai/response-text";

const overviewSchema=z.object({bullets:z.array(z.string().min(12)).min(2).max(3)});
const schema={type:"object",additionalProperties:false,properties:{bullets:{type:"array",minItems:2,maxItems:3,items:{type:"string"}}},required:["bullets"]};

export async function getRoleOverview(job:Job){
  const fallback=[`A ${job.roleFamily.toLowerCase()} role at ${job.company}, based in ${job.location}.`,job.summary].filter(Boolean).slice(0,3);
  if(!process.env.OPENAI_API_KEY||!job.description)return fallback;
  const fingerprint=createHash("sha256").update(JSON.stringify({version:1,title:job.title,company:job.company,description:job.description})).digest("hex");
  const cached=await getCachedGeneration<z.infer<typeof overviewSchema>>("job",job.id,"role_overview",fingerprint);if(cached)return cached.bullets;
  try{const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-luna",store:false,instructions:"Explain this role in exactly 3 compact, plain-English bullets: (1) the purpose of the role, (2) the main work and outcomes, and (3) the principal teams or customers it works with. Use only the vacancy. Do not describe candidate qualifications, benefits, employer marketing, or application logistics. Each bullet must be one concise sentence.",input:`TITLE: ${job.title}\nEMPLOYER: ${job.company}\nVACANCY:\n${job.description}`,text:{format:{type:"json_schema",name:"role_overview",strict:true,schema}}})});if(!response.ok)throw new Error(`Role overview failed (${response.status})`);const data=await response.json() as ResponsesPayload;const parsed=overviewSchema.parse(JSON.parse(responseText(data)||"{}"));await saveGeneration("job",job.id,"role_overview",fingerprint,parsed);return parsed.bullets}catch(error){console.error("Role overview fallback",error);return fallback}
}
