import { PageHead } from "@/components/ui";
import { InterviewManager } from "@/components/interview-manager";
import { listInterviews } from "@/lib/repositories/interviews";
import { listJobs } from "@/lib/repositories/jobs";
export default async function Page(){const [interviews,jobs]=await Promise.all([listInterviews(),listJobs()]);return <div className="content"><PageHead eyebrow="Interview hub" title="Interviews" copy="Prepare from verified evidence and keep every conversation in context."/><InterviewManager initialInterviews={interviews} jobs={jobs}/></div>}
