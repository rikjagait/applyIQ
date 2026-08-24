import type { Job } from "@/lib/types";
import Link from "next/link";

export function PageHead({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: React.ReactNode }) {
  return <div className="page-head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{copy && <p className="subtle">{copy}</p>}</div>{action}</div>;
}
export function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) { return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div>{note && <div className="metric-note">{note}</div>}</div>; }
export function CategoryPill({ category }: Pick<Job, "category">) { const cls = category === "Good / Stretch" ? "stretch" : category === "Weak Match" ? "weak" : ""; return <span className={`pill ${cls}`}>{category}</span>; }
export function JobRow({ job }: { job: Job }) { return <Link href={`/jobs/${job.id}`} className="card opportunity"><div><h3>{job.title}</h3><div className="job-company">{job.company}</div><div className="job-meta"><span>{job.location}</span><span>{job.arrangement}</span><span>{job.salary ?? "Salary not listed"}</span><span>{job.postedDaysAgo}d ago</span></div><p className="job-reason">{job.summary}</p></div><div className="score"><strong>{job.score}</strong><span className="subtle" style={{fontSize: 10}}>ApplyIQ score</span><div style={{marginTop: 10}}><CategoryPill category={job.category}/></div></div></Link>; }
