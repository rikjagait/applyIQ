import { PageHead } from "@/components/ui";
import { PipelineBoard } from "@/components/pipeline-board";
import { listJobs } from "@/lib/repositories/jobs";
export default async function PipelinePage(){const jobs=await listJobs();return <div className="content" style={{maxWidth:"none"}}><PageHead eyebrow="Application workflow" title="Pipeline" copy="Drag opportunities between stages. Every successful move is saved with stage history."/><PipelineBoard jobs={jobs}/></div>}
