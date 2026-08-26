import { ContactRound, Search, ShieldCheck } from "lucide-react";
import { PageHead } from "@/components/ui";
import { getJob } from "@/lib/repositories/jobs";
import { CopyMessage } from "@/components/copy-message";
import Link from "next/link";
import { ContactCapture } from "@/components/contact-capture";
import { listContactsForJob } from "@/lib/repositories/contacts";
import { getOutreachFallback, getOutreachPlan, outreachSearchTargets } from "@/lib/ai/outreach-generation";
import { Suspense } from "react";
import type { Job } from "@/lib/types";
import { linkedInCurrentCompanySearch } from "@/lib/linkedin-people-search";

async function ResearchedContacts({job}:{job:Job}){const plan=await getOutreachPlan(job);if(!plan.people.length)return <section className="card"><div className="eyebrow">AI contact research</div><p className="subtle">No sufficiently well-supported public contacts were found. Use the focused searches below rather than guessing.</p></section>;return <section className="card"><div className="eyebrow">AI-researched public contacts</div><h2>People to verify</h2><p className="subtle">These are evidence-based suggestions, not confirmed hiring contacts. Check each current title before messaging.</p><div className="stack" style={{marginTop:16}}>{plan.people.map(person=><article className="saved-contact" key={person.publicUrl}><div><strong>{person.name}</strong><span>{person.title}</span><small>{person.why}</small></div><div className="actions"><a className="btn" href={person.publicUrl} target="_blank" rel="noreferrer">Verify profile</a><CopyMessage text={person.message}/></div></article>)}</div></section>}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job: id } = await searchParams;
  const job = id ? await getJob(id) : null;
  if (!job)
    return (
      <div className="content">
        <PageHead
          eyebrow="Networking"
          title="Outreach"
          copy="Start from a saved opportunity to identify the people most likely to offer useful context."
        />
        <div className="card empty">
          <ContactRound size={30} color="var(--green)" />
          <h2>Choose an opportunity first</h2>
          <p className="subtle">
            Open a job and select “Find relevant contacts.” ApplyIQ will create
            focused searches and outreach drafts for that company and role.
          </p>
          <Link className="btn primary" href="/jobs">
            View saved jobs
          </Link>
        </div>
      </div>
    );
  const contacts = await listContactsForJob(job.id);
  const searches = outreachSearchTargets(job);
  const evidence =
    job.strengths[0] ||
    `experience relevant to ${job.roleFamily.toLowerCase()}`;
  const fallback=getOutreachFallback(job);
  const connection = fallback.connection || `Hi [Name] — I’m exploring the ${job.title} opportunity at ${job.company}. My background includes ${evidence.charAt(0).toLowerCase()}${evidence.slice(1)}, and I’d value connecting.`;
  const followup = fallback.followup;
  return (
    <div className="content">
      <PageHead
        eyebrow="Job-specific networking"
        title={`Outreach for ${job.company}`}
        copy={`${job.title} · Find a small number of relevant people and send thoughtful, human messages.`}
      />
      <div
        className="analysis-banner"
        style={{
          marginBottom: 18,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <ShieldCheck size={15} /> ApplyIQ never logs into LinkedIn, scrapes
        profiles, or sends messages automatically. Searches are scoped to current {job.company} employees; you still verify every person and
        send every message yourself.
      </div>
      <div className="outreach-workflow" aria-label="Outreach workflow">
        <span>
          <strong>1 · Find</strong>
          <small>Open one focused LinkedIn search</small>
        </span>
        <span>
          <strong>2 · Review</strong>
          <small>Choose a genuinely relevant person</small>
        </span>
        <span>
          <strong>3 · Save</strong>
          <small>Add them to the contact shortlist</small>
        </span>
        <span>
          <strong>4 · Follow up</strong>
          <small>Track contact and response dates</small>
        </span>
      </div>
      <div className="grid two-col">
        <section className="stack">
          <Suspense fallback={<section className="card loading-card"><div className="eyebrow">AI contact research</div><p>Checking current public profiles in the background…</p></section>}><ResearchedContacts job={job}/></Suspense>
          <ContactCapture jobId={job.id} initialContacts={contacts} />
          <div className="section-head">
            <h2>Who to look for</h2>
          </div>
          {searches.map((item) => (
            <article className="card" key={item.label}>
              <div className="section-head">
                <div>
                  <h3>{item.label}</h3>
                  <p className="subtle">{item.why}</p>
                </div>
                <a
                  className="btn primary"
                  href={linkedInCurrentCompanySearch(job.company,item.query)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Search size={14} />
                  Search LinkedIn people
                </a>
              </div>
              <div className="tag">Employer: {job.company} · Search focus: {item.query.replace(job.company,"").trim()}</div>
            </article>
          ))}
        </section>
        <aside className="stack">
          <section className="card">
            <div className="eyebrow">Connection request</div>
            <p className="message-draft">{connection}</p>
            <CopyMessage text={connection} />
          </section>
          <section className="card">
            <div className="eyebrow">After they connect</div>
            <p className="message-draft">{followup}</p>
            <CopyMessage text={followup} />
          </section>
        </aside>
      </div>
    </div>
  );
}
