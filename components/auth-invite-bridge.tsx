"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthInviteBridge(){const path=usePathname();useEffect(()=>{if(process.env.NEXT_PUBLIC_APPLYIQ_PUBLIC_DEMO==="true")return;if(path!=="/")return;if(document.cookie.split("; ").includes("applyiq_preview=1"))return;const hash=new URLSearchParams(window.location.hash.slice(1));const accessToken=hash.get("access_token");const refreshToken=hash.get("refresh_token");const hashError=hash.get("error_description");if(hashError){window.location.replace(`/login?error=${encodeURIComponent(hashError)}`);return;}if(accessToken&&refreshToken){createSupabaseBrowserClient().auth.setSession({access_token:accessToken,refresh_token:refreshToken}).then(({error})=>{if(error){window.location.replace("/login?error=Invitation+could+not+be+verified");return;}history.replaceState(null,"",window.location.pathname);window.location.replace("/auth/update-password");});return;}createSupabaseBrowserClient().auth.getSession().then(({data})=>{if(!data.session)window.location.replace("/login");});},[path]);return null;}
