import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/supabase/config";
const schema=z.object({email:z.string().email()});
export async function POST(request:Request){const parsed=schema.safeParse(Object.fromEntries(await request.formData()));if(!parsed.success)return NextResponse.redirect(new URL("/forgot-password?error=Enter+a+valid+email",request.url),303);const {url,key}=supabaseConfig();
  // Recovery emails are commonly opened in a different browser from the one
  // that requested them. An implicit one-time recovery link avoids depending
  // on a browser-local PKCE verifier while Supabase still validates the token.
  const supabase=createClient(url,key,{auth:{flowType:"implicit",persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const redirectTo=new URL("/auth/update-password",request.url).toString();
  const {error}=await supabase.auth.resetPasswordForEmail(parsed.data.email,{redirectTo});if(error){console.error("Password recovery email failed",{status:error.status,code:error.code,message:error.message});const message=error.status===429||/rate limit/i.test(error.message)?"Supabase's+free+mailer+allows+2+emails+per+hour.+Please+wait+one+hour,+then+send+one+new+link.":"Supabase+could+not+send+the+password+email.+Please+try+again";return NextResponse.redirect(new URL(`/forgot-password?error=${message}`,request.url),303);}return NextResponse.redirect(new URL("/login?message=Check+your+email+for+the+newest+secure+password+link",request.url),303);}
