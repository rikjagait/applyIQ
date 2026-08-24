import { listJobs } from "@/lib/repositories/jobs";
import { JobRow, PageHead } from "@/components/ui";

export default async function TodayPage() { const recommended = (await listJobs()).filter(j => j.score >= 65).sort((a,b)=>b.score-a.score); return <div className="content"><PageHead eyebrow="Sunday’s shortlist" title="Today’s opportunities" copy={`${recommended.length} roles clear your quality threshold. Weak matches are excluded.`}/><div style={{maxWidth:950}}>{recommended.length?recommended.map(job => <JobRow key={job.id} job={job}/>):<div className="card empty"><h2>No qualified opportunities yet</h2><p className="subtle">Analyze job URLs and strong matches will appear here automatically.</p></div>}</div></div>; }
