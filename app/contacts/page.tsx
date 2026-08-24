import { ContactRound, Search, ShieldCheck } from "lucide-react";
import { PageHead } from "@/components/ui";
import { getJob } from "@/lib/repositories/jobs";
import { CopyMessage } from "@/components/copy-message";
import Link from "next/link";
import { ContactCapture } from "@/components/contact-capture";
import { listContactsForJob } from "@/lib/repositories/contacts";

function linkedInSearch(query:string){return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`}
const googleSearch=linkedInSearch;

export default async function ContactsPage({searchParams}:{searchParams:Promise<{job?:string}>}){const {job:id}=await searchParams;const job=id?await getJob(id):null;
  if(!job)return <div className="content"><PageHead eyebrow="Networking" title="Outreach" copy="Start from a saved opportunity to identify the people most likely to offer useful context."/><div className="card empty"><ContactRound size={30} color="var(--green)"/><h2>Choose an opportunity first</h2><p className="subtle">Open a job and select “Find relevant contacts.” ApplyIQ will create focused searches and outreach drafts for that company and role.</p><Link className="btn primary" href="/jobs">View saved jobs</Link></div></div>;
  const contacts=await listContactsForJob(job.id);const searches=[
    {label:"1 · Likely hiring manager",why:"Highest-value context: look for the function leader one level above this role.",query:`${job.company} director head ${job.roleFamily}`},
    {label:"2 · Recruiting partner",why:"Likely to understand ownership, timing and the hiring process.",query:`${job.company} recruiter talent acquisition ${job.roleFamily}`},
    {label:"3 · Potential team leader or peer",why:"Useful for practical insight into priorities, culture and day-to-day work.",query:`${job.company} ${job.title}`},
  ];
  const connection=`Hi [Name] — I’m exploring the ${job.title} opportunity at ${job.company}. My background includes leading large-scale learning programs and cross-functional partnerships, and the role’s focus on ${job.roleFamily.toLowerCase()} stood out. I’d value connecting and learning more about the team.`;
  const followup=`Hi [Name], thank you for connecting. I’m considering the ${job.title} role at ${job.company} and would appreciate your perspective on what the team values most in someone joining this function. If you have 10–15 minutes in the coming week, I’d be grateful for a brief conversation. No worries at all if timing is tight.`;
  return <div className="content"><PageHead eyebrow="Job-specific networking" title={`Outreach for ${job.company}`} copy={`${job.title} · Find a small number of relevant people and send thoughtful, human messages.`}/><div className="analysis-banner" style={{marginBottom:18,display:"flex",gap:8,alignItems:"center"}}><ShieldCheck size={15}/> ApplyIQ never logs into LinkedIn, scrapes profiles, or sends messages automatically. You review every person and send every message yourself.</div><div className="grid two-col"><section className="stack"><ContactCapture jobId={job.id} initialContacts={contacts}/><div className="section-head"><h2>Who to look for</h2></div>{searches.map(item=><article className="card" key={item.label}><div className="section-head"><div><h3>{item.label}</h3><p className="subtle">{item.why}</p></div><a className="btn primary" href={googleSearch(item.query)} target="_blank" rel="noreferrer"><Search size={14}/>Search public profiles</a></div><div className="tag">Search: {item.query}</div></article>)}</section><aside className="stack"><section className="card"><div className="eyebrow">Connection request</div><p className="message-draft">{connection}</p><CopyMessage text={connection}/></section><section className="card"><div className="eyebrow">After they connect</div><p className="message-draft">{followup}</p><CopyMessage text={followup}/></section></aside></div></div>;
}
