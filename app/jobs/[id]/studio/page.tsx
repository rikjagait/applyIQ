import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { PageHead } from "@/components/ui";
import { getJob } from "@/lib/repositories/jobs";
import { getApplicationStudio } from "@/lib/ai/application-studio-generation";
import { CopyMessage } from "@/components/copy-message";
import { CustomApplicationQuestion } from "@/components/custom-application-question";
import { StudioWorkflow } from "@/components/studio-workflow";
import type { Job } from "@/lib/types";

async function GeneratedStudio({job}:{job:Job}){const studio=await getApplicationStudio(job);return <>
  <div className="grid metrics"><div className="metric"><div className="metric-label">Application quality</div><div className="metric-value">{studio.quality.score}/100</div><div className="metric-note">Review before submission</div></div><div className="metric"><div className="metric-label">Match score</div><div className="metric-value">{job.score}</div><div className="metric-note">{job.category}</div></div><div className="metric"><div className="metric-label">Evidence coverage</div><div className="metric-value">{studio.quality.checks[1].score}%</div><div className="metric-note">Verified requirements</div></div><div className="metric"><div className="metric-label">Integrity</div><div className="metric-value">{studio.quality.checks[2].score}%</div><div className="metric-note">No invented metrics</div></div></div>
  <StudioWorkflow job={{id:job.id,title:job.title,company:job.company,sourceUrl:job.sourceUrl}} studio={studio}/>
  <div className="grid two-col section"><section className="card" id="cover-letter"><div className="section-head"><div><div className="eyebrow">Step 3 · Cover letter</div><h2>Personalized draft</h2></div><CopyMessage text={studio.coverLetter}/></div><p className="message-draft">{studio.coverLetter}</p></section><aside className="card"><div className="eyebrow">Quality review</div><h2>Before submitting</h2><div className="stack" style={{gap:10,marginTop:14}}>{studio.quality.checks.map(check=><div className="quality-row" key={check.label}><span><strong>{check.label}</strong><small>{check.recommendation}</small></span><b>{check.score}</b></div>)}</div></aside></div>
  <section className="section" id="application-questions"><div className="section-head"><div><div className="eyebrow">Step 4 · Application questions</div><h2>Prepared answers</h2><p className="subtle">Factual starting points for common questions.</p></div><Sparkles color="var(--green)"/></div><div className="stack">{studio.answers.map(item=><article className="card" key={item.question}><div className="section-head"><h3>{item.question}</h3><CopyMessage text={item.answer}/></div><p>{item.answer}</p></article>)}<CustomApplicationQuestion jobId={job.id}/></div></section>
  <section className="section card"><div className="section-head"><div><div className="eyebrow">After applying · Outreach</div><h2>Find the right people and prepare a personal message</h2><p className="subtle">Research current employees and prepare a short, factual message after the core application is ready.</p></div><a className="btn" href={`/contacts?job=${job.id}`}>Open outreach workspace <ArrowUpRight size={14}/></a></div></section>
</>}

export default async function StudioPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;const job=await getJob(id);if(!job)notFound();
  return <div className="content">
    <PageHead eyebrow="Application Studio" title={`${job.title} · ${job.company}`} copy="Complete each step in order. AI tailoring can continue loading without holding up the page." action={job.sourceUrl?<a className="btn" href={job.sourceUrl} target="_blank" rel="noreferrer">View job posting <ArrowUpRight size={14}/></a>:null}/>
    {job.sourceUrl?<aside className="job-source-strip"><span>Ready to submit on the employer’s website when your materials are complete.</span><a href={job.sourceUrl} target="_blank" rel="noreferrer">Open original job posting <ArrowUpRight size={14}/></a></aside>:null}
    <Suspense fallback={<section className="card studio-loading loading-card"><Sparkles size={20} color="var(--green)"/><div><div className="eyebrow">Application Studio is open</div><h2>Preparing tailored materials…</h2><p className="subtle">You can use the navigation now. Résumé adjustments, cover letter and answers will appear here when ready.</p></div></section>}><GeneratedStudio job={job}/></Suspense>
  </div>;
}
