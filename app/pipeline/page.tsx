import { PageHead } from "@/components/ui";
import { PipelineBoard } from "@/components/pipeline-board";
import { listJobs } from "@/lib/repositories/jobs";
export default async function PipelinePage(){const jobs=await listJobs();return <div className="content" style={{maxWidth:"none"}}><PageHead eyebrow="Step 3 · Prepare and apply" title="Applications" copy="Tailor the résumé, prepare answers and outreach, submit, then track each application."/><PipelineBoard jobs={jobs}/></div>}
