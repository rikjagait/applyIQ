"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, BriefcaseBusiness, CalendarClock, ContactRound, FileText, Home, Library, PlusCircle, Settings } from "lucide-react";
import { AuthInviteBridge } from "@/components/auth-invite-bridge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const primaryLinks = [
  ["Home", "/", Home], ["Add job", "/jobs/discover", PlusCircle], ["Jobs", "/jobs", BriefcaseBusiness],
  ["Interviews", "/interviews", CalendarClock],
] as const;
const toolLinks = [
  ["Outreach", "/contacts", ContactRound], ["Follow-ups", "/follow-ups", CalendarClock],
  ["Résumé", "/resumes", FileText], ["Career profile", "/experience", Library], ["Insights", "/insights", BarChart3], ["Settings", "/settings", Settings],
] as const;
function linkIsActive(path:string,href:string){if(href==="/")return path==="/";if(href==="/jobs")return path==="/jobs"||path.startsWith("/jobs/")&&!path.startsWith("/jobs/discover")&&!path.startsWith("/jobs/today");return path===href||path.startsWith(`${href}/`)}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const connected=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const [authenticated,setAuthenticated]=useState(false);
  useEffect(()=>{if(!connected)return;const supabase=createSupabaseBrowserClient();supabase.auth.getSession().then(({data})=>setAuthenticated(Boolean(data.session)));const {data}=supabase.auth.onAuthStateChange((_event,session)=>setAuthenticated(Boolean(session)));return()=>data.subscription.unsubscribe();},[connected]);
  const publicDemo=process.env.NEXT_PUBLIC_APPLYIQ_PUBLIC_DEMO==="true"&&!authenticated;
  if (path === "/login" || path === "/forgot-password" || path.startsWith("/auth/update-password")) return children;
  return <><AuthInviteBridge/><div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">A</span>ApplyIQ</div>
      <nav className="nav" aria-label="Main navigation"><span className="nav-label">Your workflow</span>{primaryLinks.map(([label, href, Icon],index) => <Link key={href} href={href} className={linkIsActive(path,href) ? "active" : ""}><em>{index||""}</em><Icon size={16}/>{label}</Link>)}<details className="more-nav" open={toolLinks.some(([,href])=>linkIsActive(path,href))}><summary>More tools <span>+</span></summary><div>{toolLinks.map(([label, href, Icon])=><Link key={href} href={href} className={linkIsActive(path,href)?"active":""}><Icon size={15}/>{label}</Link>)}</div></details></nav>
      <div className="user"><span className="avatar">NJ</span><div><strong style={{fontSize: 13}}>Neelam Jagait</strong><small>{publicDemo?"Demo workspace":"Private workspace"}</small></div></div>
    </aside>
    <main className="main"><header className="topbar"><button className="icon-btn" type="button" onClick={()=>router.back()} aria-label="Go back" title="Back"><ArrowLeft size={16}/></button><div className="topbar-account"><span className={publicDemo?"pill demo":connected?"pill workspace-status":"demo"}><i/>{publicDemo?"Public demo":connected?"Private workspace":"Demo mode"}</span>{connected&&publicDemo&&<Link className="btn quiet-btn" href="/login">Private sign in</Link>}{connected&&!publicDemo&&<form action="/auth/logout" method="post"><button className="btn quiet-btn" type="submit">Sign out</button></form>}</div></header>{children}</main>
  </div></>;
}
