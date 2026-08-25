"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Search, Trash2 } from "lucide-react";
import type { ApplicationStage, Job } from "@/lib/types";
import { CategoryPill } from "@/components/ui";

const stages:ApplicationStage[]=["Discovered","Shortlisted","Preparing Application","Ready to Apply","Applied","Recruiter Screen","Interview","Final Interview","Offer","Rejected","Withdrawn","Closed"];
export function JobsTable({initialJobs}:{initialJobs:Job[]}){
  const [jobs,setJobs]=useState(initialJobs);const [query,setQuery]=useState("");const [pending,setPending]=useState("");
  const visible=useMemo(()=>jobs.filter(job=>`${job.title} ${job.company} ${job.location}`.toLowerCase().includes(query.toLowerCase())),[jobs,query]);
  async function updateStage(job:Job,stage:ApplicationStage){setPending(job.id);const response=await fetch(`/api/applications/${job.id}/stage`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({stage})});if(response.ok)setJobs(current=>current.map(item=>item.id===job.id?{...item,status:stage}:item));setPending("")}
  async function remove(job:Job){if(!window.confirm(`Remove ${job.title} at ${job.company} from the jobs table?`))return;setPending(job.id);const response=await fetch(`/api/jobs/${job.id}`,{method:"DELETE"});if(response.ok)setJobs(current=>current.filter(item=>item.id!==job.id));setPending("")}
  return <><label className="job-table-search"><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search title, company or location" aria-label="Search jobs"/></label>{visible.length?<div className="card table-wrap jobs-master-table"><table><thead><tr><th>Job</th><th>Match</th><th>Location</th><th>Stage</th><th>Actions</th></tr></thead><tbody>{visible.map(job=><tr key={job.id}><td><Link href={`/jobs/${job.id}`}><strong>{job.title}</strong><small>{job.company} · {job.salary??"Salary not listed"}</small></Link></td><td><strong className="job-score">{job.score}</strong><CategoryPill category={job.category}/></td><td>{job.location}<small>{job.arrangement}</small></td><td><select className="compact-select" value={job.status} disabled={pending===job.id} onChange={event=>updateStage(job,event.target.value as ApplicationStage)}>{stages.map(stage=><option key={stage}>{stage}</option>)}</select></td><td><div className="compact-actions"><Link className="mini-btn" href={`/jobs/${job.id}`}><ExternalLink size={13}/>View</Link><button className="mini-btn danger" type="button" disabled={pending===job.id} onClick={()=>remove(job)}><Trash2 size={13}/>Remove</button></div></td></tr>)}</tbody></table></div>:<div className="card empty"><h2>No jobs yet</h2><p className="subtle">Add a job URL to begin Neelam’s private jobs table.</p><Link className="btn primary" href="/jobs/discover">Add first job</Link></div>}</>;
}
