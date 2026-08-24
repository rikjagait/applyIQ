import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { requireUser } from "@/lib/supabase/server";
import { resumeUploadSchema } from "@/lib/validation";

export const runtime="nodejs";
const DOCX="application/vnd.openxmlformats-officedocument.wordprocessingml.document";
async function extractText(buffer:Buffer,mime:string){if(mime===DOCX)return (await mammoth.extractRawText({buffer})).value.trim();if(mime==="application/pdf"){const parser=new PDFParse({data:new Uint8Array(buffer)});try{return (await parser.getText()).text.trim();}finally{await parser.destroy();}}throw new Error("Only DOCX and PDF résumés are supported.");}

export async function POST(request:Request){try{const file=(await request.formData()).get("resume");if(!(file instanceof File))return NextResponse.json({error:"Choose a résumé file."},{status:422});const valid=resumeUploadSchema.safeParse({name:file.name,size:file.size});if(!valid.success)return NextResponse.json({error:"Use a DOCX or PDF file no larger than 10 MB."},{status:422});const mime=file.type||(/\.pdf$/i.test(file.name)?"application/pdf":DOCX);const buffer=Buffer.from(await file.arrayBuffer());const content=await extractText(buffer,mime);if(content.length<200)return NextResponse.json({error:"The résumé did not contain enough readable text."},{status:422});
    const {supabase,user}=await requireUser();const {data:profile}=await supabase.from("profiles").select("id").eq("auth_user_id",user.id).single();if(!profile)return NextResponse.json({error:"Private profile not found."},{status:404});const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-");const path=`${user.id}/${crypto.randomUUID()}-${safeName}`;const {error:storageError}=await supabase.storage.from("resumes").upload(path,buffer,{contentType:mime,upsert:false});if(storageError)throw storageError;
    await supabase.from("resumes").update({is_master:false}).eq("profile_id",profile.id).eq("is_master",true);const {data:resume,error:resumeError}=await supabase.from("resumes").insert({profile_id:profile.id,name:file.name,is_master:true,private_storage_path:path,mime_type:mime}).select("id").single();if(resumeError){await supabase.storage.from("resumes").remove([path]);throw resumeError;}const {error:versionError}=await supabase.from("resume_versions").insert({resume_id:resume.id,version:1,content:{rawText:content},changes:[],reasoning_summary:"Original text extracted from user-uploaded master résumé."});if(versionError)throw versionError;
    return NextResponse.json({ok:true,name:file.name,characters:content.length});
  }catch(error){console.error("Resume upload failed",error);return NextResponse.json({error:"The résumé could not be stored. No Career Truth facts were changed."},{status:500});}}
