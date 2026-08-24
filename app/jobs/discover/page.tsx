import { JobDiscovery } from "@/components/job-discovery";
import { PageHead } from "@/components/ui";
import { listJobFeeds } from "@/lib/repositories/job-feeds";
export default async function DiscoverJobsPage(){const feeds=await listJobFeeds();return <div className="content"><PageHead eyebrow="Open jobs directory + direct employer sourcing" title="Discover current jobs" copy="Search by company, resolve its recruiting system through the open Stapply directory, and analyze only the strongest live opportunities."/><JobDiscovery initialFeeds={feeds}/></div>}
