import { PageHead } from "@/components/ui";
import { InterviewManager } from "@/components/interview-manager";
import { listInterviews } from "@/lib/repositories/interviews";
import { listJobs } from "@/lib/repositories/jobs";
export default async function Page(){const [interviews,jobs]=await Promise.all([listInterviews(),listJobs()]);return <div className="content"><PageHead eyebrow="Step 4 · Prepare with confidence" title="Interviews" copy="Build a current company brief, likely questions, tailored model answers and questions to ask."/><InterviewManager initialInterviews={interviews} jobs={jobs}/></div>}
