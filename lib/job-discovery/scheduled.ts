import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { discoverAtsJobs, type DiscoveredJob } from "@/lib/job-discovery/ats";
import { prioritizeDiscoveredJobs } from "@/lib/job-discovery/prioritize";
import { defaultJobPreferences } from "@/lib/repositories/preferences";
import { rerankProactiveJobs } from "@/lib/ai/discovery-ranking";

export async function refreshAllScheduledFeeds() {
  const supabase = createSupabaseAdminClient();
  const { data: feeds, error } = await supabase
    .from("job_feeds")
    .select("id,profile_id,board_url,last_snapshot,profiles(preferences)")
    .eq("active", true);
  if (error) throw error;
  const results = await Promise.all(
    (feeds || []).map(async (feed) => {
      try {
        const profile = Array.isArray(feed.profiles)
          ? feed.profiles[0]
          : feed.profiles;
        const stored = (profile?.preferences || {}) as Partial<
          typeof defaultJobPreferences
        >;
        const preferences = { ...defaultJobPreferences, ...stored };
        const { data: master } = await supabase
          .from("resumes")
          .select("id")
          .eq("profile_id", feed.profile_id)
          .eq("is_master", true)
          .maybeSingle();
        const { data: version } = master
          ? await supabase
              .from("resume_versions")
              .select("content")
              .eq("resume_id", master.id)
              .order("version", { ascending: false })
              .limit(1)
              .maybeSingle()
          : { data: null };
        const rawText = (version?.content as { rawText?: unknown } | null)
          ?.rawText;
        const resumeText = typeof rawText === "string" ? rawText : undefined;
        const all = await discoverAtsJobs(feed.board_url);
        const previous = new Set(
          ((feed.last_snapshot || []) as DiscoveredJob[]).map(
            (job) => `${job.provider}:${job.externalId}`,
          ),
        );
        const now = new Date().toISOString();
        const initialJobs = prioritizeDiscoveredJobs(
          all,
          20,
          preferences,
          resumeText,
        );
        const jobs = (await rerankProactiveJobs(initialJobs, resumeText)).map((job) => ({
          ...job,
          isNew: !previous.has(`${job.provider}:${job.externalId}`),
          lastVerifiedAt: now,
        }));
        const { error: updateError } = await supabase
          .from("job_feeds")
          .update({
            last_checked_at: now,
            last_job_count: jobs.length,
            last_snapshot: jobs,
          })
          .eq("id", feed.id);
        if (updateError) throw updateError;
        return { scanned: all.length, matched: jobs.length };
      } catch (error) {
        console.error("Scheduled feed refresh failed", {
          feedId: feed.id,
          error,
        });
        return null;
      }
    }),
  );
  const successful = results.filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
  return {
    refreshed: successful.length,
    scanned: successful.reduce((total, item) => total + item.scanned, 0),
    matched: successful.reduce((total, item) => total + item.matched, 0),
  };
}
