"use client";
import { useState } from "react";
import { stages } from "@/lib/data";
import type { Job } from "@/lib/types";
import type { ApplicationStage } from "@/lib/types";

export function PipelineBoard({jobs}:{jobs:Job[]}) {
  const [items, setItems] = useState(jobs); const [error,setError]=useState("");
  const visible = stages.slice(0, 9);
  async function drop(stage: ApplicationStage, id: string) { const previous=items; setItems(old => old.map(j => j.id === id ? {...j, status: stage} : j)); setError(""); try{const response=await fetch(`/api/applications/${id}/stage`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({stage})});if(!response.ok)throw new Error();}catch{setItems(previous);setError("That move could not be saved. Your pipeline was restored.");} }
  return <>{error&&<div className="error-box" role="alert" style={{marginBottom:12}}>{error}</div>}<div className="kanban">{visible.map(stage => <section className="column" key={stage} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(stage,e.dataTransfer.getData("text/plain"))}><div className="column-head"><span>{stage}</span><span>{items.filter(j=>j.status===stage).length}</span></div>{items.filter(j=>j.status===stage).map(job=><div className="job-card" draggable onDragStart={e=>e.dataTransfer.setData("text/plain",job.id)} key={job.id}><strong>{job.title}</strong><small>{job.company}</small><div className="tags"><span className="tag">Score {job.score}</span><span className="tag">{job.arrangement}</span></div></div>)}</section>)}</div></>;
}
