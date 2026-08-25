import Link from "next/link";
import { ArrowUpRight, Link2, Search, Sparkles } from "lucide-react";
import { JobDiscovery } from "@/components/job-discovery";
import { JobRow, PageHead } from "@/components/ui";
import {
  listJobFeeds,
  listDailyDiscoveries,
} from "@/lib/repositories/job-feeds";
import { listJobs } from "@/lib/repositories/jobs";
import { getJobPreferences } from "@/lib/repositories/preferences";

function linkedInJobs(role: string, location: string) {
  const params = new URLSearchParams({
    keywords: role,
    location,
    f_TPR: "r604800",
  });
  return `https://www.linkedin.com/jobs/search/?${params}`;
}

export default async function DiscoverJobsPage() {
  const [feeds, saved, discovered, preferences] = await Promise.all([
    listJobFeeds(),
    listJobs(),
    listDailyDiscoveries(),
    getJobPreferences(),
  ]);
  const recommended = saved
    .filter((job) => job.score >= 65)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const fresh = discovered.filter((job) => job.isNew).slice(0, 5);
  const linkedinRoles = preferences.roles
    .slice(0, 5)
    .map((role) =>
      /manager|director|lead/i.test(role) ? role : `${role} Manager`,
    );
  const linkedinLocation = preferences.locations[0] || "New York";

  return (
    <div className="content">
      <PageHead
        eyebrow="Step 1 · Start with a role you want"
        title="Add and assess a job"
        copy="Paste a job link. ApplyIQ will screen it against Neelam’s latest résumé and guide the application from start to interview."
      />
      <section className="card paste-job-card url-first-card" id="paste-job">
        <div><div className="eyebrow">LinkedIn or any job site</div><h2>Paste the job-posting link</h2><p className="subtle">Nothing is submitted to the employer. ApplyIQ imports the vacancy and spends AI only after Neelam chooses to assess it.</p></div>
        <form action="/jobs/new" method="get"><input className="input" aria-label="Job posting URL" name="url" type="url" placeholder="https://www.linkedin.com/jobs/view/…" required/><button className="btn primary" type="submit">Screen this role <ArrowUpRight size={14}/></button></form>
      </section>
      <section className="find-job-choices" aria-label="Ways to find a job">
        <a href="#paste-job">
          <span>1</span>
          <Link2 size={18} />
          <strong>Screen the role</strong>
          <small>Job description versus latest résumé</small>
        </a>
        <Link href="/jobs">
          <span>2</span>
          <Search size={18} />
          <strong>Prepare application</strong>
          <small>Tailor résumé and application answers</small>
        </Link>
        <Link href="/interviews">
          <span>3</span>
          <Sparkles size={18} />
          <strong>Prepare for interview</strong>
          <small>Research, questions and model answers</small>
        </Link>
      </section>
      <section className="section" id="today">
        <div className="section-head">
          <div>
            <div className="eyebrow">Recommended for Neelam today</div>
            <h2>Your best current opportunities</h2>
            <p className="subtle">
              Strongest matches first. Low-fit roles stay out of the way.
            </p>
          </div>
          <span className="pill">
            {recommended.length + fresh.length} to review
          </span>
        </div>
        <div className="stack find-today-list">
          {recommended.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
          {fresh.map((job) => (
            <article
              className="card opportunity"
              key={`${job.provider}-${job.externalId}`}
            >
              <div>
                <span className="pill">{job.aiAssessed ? "AI recommended" : "Recommended"} · {job.matchScore}</span>
                <h3>{job.title}</h3>
                <div className="job-company">
                  {job.company} · {job.location}
                </div>
                <p className="job-reason">{job.matchReason}</p>
              </div>
              <Link
                className="btn primary"
                href={`/jobs/new?url=${encodeURIComponent(job.jobUrl)}`}
              >
                Review role <ArrowUpRight size={13} />
              </Link>
            </article>
          ))}
          {recommended.length + fresh.length === 0 ? (
            <div className="card empty private-empty-jobs">
              <h2>Your private opportunity list is ready to fill</h2>
              <p className="subtle">
                ApplyIQ is checking the Stapply open-jobs directory and live
                employer feeds now. Matching roles will appear directly below.
              </p>
            </div>
          ) : null}
        </div>
        <div className="section find-method" id="company-search">
          <JobDiscovery initialFeeds={feeds} />
        </div>
      </section>
      <section className="section linkedin-source" id="linkedin">
        <div className="section-head">
          <div>
            <div className="eyebrow">LinkedIn · secondary search</div>
            <h2>Search LinkedIn when you want to explore</h2>
            <p className="subtle">
              ApplyIQ’s proactive shortlist appears above. These links are an
              optional way to widen the search.
            </p>
          </div>
          <Link className="btn" href="/settings">
            Change preferences
          </Link>
        </div>
        <div className="linkedin-searches">
          {linkedinRoles.map((role) => (
            <a
              className="card"
              href={linkedInJobs(role, linkedinLocation)}
              target="_blank"
              rel="noreferrer"
              key={role}
            >
              <span className="pill">LinkedIn Jobs</span>
              <strong>{role}</strong>
              <small>
                Company and advertised salary appear in the LinkedIn results
              </small>
              <small>{linkedinLocation} · posted in the last week</small>
              <span>
                Open search <ArrowUpRight size={13} />
              </span>
            </a>
          ))}
        </div>
        <div className="analysis-banner linkedin-note">
          Choose a LinkedIn role and paste its URL below. ApplyIQ will import
          its actual company and advertised salary rather than guessing.
        </div>
      </section>
    </div>
  );
}
