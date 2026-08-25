import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { listJobs } from "@/lib/repositories/jobs";
import { CategoryPill, PageHead } from "@/components/ui";

export default async function JobsPage(){
  const jobs=(await listJobs()).filter(job=>["Discovered","Shortlisted"].includes(job.status));
  return <div className="content"><PageHead eyebrow="Step 2 · Decide where to focus" title="Shortlist" copy="Compare screened roles, open the full assessment, and start only the applications worth Neelam’s time." action={<Link className="btn primary" href="/jobs/discover#paste-job"><Plus size={14}/>Add another job</Link>}/>
    <div className="filters"><div className="input" style={{display:"flex",gap:8,alignItems:"center"}}><Search size={15}/><span className="subtle">Search title, company or keyword</span></div><select className="input" aria-label="Match category"><option>All match levels</option><option>Strong Match</option><option>Good / Stretch</option></select><select className="input" aria-label="Work arrangement"><option>Any arrangement</option><option>Remote</option><option>Hybrid</option></select></div>
    {jobs.length?<div className="card table-wrap"><table><thead><tr><th>Opportunity</th><th>Location</th><th>Match</th><th>Salary</th><th>Status</th><th>Posted</th></tr></thead><tbody>{jobs.map(job=><tr key={job.id}><td><Link href={`/jobs/${job.id}`}><strong>{job.title}</strong><div className="subtle">{job.company}</div></Link></td><td>{job.location}<div className="subtle">{job.arrangement}</div></td><td><strong style={{color:"var(--green)"}}>{job.score}</strong><div style={{marginTop:5}}><CategoryPill category={job.category}/></div></td><td>{job.salary??"Not listed"}</td><td>{job.status}</td><td>{job.postedDaysAgo}d ago</td></tr>)}</tbody></table></div>:<div className="card empty"><h2>No shortlisted jobs yet</h2><p className="subtle">Paste a job URL, review its screening, then add it to this shortlist.</p><Link className="btn primary" href="/jobs/discover#paste-job">Add first job</Link></div>}
  </div>;
}
