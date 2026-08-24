import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PREVIEW_COOKIE } from "@/lib/preview";
export async function POST(request: Request) { const supabase = await createSupabaseServerClient(); await supabase.auth.signOut(); const response=NextResponse.redirect(new URL("/login", request.url), 303);response.cookies.delete(PREVIEW_COOKIE);return response; }
