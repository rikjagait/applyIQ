import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Link2, ListChecks, Sparkles } from "lucide-react";
import { PageHead } from "@/components/ui";

export default function AddJobPage(){return <div className="content add-job-page"><PageHead eyebrow="Step 1 · Add a job" title="Add and assess a job" copy="Paste a public job link. ApplyIQ imports the vacancy, screens it against Neelam’s latest résumé and saves it to Jobs."/>
  <section className="card paste-job-card url-first-card"><div><div className="eyebrow">LinkedIn or any public job site</div><h2>Paste the job-posting link</h2><p className="subtle">Nothing is submitted to the employer. AI is used only after Neelam asks to assess this specific role.</p></div><form action="/jobs/new" method="get"><label className="sr-only" htmlFor="job-url">Job posting URL</label><input id="job-url" className="input" name="url" type="url" placeholder="https://www.linkedin.com/jobs/view/…" required/><button className="btn primary" type="submit">Screen role <ArrowUpRight size={14}/></button></form></section>
  <section className="guided-flow section"><article className="card"><Link2 size={18}/><span>1</span><h3>Import</h3><p>Read the exact role, company, salary and candidate requirements.</p></article><article className="card"><Sparkles size={18}/><span>2</span><h3>Screen</h3><p>Compare the genuine requirements with the latest master résumé.</p></article><article className="card"><ListChecks size={18}/><span>3</span><h3>Decide</h3><p>Save the job, prepare the application or remove it.</p></article></section>
  <div className="analysis-banner"><CheckCircle2 size={15}/> Proactive job feeds are disabled. Only roles added through this URL form will appear in Neelam’s Jobs table.</div>
  <div className="section"><Link className="btn" href="/jobs">View Jobs</Link></div>
  </div>}
