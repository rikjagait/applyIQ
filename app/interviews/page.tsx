import { PageHead } from "@/components/ui";
import { InterviewManager } from "@/components/interview-manager";
import { listInterviews } from "@/lib/repositories/interviews";
export default async function Page(){const interviews=await listInterviews();return <div className="content"><PageHead eyebrow="Prepare with confidence" title="Interviews" copy="Every job moved to Interview appears here with a complete preparation plan."/><InterviewManager interviews={interviews}/></div>}
