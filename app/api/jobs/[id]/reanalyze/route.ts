import { NextResponse } from "next/server";
import { analyzeJob } from "@/lib/ai/job-analysis";
import { getLatestResumeText } from "@/lib/repositories/resumes";
import { getStoredJobForAnalysis, replaceStoredJobAnalysis } from "@/lib/repositories/jobs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [job, resumeText] = await Promise.all([getStoredJobForAnalysis(id), getLatestResumeText()]);
    if (!resumeText) throw new Error("Upload a master résumé before re-screening this role.");
    const analysis = await analyzeJob(job, resumeText);
    await replaceStoredJobAnalysis(id, analysis);
    return NextResponse.json({ ok: true, provider: analysis.provider });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The role could not be re-screened." }, { status: 422 });
  }
}
