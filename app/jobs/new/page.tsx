import { PageHead } from "@/components/ui";
import { JobIntakeForm } from "@/components/job-intake-form";

export default async function NewJobPage({searchParams}:{searchParams:Promise<{url?:string}>}) { const {url=""}=await searchParams; return <div className="content"><PageHead eyebrow="URL-first intake" title="Analyze a job" copy="Paste one public job URL. ApplyIQ will read, structure and score the opportunity for you."/><JobIntakeForm initialUrl={url}/></div>; }
