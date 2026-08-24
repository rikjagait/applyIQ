import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, Link2, MessageCircle, Search, Send } from "lucide-react";
import { listJobs } from "@/lib/repositories/jobs";
import { JobRow } from "@/components/ui";
import { redirect } from "next/navigation";
import { DailyWelcome } from "@/components/daily-welcome";

export default async function HomePage({searchParams}:{searchParams:Promise<{code?:string;token_hash?:string;type?:string}>}) {
  const callback=await searchParams;if(callback.code||callback.token_hash){const query=new URLSearchParams();if(callback.code)query.set("code",callback.code);if(callback.token_hash)query.set("token_hash",callback.token_hash);if(callback.type)query.set("type",callback.type);redirect(`/auth/callback?${query}`);}
  const jobs=await listJobs(); const top = jobs.filter(j => j.score >= 80).slice(0, 3); const applications=jobs.filter(j=>!["Discovered","Shortlisted"].includes(j.status));
  return <div className="content">
    <DailyWelcome />
    <nav className="workflow-path" aria-label="Job search workflow">{[["1","Find","/jobs/discover",Search],["2","Review","/jobs",FileCheck2],["3","Apply","/pipeline",Send],["4","Connect","/contacts",MessageCircle]].map(([number,label,href,Icon])=><Link href={href as string} key={label as string}><span>{number as string}</span><Icon size={16}/><strong>{label as string}</strong></Link>)}</nav>
    <section className="intake-launcher" aria-labelledby="add-opportunity-title">
      <div className="intake-launcher-copy"><span className="launcher-icon"><Link2 size={18}/></span><div><h2 id="add-opportunity-title">Add an opportunity</h2><p>Paste any public job posting and ApplyIQ will import, structure and score it.</p></div></div>
      <form action="/jobs/new" method="get" className="quick-url-form"><input className="input" type="url" name="url" required aria-label="Public job posting URL" placeholder="Paste a job URL…"/><button className="btn primary" type="submit">Import & analyze <ArrowRight size={14}/></button></form>
      <span className="launcher-or">or</span><Link className="btn source-jobs-btn" href="/jobs/discover"><Building2 size={14}/>Source from companies</Link>
    </section>
    <div className="grid simple-home-grid section">
      <section><div className="section-head"><div><div className="eyebrow">Recommended next</div><h2>Review your strongest matches</h2></div><Link href="/jobs" className="btn">See all {jobs.length} jobs <ArrowRight size={14}/></Link></div>{top.length?top.slice(0,2).map(job => <JobRow key={job.id} job={job}/>):<div className="card empty"><h2>Your shortlist starts here</h2><p className="subtle">Add a job URL or find roles at a company.</p></div>}</section>
      <aside className="card next-step-card"><div className="eyebrow">At a glance</div><h2>One step at a time</h2><div className="simple-stats"><Link href="/jobs"><strong>{top.length}</strong><span>strong matches to review</span></Link><Link href="/pipeline"><strong>{applications.length}</strong><span>applications in progress</span></Link><Link href="/follow-ups"><strong>{jobs.filter(j=>j.status==="Applied").length}</strong><span>responses to follow up</span></Link></div></aside>
    </div>
  </div>;
}
