import { JobDiscovery } from "@/components/job-discovery";
import { PageHead } from "@/components/ui";
import { listJobFeeds } from "@/lib/repositories/job-feeds";
export default async function DiscoverJobsPage(){const feeds=await listJobFeeds();return <div className="content"><PageHead eyebrow="Direct employer sourcing" title="Discover current jobs" copy="Read live vacancies directly from a company’s public recruiting system, then analyze only the strongest opportunities."/><JobDiscovery initialFeeds={feeds}/></div>}
