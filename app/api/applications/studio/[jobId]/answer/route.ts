import { z } from "zod";
import { getJob } from "@/lib/repositories/jobs";
import { answerCustomApplicationQuestion } from "@/lib/application-studio";
const schema=z.object({question:z.string().trim().min(5).max(2000)});
export async function POST(request:Request,{params}:{params:Promise<{jobId:string}>}){const parsed=schema.safeParse(await request.json());if(!parsed.success)return Response.json({error:"Paste a complete application question."},{status:400});const {jobId}=await params;const job=await getJob(jobId);if(!job)return Response.json({error:"Job not found."},{status:404});return Response.json({answer:answerCustomApplicationQuestion(job,parsed.data.question)})}
