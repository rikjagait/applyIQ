import "server-only";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const PREVIEW_COOKIE = "applyiq_preview";
export function publicDemoEnabled(){return process.env.NEXT_PUBLIC_APPLYIQ_PUBLIC_DEMO === "true";}
export function previewAvailable(){return process.env.NODE_ENV === "development" || publicDemoEnabled();}
export async function isPreviewMode(){
  // Public demo is an unauthenticated fallback, not a replacement for a real session.
  if(isSupabaseConfigured()){
    const supabase=await createSupabaseServerClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(user)return false;
  }
  return publicDemoEnabled() || (previewAvailable() && (await cookies()).get(PREVIEW_COOKIE)?.value === "1");
}
