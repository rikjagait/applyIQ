import { getJob } from "@/lib/repositories/jobs";
import { downloadMasterResume } from "@/lib/repositories/resumes";
import { tailorOriginalDocx } from "@/lib/tailor-docx";
import { getApplicationStudio } from "@/lib/ai/application-studio-generation";

export const runtime="nodejs";
export async function POST(request:Request,{params}:{params:Promise<{jobId:string}>}){
  try{
    const {jobId}=await params;const job=await getJob(jobId);
    if(!job)return Response.json({error:"Job not found"},{status:404});
    const payload=await request.json().catch(()=>({})) as {acceptedChanges?:unknown};
    let acceptedChanges=Array.isArray(payload.acceptedChanges)?payload.acceptedChanges.filter((item):item is {original:string;tailored:string}=>Boolean(item&&typeof item==="object"&&typeof (item as {original?:unknown}).original==="string"&&typeof (item as {tailored?:unknown}).tailored==="string")):[];
    if(!acceptedChanges.length&&payload.acceptedChanges&&typeof payload.acceptedChanges==="object"){
      const studio=await getApplicationStudio(job);const byId=new Map(studio.changes.map(item=>[item.id,item]));
      acceptedChanges=Object.entries(payload.acceptedChanges).flatMap(([id,tailored])=>{const change=byId.get(id);return change&&typeof tailored==="string"?[{original:change.original,tailored}]:[]});
    }
    const {master,buffer}=await downloadMasterResume();
    if(!/wordprocessingml|\.docx$/i.test(`${master.mimeType} ${master.name}`))return Response.json({error:"Upload the original résumé as a DOCX to preserve its formatting while tailoring."},{status:409});
    const tailored=await tailorOriginalDocx(buffer,acceptedChanges);
    const filename=`${job.company.replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase()}-tailored-resume.docx`;
    return new Response(new Uint8Array(tailored),{headers:{"content-type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","content-disposition":`attachment; filename="${filename}"`,"cache-control":"no-store"}});
  }catch(error){
    console.error("Template resume generation failed",error);
    const message=error instanceof Error&&error.message==="Master resume not found"?"Upload Neelam’s original DOCX as the master résumé first. ApplyIQ will then preserve its exact formatting.":"The format-preserving résumé could not be generated.";
    return Response.json({error:message},{status:error instanceof Error&&error.message==="Master resume not found"?409:500});
  }
}
