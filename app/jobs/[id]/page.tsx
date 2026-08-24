import { notFound } from "next/navigation";
import Link from "next/link";
import { getJob } from "@/lib/repositories/jobs";
import { CategoryPill, PageHead } from "@/components/ui";
import { getApplicationRecord } from "@/lib/repositories/applications";
import { ApplicationRecord } from "@/components/application-record";
import { JobFeedback } from "@/components/job-feedback";

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const job = await getJob(id); if (!job) notFound();const application=await getApplicationRecord(id);
  return <div className="content"><PageHead eyebrow={`${job.company} · ${job.location}`} title={job.title} copy={`${job.arrangement} · ${job.salary ?? "Salary not listed"} · Posted ${job.postedDaysAgo} days ago`} action={<div className="actions"><button className="btn">Save</button><button className="btn primary">Start application</button></div>}/><div className="detail-grid"><div className="stack">
    <section className="card"><h2>ApplyIQ assessment</h2><p>{job.summary}</p><div className="grid two-col"><div><h3>Why you fit</h3><ul className="list">{job.strengths.map(s=><li key={s}>{s}</li>)}</ul></div><div><h3>Potential gaps</h3><ul className="list">{job.gaps.map(s=><li key={s}>{s}</li>)}</ul></div></div></section>
    <section className="card"><div className="section-head"><h2>Requirements matrix</h2><span className="subtle">Evidence from verified Career Truth</span></div><div className="table-wrap"><table><thead><tr><th>Requirement</th><th>Importance</th><th>Evidence</th><th>Strength</th><th>Gap</th></tr></thead><tbody>{job.requirements.map(r=><tr key={r.requirement}><td><strong>{r.requirement}</strong></td><td>{r.importance}</td><td>{r.evidence}</td><td>{r.strength}</td><td>{r.gap}</td></tr>)}</tbody></table></div></section>
    <section className="card"><h2>Application strategy</h2><p>Lead with national-scale program ownership, translate partnership work into senior stakeholder language, and use the 30% engagement increase as the clearest measurable outcome. Address the industry transition directly without overstating experience.</p></section>
    <ApplicationRecord jobId={job.id} initial={application}/>
  </div><aside className="stack"><div className="card match-card"><span className="match-label">ApplyIQ match</span><div className="score-ring" style={{"--score":`${job.score}%`} as React.CSSProperties} data-score={job.score}/><CategoryPill category={job.category}/><div className="probability"><span>Estimated interview probability</span><strong>{job.probability}%</strong></div><p className="estimate-note">Directional estimate based on your verified experience and the role requirements.</p></div><div className="card"><h3>Application actions</h3><div className="stack" style={{marginTop:14,gap:8}}><Link className="btn primary" href={`/jobs/${job.id}/studio`}>Open Application Studio</Link><Link className="btn" href={`/contacts?job=${job.id}`}>Find relevant contacts</Link><JobFeedback jobId={job.id}/></div></div><div className="card"><h3>Source</h3><p className="subtle">{job.source}</p></div></aside></div></div>;
}
