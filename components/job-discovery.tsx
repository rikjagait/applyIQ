"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  RefreshCw,
  Rss,
  Search,
  Trash2,
} from "lucide-react";
import type { DiscoveredJob } from "@/lib/job-discovery/ats";
import type { JobFeed } from "@/lib/repositories/job-feeds";

export function JobDiscovery({ initialFeeds }: { initialFeeds: JobFeed[] }) {
  const hasInitialJobs = initialFeeds.some(
    (feed) => (feed.lastSnapshot?.length || 0) > 0,
  );
  const [jobs, setJobs] = useState<DiscoveredJob[]>(() =>
    initialFeeds.flatMap((feed) => feed.lastSnapshot || []),
  );
  const [feeds, setFeeds] = useState(initialFeeds);
  const [lastSearch, setLastSearch] = useState<{
    name: string;
    boardUrl: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removingFeedId, setRemovingFeedId] = useState<string | null>(null);
  const started = useRef(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    setJobs([]);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const boardUrl = String(values.boardUrl || "");
    const name = String(values.name || "");
    const response = await fetch("/api/jobs/discover", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ boardUrl, companyName: name }),
    });
    const result = (await response.json()) as {
      jobs?: DiscoveredJob[];
      boardUrl?: string;
      scanned?: number;
      source?: string;
      directoryUpdatedAt?: string | null;
      error?: string;
    };
    if (!response.ok) {
      setError(result.error || "Could not find that company’s careers board.");
      setPending(false);
      return;
    }
    setLastSearch({ name, boardUrl: result.boardUrl || boardUrl });
    setJobs(result.jobs || []);
    const freshness = result.directoryUpdatedAt
      ? ` Directory refreshed ${new Date(result.directoryUpdatedAt).toLocaleDateString()}.`
      : "";
    setMessage(
      `Found ${result.scanned || 0} live vacancies via ${result.source || "the company careers site"} and selected ${result.jobs?.length || 0} that match your preferences.${freshness}`,
    );
    setPending(false);
  }
  async function saveFeed() {
    if (!lastSearch) return;
    setPending(true);
    setError("");
    const response = await fetch("/api/job-feeds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lastSearch),
    });
    const result = (await response.json()) as {
      id?: string;
      provider?: string;
      error?: string;
    };
    if (!response.ok) {
      setError(result.error || "Could not save this feed.");
      setPending(false);
      return;
    }
    setFeeds((current) =>
      current.some((feed) => feed.boardUrl === lastSearch.boardUrl)
        ? current
        : [
            ...current,
            {
              id: result.id!,
              name: lastSearch.name,
              boardUrl: lastSearch.boardUrl,
              provider: result.provider!,
              active: true,
              lastCheckedAt: new Date().toISOString(),
              lastJobCount: jobs.length,
            },
          ],
    );
    setMessage("Company feed saved. It is ready for scheduled refreshes.");
    setPending(false);
  }
  async function refreshAll() {
    setPending(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/discovery/run", { method: "POST" });
    const result = (await response.json()) as {
      feeds?: number;
      jobs?: number;
      scanned?: number;
      results?: Array<{ jobs: DiscoveredJob[] }>;
      error?: string;
    };
    if (!response.ok) {
      setError(result.error || "Could not refresh feeds.");
      setPending(false);
      return;
    }
    const unique = new Map<string, DiscoveredJob>();
    for (const job of result.results?.flatMap((item) => item.jobs) || [])
      unique.set(`${job.provider}:${job.externalId}`, job);
    setJobs(
      [...unique.values()].sort(
        (a, b) =>
          (b.postedAt ? Date.parse(b.postedAt) : 0) -
          (a.postedAt ? Date.parse(a.postedAt) : 0),
      ),
    );
    setMessage(
      `Scanned ${result.scanned || 0} published jobs across ${result.feeds || 0} feeds and shortlisted ${result.jobs || 0} relevant candidates.`,
    );
    setPending(false);
  }
  async function removeFeed(feed: JobFeed) {
    if (confirmRemoveId !== feed.id) {
      setConfirmRemoveId(feed.id);
      return;
    }
    setRemovingFeedId(feed.id);
    setError("");
    const response = await fetch("/api/job-feeds", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: feed.id }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error || "Could not remove that company.");
      setRemovingFeedId(null);
      return;
    }
    setFeeds((current) => current.filter((item) => item.id !== feed.id));
    setConfirmRemoveId(null);
    setRemovingFeedId(null);
    setMessage(`${feed.name} was removed from the watchlist.`);
  }
  useEffect(() => {
    if (started.current || !feeds.length || hasInitialJobs) return;
    started.current = true;
    void refreshAll();
  }, [feeds.length, hasInitialJobs]);
  return (
    <div className="stack">
      <details className="card watchlist-panel">
        <summary className="watchlist-summary">
          <span className="watchlist-summary-icon">
            <Rss size={15} />
          </span>
          <span>
            <strong>Proactive company watchlist</strong>
            <small>
              {feeds.length} {feeds.length === 1 ? "company" : "companies"}{" "}
              monitored automatically
            </small>
          </span>
          <span className="watchlist-manage">
            Manage watchlist <ChevronDown size={14} />
          </span>
        </summary>
        <div className="watchlist-content">
          <div className="section-head">
            <p className="subtle">
              Add or remove employers here. ApplyIQ checks them automatically
              and places matching roles above.
            </p>
            <button
              className="btn"
              onClick={refreshAll}
              disabled={pending || !feeds.length}
            >
              <RefreshCw size={14} />
              {pending ? "Checking live roles…" : "Refresh opportunities"}
            </button>
          </div>
          <div className="feed-list">
            {feeds.map((feed) => (
              <div className="feed-chip" key={feed.id}>
                <Rss size={14} />
                <span>
                  <strong>{feed.name}</strong>
                  <small>
                    {feed.provider} · {feed.lastJobCount} last found
                  </small>
                </span>
                <button
                  className={
                    confirmRemoveId === feed.id
                      ? "feed-remove confirming"
                      : "feed-remove"
                  }
                  type="button"
                  aria-label={
                    confirmRemoveId === feed.id
                      ? `Confirm removal of ${feed.name}`
                      : `Remove ${feed.name} from watchlist`
                  }
                  disabled={removingFeedId === feed.id}
                  onClick={() => void removeFeed(feed)}
                >
                  <Trash2 size={13} />
                  {removingFeedId === feed.id
                    ? "Removing…"
                    : confirmRemoveId === feed.id
                      ? "Confirm"
                      : "Remove"}
                </button>
              </div>
            ))}
            {!feeds.length && (
              <p className="subtle">
                Search for a company below, then add it to Neelam’s watchlist.
              </p>
            )}
          </div>
        </div>
      </details>
      <section className="card company-search-card">
        <form className="form" onSubmit={submit}>
          <label className="field">
            Company name
            <input
              className="input company-name-input"
              name="name"
              placeholder="e.g. OpenAI, Spotify or JPMorgan"
              required
              autoComplete="organization"
            />
          </label>
          <p className="subtle">
            ApplyIQ checks the Stapply open directory, opens the employer’s live
            recruiting feed, then removes technical, machine-learning,
            wrong-location and seniority-mismatched roles.
          </p>
          {advanced && (
            <label className="field advanced-board">
              Careers board URL{" "}
              <span className="subtle">(optional override)</span>
              <input
                className="input"
                name="boardUrl"
                type="url"
                placeholder="https://jobs.ashbyhq.com/company"
              />
            </label>
          )}
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          {message && <div className="analysis-banner">{message}</div>}
          <div className="actions">
            <button className="btn primary" disabled={pending}>
              <Search size={15} />
              {pending
                ? "Checking the open jobs directory…"
                : "Find current matching roles"}
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => setAdvanced((value) => !value)}
            >
              {advanced ? "Hide advanced" : "Advanced: use careers URL"}
            </button>
          </div>
        </form>
      </section>
      {jobs.length > 0 && (
        <section>
          <div className="section-head">
            <div>
              <h2>{jobs.length} recommended for Neelam</h2>
              <p className="subtle">
                Strictly filtered using her roles, seniority and locations from
                Settings
              </p>
            </div>
            {lastSearch &&
              !feeds.some((feed) => feed.boardUrl === lastSearch.boardUrl) && (
                <button className="btn" onClick={saveFeed} disabled={pending}>
                  <Rss size={14} />
                  Add to watchlist
                </button>
              )}
          </div>
          <div className="stack" style={{ gap: 10 }}>
            {jobs.map((job) => (
              <article
                className="card opportunity"
                key={`${job.provider}-${job.externalId}`}
              >
                <div>
                  <div className="actions" style={{ marginBottom: 8 }}>
                    <span className="pill">
                      Recommended · {job.matchScore ?? "—"}
                    </span>
                    <span className="pill">
                      Found via {job.discoveredVia ?? "employer feed"}
                    </span>
                  </div>
                  <h3>{job.title}</h3>
                  <div className="job-company">
                    {job.company} · {job.location}
                  </div>
                  <div className="job-meta">
                    <span>{job.salary || "Salary not published"}</span>
                    <span>
                      {job.employmentType || "Employment type not published"}
                    </span>
                    <span>Source: Stapply / {job.provider}</span>
                  </div>
                  <p className="job-reason">{job.matchReason}</p>
                  <div className="job-meta">
                    <span>
                      {job.postedAt
                        ? `Updated ${new Date(job.postedAt).toLocaleDateString()}`
                        : "Publishing date unavailable"}
                    </span>
                  </div>
                </div>
                <div className="actions">
                  <a
                    className="btn primary"
                    href={`/jobs/new?url=${encodeURIComponent(job.jobUrl)}`}
                  >
                    Analyze match
                  </a>
                  <a
                    className="btn"
                    href={job.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View posting <ArrowUpRight size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
