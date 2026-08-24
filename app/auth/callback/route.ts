import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request:Request){const url=new URL(request.url);const code=url.searchParams.get("code");const tokenHash=url.searchParams.get("token_hash");const type=url.searchParams.get("type") as EmailOtpType|null;const supabase=await createSupabaseServerClient();let error:Error|null=null;
  if(code){const result=await supabase.auth.exchangeCodeForSession(code);error=result.error;}
  else if(tokenHash&&type){const result=await supabase.auth.verifyOtp({token_hash:tokenHash,type});error=result.error;}
  else return NextResponse.redirect(new URL("/login?error=Invitation+link+is+missing+credentials",url));
  if(error)return NextResponse.redirect(new URL("/login?error=Invitation+link+is+invalid+or+expired",url));
  return NextResponse.redirect(new URL("/auth/update-password",url));
}
