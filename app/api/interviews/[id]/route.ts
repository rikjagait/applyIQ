import { z } from "zod";
import { updateInterviewOutcome } from "@/lib/repositories/interviews";
const schema=z.object({outcome:z.enum(["Pending","Progressing","Rejected","Offer","Withdrawn"]),notes:z.string().trim().max(10000)});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const parsed=schema.safeParse(await request.json());if(!parsed.success)return Response.json({error:"Choose an outcome and check the notes."},{status:400});const {id}=await params;await updateInterviewOutcome(id,parsed.data);return Response.json({ok:true})}catch(error){return Response.json({error:error instanceof Error?error.message:"Could not save interview outcome."},{status:500})}}
