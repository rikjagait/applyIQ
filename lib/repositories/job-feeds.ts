import "server-only";
import { isPreviewMode } from "@/lib/preview";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient, requireUser } from "@/lib/supabase/server";
import { discoverAtsJobs, type DiscoveredJob } from "@/lib/job-discovery/ats";
import { prioritizeDiscoveredJobs } from "@/lib/job-discovery/prioritize";
import { getJobPreferences } from "@/lib/repositories/preferences";

export type JobFeed = {
  id: string;
  name: string;
  boardUrl: string;
  provider: string;
  active: boolean;
  lastCheckedAt: string | null;
  lastJobCount: number;
  lastSnapshot?: DiscoveredJob[];
};
const previewFeeds: JobFeed[] = [
  {
    id: "preview-openai",
    name: "Example Ashby feed",
    boardUrl: "https://jobs.ashbyhq.com/openai",
    provider: "Ashby",
    active: true,
    lastCheckedAt: null,
    lastJobCount: 0,
  },
];
export async function listJobFeeds(): Promise<JobFeed[]> {
  if (!isSupabaseConfigured() || (await isPreviewMode())) return previewFeeds;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("job_feeds")
    .select(
      "id,name,board_url,provider,active,last_checked_at,last_job_count,last_snapshot",
    )
    .order("created_at");
  if (error) {
    console.error("Could not list job feeds", error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    boardUrl: row.board_url,
    provider: row.provider,
    active: row.active,
    lastCheckedAt: row.last_checked_at,
    lastJobCount: row.last_job_count,
    lastSnapshot: Array.isArray(row.last_snapshot)
      ? (row.last_snapshot as DiscoveredJob[])
      : [],
  }));
}
function providerFromUrl(value: string) {
  const host = new URL(value).hostname;
  if (host.includes("greenhouse.io")) return "Greenhouse";
  if (host.includes("lever.co")) return "Lever";
  if (host.includes("ashbyhq.com")) return "Ashby";
  if (host.includes("smartrecruiters.com")) return "SmartRecruiters";
  if (host.includes("myworkdayjobs.com")) return "Workday";
  throw new Error("Unsupported careers provider");
}
export async function createJobFeed(input: { name: string; boardUrl: string }) {
  if (await isPreviewMode())
    return {
      id: crypto.randomUUID(),
      provider: providerFromUrl(input.boardUrl),
      preview: true,
    };
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile) throw new Error("Private profile not found");
  const provider = providerFromUrl(input.boardUrl);
  const { data, error } = await supabase
    .from("job_feeds")
    .upsert(
      {
        profile_id: profile.id,
        name: input.name,
        board_url: input.boardUrl,
        provider,
      },
      { onConflict: "profile_id,board_url" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id as string, provider, preview: false };
}
export async function refreshJobFeeds(): Promise<{
  feeds: number;
  jobs: number;
  scanned: number;
  results: Array<{ feedId: string; jobs: DiscoveredJob[] }>;
}> {
  const [feeds, preferences] = await Promise.all([
    listJobFeeds(),
    getJobPreferences(),
  ]);
  const verifiedAt = new Date().toISOString();
  const preview = await isPreviewMode();
  const supabase = preview ? null : await createSupabaseServerClient();
  const refreshed = await Promise.all(
    feeds
      .filter((item) => item.active)
      .map(async (feed) => {
        try {
          const allJobs = await discoverAtsJobs(feed.boardUrl);
          const previous = new Set(
            (feed.lastSnapshot || []).map(
              (job) => `${job.provider}:${job.externalId}`,
            ),
          );
          const jobs = prioritizeDiscoveredJobs(allJobs, 50, preferences).map(
            (job) => ({
              ...job,
              isNew: !previous.has(`${job.provider}:${job.externalId}`),
              lastVerifiedAt: verifiedAt,
            }),
          );
          if (supabase) {
            await supabase
              .from("job_feeds")
              .update({
                last_checked_at: verifiedAt,
                last_job_count: jobs.length,
                last_snapshot: jobs,
              })
              .eq("id", feed.id);
          }
          return { feedId: feed.id, jobs, scanned: allJobs.length };
        } catch (error) {
          console.error("Feed refresh failed", { feed: feed.id, error });
          return null;
        }
      }),
  );
  const successful = refreshed.filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
  const results = successful.map(({ feedId, jobs }) => ({ feedId, jobs }));
  return {
    feeds: results.length,
    jobs: results.reduce((total, item) => total + item.jobs.length, 0),
    scanned: successful.reduce((total, item) => total + item.scanned, 0),
    results,
  };
}

export async function listDailyDiscoveries() {
  const feeds = await listJobFeeds();
  const unique = new Map<string, DiscoveredJob>();
  for (const job of feeds.flatMap((feed) => feed.lastSnapshot || [])) {
    const key = `${job.company}|${job.title}|${job.location}`.toLowerCase();
    const current = unique.get(key);
    if (!current || (job.matchScore || 0) > (current.matchScore || 0))
      unique.set(key, job);
  }
  return [...unique.values()]
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 20);
}
