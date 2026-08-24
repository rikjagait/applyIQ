import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });
export async function POST(request: Request) {
  const data = Object.fromEntries(await request.formData());
  const parsed = schema.safeParse(data);
  if (!parsed.success) return NextResponse.redirect(new URL("/login?error=Enter+a+valid+email+and+password", request.url), 303);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return NextResponse.redirect(new URL("/login?error=Sign-in+failed", request.url), 303);
  return NextResponse.redirect(new URL("/", request.url), 303);
}
