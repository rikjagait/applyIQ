import { notFound } from "next/navigation";
import Link from "next/link";
import { getJob } from "@/lib/repositories/jobs";
import { CategoryPill, PageHead } from "@/components/ui";
import { getApplicationRecord } from "@/lib/repositories/applications";
import { ApplicationRecord } from "@/components/application-record";
import { JobFeedback } from "@/components/job-feedback";
import { StartApplicationButton } from "@/components/start-application-button";
import { ReanalyzeJobButton } from "@/components/reanalyze-job-button";
import { RequirementsMatrix } from "@/components/requirements-matrix";

export default async function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const job = await getJob(id); if (!job) notFound();const application=await getApplicationRecord(id);
  return <div className="content"><PageHead eyebrow={`${job.company} · ${job.location}`} title={job.title} copy={`${job.arrangement} · ${job.salary ?? "Salary not listed"} · Posted ${job.postedDaysAgo} days ago`} action={<div className="actions"><Link className="btn" href="/jobs">Back to jobs</Link><ReanalyzeJobButton jobId={job.id}/><StartApplicationButton jobId={job.id}/></div>}/><section className="card top-application-actions"><div><div className="eyebrow">Choose your next step</div><h2>Application actions</h2><p className="subtle">Prepare the application, find someone at the company, or tell ApplyIQ this role is not right.</p></div><div className="top-application-buttons"><Link className="btn primary" href={`/jobs/${job.id}/studio`}>Open Application Studio</Link><Link className="btn" href={`/contacts?job=${job.id}`}>Find relevant contacts</Link><JobFeedback jobId={job.id}/></div></section><div className="detail-grid"><div className="stack">
    <section className="card"><h2>ApplyIQ assessment</h2><p>{job.summary}</p><div className="grid two-col"><div><h3>Why you fit</h3><ul className="list">{job.strengths.map(s=><li key={s}>{s}</li>)}</ul></div><div><h3>Potential gaps</h3><ul className="list">{job.gaps.map(s=><li key={s}>{s}</li>)}</ul></div></div></section>
    <section className="card"><div className="section-head"><div><h2>Candidate requirements</h2><p className="subtle">Only explicit qualifications from the posting, checked against the latest résumé.</p></div></div><RequirementsMatrix requirements={job.requirements}/></section>
    <section className="card"><h2>Application strategy</h2><p>Lead with national-scale program ownership, translate partnership work into senior stakeholder language, and use the 30% engagement increase as the clearest measurable outcome. Address the industry transition directly without overstating experience.</p></section>
    <ApplicationRecord jobId={job.id} initial={application}/>
  </div><aside className="stack"><div className="card match-card"><span className="match-label">ApplyIQ match</span><div className="score-ring" style={{"--score":`${job.score}%`} as React.CSSProperties} data-score={job.score}/><CategoryPill category={job.category}/><div className="probability"><span>Estimated interview probability</span><strong>{job.probability}%</strong></div><p className="estimate-note">Directional estimate based on your verified experience and the role requirements.</p></div><div className="card"><h3>Source</h3><p className="subtle">{job.source}</p>{job.sourceUrl?<a className="btn" href={job.sourceUrl} target="_blank" rel="noreferrer" style={{marginTop:14}}>View original posting</a>:null}</div></aside></div></div>;
}
