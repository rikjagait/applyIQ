import { z } from "zod";
import { saveCareerBreakLanguage } from "@/lib/repositories/career-truth";
const schema=z.object({language:z.string().trim().max(3000)});
export async function PATCH(request:Request){try{const parsed=schema.safeParse(await request.json());if(!parsed.success)return Response.json({error:"Approved language is too long."},{status:400});await saveCareerBreakLanguage(parsed.data.language);return Response.json({ok:true})}catch(error){return Response.json({error:error instanceof Error?error.message:"Could not save approved language."},{status:500})}}
