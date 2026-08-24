import { z } from "zod";
import { updateCareerEvidence } from "@/lib/repositories/career-truth";
const schema=z.object({content:z.string().trim().min(10).max(5000),verified:z.boolean(),tags:z.array(z.string().max(100)).max(30)});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const parsed=schema.safeParse(await request.json());if(!parsed.success)return Response.json({error:"Check the evidence wording and tags."},{status:400});const {id}=await params;await updateCareerEvidence(id,parsed.data);return Response.json({ok:true})}catch(error){return Response.json({error:error instanceof Error?error.message:"Could not update evidence."},{status:500})}}
