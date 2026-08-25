"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function ReanalyzeJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    setPending(true); setError("");
    const response = await fetch(`/api/jobs/${jobId}/reanalyze`, { method: "POST" });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error || "The role could not be re-screened.");
    else router.refresh();
    setPending(false);
  }
  return <div><button className="btn" type="button" onClick={run} disabled={pending}><RefreshCw size={14}/>{pending ? "Screening…" : "Re-screen with AI"}</button>{error ? <small className="error-box" role="alert">{error}</small> : null}</div>;
}
