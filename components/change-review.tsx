"use client";
import { useState } from "react";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import type { TailoredChange } from "@/lib/application-studio";
import { assessClaim } from "@/lib/factual-integrity";

export function ChangeReview({change,onDecision}:{change:TailoredChange;onDecision?:(value:string|null|undefined)=>void}) {
  const [status,setStatus]=useState<"pending"|"accepted"|"rejected">("pending"); const [editing,setEditing]=useState(false); const [tailored,setTailored]=useState(change.tailored); const integrity=assessClaim(tailored,[change.original]);
  function accept(){setEditing(false);setStatus("accepted");onDecision?.(tailored)} function reject(){setStatus("rejected");onDecision?.(null)} function reset(){setTailored(change.tailored);setStatus("pending");setEditing(false);onDecision?.(undefined)}
  return <article className={`card change-card ${status}`}><div className="section-head"><span className={`integrity ${integrity.toLowerCase()}`}>{integrity} · factual check</span><span className="subtle">{editing?"Editing":status==="pending"?"Awaiting review":status}</span></div><div className="change-grid"><div><div className="eyebrow">Original</div><p>{change.original}</p></div><div><div className="eyebrow">Tailored</div>{editing?<textarea aria-label="Edit tailored résumé wording" className="input inline-edit" value={tailored} onChange={event=>setTailored(event.target.value)}/>:<p>{tailored}</p>}</div></div><p className="subtle"><strong>Why:</strong> {change.reason}</p><div className="actions">{editing?<button className="btn primary" type="button" onClick={accept}><Check size={14}/>Save and accept</button>:<><button className="btn primary" type="button" onClick={accept}><Check size={14}/>Accept</button><button className="btn" type="button" onClick={reject}><X size={14}/>Reject</button><button className="btn" type="button" onClick={()=>setEditing(true)}><Pencil size={14}/>Edit</button></>}{status!=="pending"||tailored!==change.tailored?<button className="btn" type="button" onClick={reset}><RotateCcw size={14}/>Reset</button>:null}</div></article>;
}
