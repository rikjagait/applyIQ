import "server-only";
import { isPreviewMode } from "@/lib/preview";
import { createSupabaseServerClient, requireUser } from "@/lib/supabase/server";

export type MasterResume={id:string;name:string;mimeType:string;storagePath:string;createdAt:string};
export async function getMasterResume():Promise<MasterResume|null>{if(await isPreviewMode())return null;const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data:profile}=await supabase.from("profiles").select("id").eq("auth_user_id",user.id).single();if(!profile)return null;const {data}=await supabase.from("resumes").select("id,name,mime_type,private_storage_path,created_at").eq("profile_id",profile.id).eq("is_master",true).maybeSingle();return data?{id:data.id,name:data.name,mimeType:data.mime_type,storagePath:data.private_storage_path,createdAt:data.created_at}:null}
export async function downloadMasterResume(){const {supabase,user}=await requireUser();const master=await getMasterResume();if(!master)throw new Error("Master resume not found");if(!master.storagePath.startsWith(`${user.id}/`))throw new Error("Master resume path is invalid");const {data,error}=await supabase.storage.from("resumes").download(master.storagePath,{}, {cache:"no-store"});if(error)throw error;return {master,buffer:Buffer.from(await data.arrayBuffer())}}
