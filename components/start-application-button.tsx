"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export function StartApplicationButton({jobId}:{jobId:string}){const router=useRouter();const [pending,setPending]=useState(false);const [error,setError]=useState("");async function start(){setPending(true);setError("");const response=await fetch(`/api/applications/${jobId}/stage`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({stage:"Preparing Application"})});if(!response.ok){const result=await response.json().catch(()=>({})) as {error?:string};setError(result.error||"Application could not be started.");setPending(false);return;}router.push(`/jobs/${jobId}/studio`);router.refresh();}return <div className="start-application"><button className="btn primary" type="button" onClick={start} disabled={pending}>{pending?"Starting…":"Start application"}<ArrowRight size={14}/></button>{error&&<span role="alert">{error}</span>}</div>}

