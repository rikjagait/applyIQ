import type { Job } from "@/lib/types";

export function RequirementsMatrix({requirements}:{requirements:Job["requirements"]}){
  return <div className="requirements-matrix"><div className="requirements-head"><span>Requirement</span><span>Priority</span><span>Neelam’s assessment</span></div>{requirements.map(item=><article className="requirement-row" key={item.requirement}><div className="requirement-copy"><strong>{item.requirement}</strong>{item.category?<span className="eyebrow">{item.category}</span>:null}</div><div><span className="pill">{item.importance}</span></div><div className="requirement-assessment"><div><span className={`strength-badge strength-${item.strength.toLowerCase()}`}>{item.strength}</span><p>{item.evidence}</p></div>{item.gap&&item.gap!=="None"?<small><strong>Gap:</strong> {item.gap}</small>:null}</div></article>)}</div>;
}
