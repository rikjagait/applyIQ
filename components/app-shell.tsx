"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BarChart3, BriefcaseBusiness, Building2, CalendarClock, ContactRound, FileText, Gauge, Home, Library, ListChecks, Search, Settings } from "lucide-react";
import { AuthInviteBridge } from "@/components/auth-invite-bridge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const primaryLinks = [
  ["Home", "/", Home], ["Find jobs", "/jobs/discover", Search], ["Review jobs", "/jobs", BriefcaseBusiness],
  ["Applications", "/pipeline", Gauge], ["Outreach", "/contacts", ContactRound], ["Interviews", "/interviews", Building2],
] as const;
const toolLinks = [
  ["Application tracker", "/applications", ListChecks], ["Follow-ups", "/follow-ups", CalendarClock],
  ["Résumé", "/resumes", FileText], ["Career profile", "/experience", Library], ["Insights", "/insights", BarChart3], ["Settings", "/settings", Settings],
] as const;
const links=[...primaryLinks,...toolLinks];
function linkIsActive(path:string,href:string){if(href==="/")return path==="/";if(href==="/jobs")return path==="/jobs"||path.startsWith("/jobs/")&&!path.startsWith("/jobs/discover")&&!path.startsWith("/jobs/today");return path===href||path.startsWith(`${href}/`)}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const connected=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const [authenticated,setAuthenticated]=useState(false);
  useEffect(()=>{if(!connected)return;const supabase=createSupabaseBrowserClient();supabase.auth.getSession().then(({data})=>setAuthenticated(Boolean(data.session)));const {data}=supabase.auth.onAuthStateChange((_event,session)=>setAuthenticated(Boolean(session)));return()=>data.subscription.unsubscribe();},[connected]);
  const publicDemo=process.env.NEXT_PUBLIC_APPLYIQ_PUBLIC_DEMO==="true"&&!authenticated;
  const currentSection = links.find(([, href]) => linkIsActive(path,href))?.[1] ?? "/";
  if (path === "/login" || path === "/forgot-password" || path.startsWith("/auth/update-password")) return children;
  return <><AuthInviteBridge/><div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">A</span>ApplyIQ</div>
      <nav className="nav" aria-label="Main navigation"><span className="nav-label">Your workflow</span>{primaryLinks.map(([label, href, Icon],index) => <Link key={href} href={href} className={linkIsActive(path,href) ? "active" : ""}><em>{index||""}</em><Icon size={16}/>{label}</Link>)}<details className="more-nav" open={toolLinks.some(([,href])=>linkIsActive(path,href))}><summary>More tools <span>+</span></summary><div>{toolLinks.map(([label, href, Icon])=><Link key={href} href={href} className={linkIsActive(path,href)?"active":""}><Icon size={15}/>{label}</Link>)}</div></details></nav>
      <div className="user"><span className="avatar">NJ</span><div><strong style={{fontSize: 13}}>Neelam Jagait</strong><small>{publicDemo?"Demo workspace":"Private workspace"}</small></div></div>
    </aside>
    <main className="main"><header className="topbar"><div className="history-nav" aria-label="Page history"><button className="icon-btn" type="button" onClick={()=>router.back()} aria-label="Go back" title="Back"><ArrowLeft size={16}/></button><button className="icon-btn" type="button" onClick={()=>window.history.forward()} aria-label="Go forward" title="Forward"><ArrowRight size={16}/></button></div><label className="quick-nav"><span>Go to</span><select value={currentSection} onChange={(event)=>router.push(event.target.value)} aria-label="Navigate to a workspace section"><optgroup label="Your workflow">{primaryLinks.map(([label, href])=><option key={href} value={href}>{label}</option>)}</optgroup><optgroup label="More tools">{toolLinks.map(([label, href])=><option key={href} value={href}>{label}</option>)}</optgroup></select></label><div className="topbar-account"><span className={publicDemo?"pill demo":connected?"pill workspace-status":"demo"}><i/>{publicDemo?"Public demo":connected?"Private workspace":"Demo mode"}</span>{connected&&publicDemo&&<Link className="btn quiet-btn" href="/login">Private sign in</Link>}{connected&&!publicDemo&&<form action="/auth/logout" method="post"><button className="btn quiet-btn" type="submit">Sign out</button></form>}</div></header>{children}</main>
  </div></>;
}
