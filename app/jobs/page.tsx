import Link from "next/link";
import { Plus } from "lucide-react";
import { listJobs } from "@/lib/repositories/jobs";
import { PageHead } from "@/components/ui";
import { JobsTable } from "@/components/jobs-table";

export default async function JobsPage(){const jobs=await listJobs();return <div className="content"><PageHead eyebrow="Step 2 · One source of truth" title="Jobs" copy="Every URL Neelam adds appears here. Review the screening, change its stage, continue preparation or remove it." action={<Link className="btn primary" href="/jobs/discover"><Plus size={14}/>Add job</Link>}/><JobsTable initialJobs={jobs}/></div>}
