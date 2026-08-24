import { NextResponse } from "next/server";
import { analyzeJob } from "@/lib/ai/job-analysis";
import { persistAnalyzedJob } from "@/lib/repositories/jobs";
import { manualJobSchema } from "@/lib/validation";
import { ingestJobUrl } from "@/lib/job-ingestion/fetch";
import { UnsafeJobUrlError } from "@/lib/job-ingestion/url-safety";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error:"Invalid JSON body" }, { status:400 }); }
  const parsed = manualJobSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error:"Enter a valid job URL or complete the manual fields.", fields:parsed.error.flatten().fieldErrors }, { status:422 });
  try {
    const manualComplete = parsed.data.title.length >= 2 && parsed.data.company.length >= 2 && parsed.data.location.length >= 2 && parsed.data.description.length >= 100;
    const vacancy = manualComplete ? {title:parsed.data.title,company:parsed.data.company,location:parsed.data.location,description:parsed.data.description,sourceUrl:parsed.data.sourceUrl,extractionMethod:"manual" as const} : await ingestJobUrl(parsed.data.sourceUrl);
    const analysis = await analyzeJob(vacancy);
    const id = await persistAnalyzedJob({description:vacancy.description,sourceUrl:vacancy.sourceUrl},analysis);
    return NextResponse.json({ analysis, persisted:Boolean(id), id, extractionMethod:vacancy.extractionMethod });
  } catch (error) {
    console.error("Job analysis route failed", error);
    const message = error instanceof UnsafeJobUrlError ? error.message : error instanceof Error ? error.message : "The vacancy could not be analyzed.";
    return NextResponse.json({ error:`${message} No data was saved. You can use manual recovery below.` }, { status:422 });
  }
}
