import { NextResponse } from "next/server";
import { PREVIEW_COOKIE, previewAvailable } from "@/lib/preview";

export async function POST(request:Request){
  if(!previewAvailable()) return NextResponse.json({error:"Preview mode is unavailable."},{status:404});
  const response=NextResponse.redirect(new URL("/",request.url),303);
  // This cookie contains no identity or secret. It is readable by the local UI
  // solely so the auth callback bridge does not undo development preview mode.
  response.cookies.set(PREVIEW_COOKIE,"1",{httpOnly:false,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*8});
  return response;
}
