import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { discoverAtsJobs, type DiscoveredJob } from "@/lib/job-discovery/ats";
import { prioritizeDiscoveredJobs } from "@/lib/job-discovery/prioritize";
import { defaultJobPreferences } from "@/lib/repositories/preferences";

export async function refreshAllScheduledFeeds(){const supabase=createSupabaseAdminClient();const {data:feeds,error}=await supabase.from("job_feeds").select("id,profile_id,board_url,last_snapshot,profiles(preferences)").eq("active",true);if(error)throw error;let scanned=0;let matched=0;let refreshed=0;for(const feed of feeds||[]){try{const profile=Array.isArray(feed.profiles)?feed.profiles[0]:feed.profiles;const stored=(profile?.preferences||{}) as Partial<typeof defaultJobPreferences>;const preferences={...defaultJobPreferences,...stored};const all=await discoverAtsJobs(feed.board_url);const previous=new Set(((feed.last_snapshot||[]) as DiscoveredJob[]).map(job=>`${job.provider}:${job.externalId}`));const now=new Date().toISOString();const jobs=prioritizeDiscoveredJobs(all,50,preferences).map(job=>({...job,isNew:!previous.has(`${job.provider}:${job.externalId}`),lastVerifiedAt:now}));const {error:updateError}=await supabase.from("job_feeds").update({last_checked_at:now,last_job_count:jobs.length,last_snapshot:jobs}).eq("id",feed.id);if(updateError)throw updateError;scanned+=all.length;matched+=jobs.length;refreshed++}catch(error){console.error("Scheduled feed refresh failed",{feedId:feed.id,error})}}return {refreshed,scanned,matched}}

