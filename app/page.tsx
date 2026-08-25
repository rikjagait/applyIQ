import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarClock, Link2 } from "lucide-react";
import { listJobs } from "@/lib/repositories/jobs";
import { JobRow } from "@/components/ui";
import { redirect } from "next/navigation";
import { DailyWelcome } from "@/components/daily-welcome";

export default async function HomePage({searchParams}:{searchParams:Promise<{code?:string;token_hash?:string;type?:string}>}){
  const callback=await searchParams;if(callback.code||callback.token_hash){const query=new URLSearchParams();if(callback.code)query.set("code",callback.code);if(callback.token_hash)query.set("token_hash",callback.token_hash);if(callback.type)query.set("type",callback.type);redirect(`/auth/callback?${query}`)}
  const jobs=await listJobs();const next=jobs.filter(job=>!["Rejected","Withdrawn","Closed"].includes(job.status)).slice(0,3);
  return <div className="content"><DailyWelcome/><nav className="workflow-path" aria-label="Job workflow">{[["1","Add job","/jobs/discover",Link2],["2","Jobs","/jobs",BriefcaseBusiness],["3","Interviews","/interviews",CalendarClock]].map(([number,label,href,Icon])=><Link href={href as string} key={label as string}><span>{number as string}</span><Icon size={16}/><strong>{label as string}</strong></Link>)}</nav>
    <section className="intake-launcher"><div className="intake-launcher-copy"><span className="launcher-icon"><Link2 size={18}/></span><div><h2>Add a job</h2><p>Paste a public posting to screen it against Neelam’s latest résumé.</p></div></div><form action="/jobs/new" method="get" className="quick-url-form"><input className="input" type="url" name="url" required aria-label="Public job posting URL" placeholder="Paste a job URL…"/><button className="btn primary" type="submit">Screen role <ArrowRight size={14}/></button></form></section>
    <section className="section"><div className="section-head"><div><div className="eyebrow">Your jobs</div><h2>Continue where you left off</h2></div><Link href="/jobs" className="btn">View all {jobs.length} <ArrowRight size={14}/></Link></div>{next.length?next.map(job=><JobRow key={job.id} job={job}/>):<div className="card empty"><h2>No jobs added yet</h2><p className="subtle">Only jobs Neelam adds through a URL will appear here.</p><Link className="btn primary" href="/jobs/discover">Add first job</Link></div>}</section>
  </div>
}
