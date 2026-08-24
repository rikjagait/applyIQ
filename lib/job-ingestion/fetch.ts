import "server-only";
import { assertPublicDns, UnsafeJobUrlError, validateJobUrl } from "@/lib/job-ingestion/url-safety";
import { extractJobFromHtml, type ExtractedJob } from "@/lib/job-ingestion/extract";

const MAX_BYTES = 2_000_000; const MAX_REDIRECTS = 3;

export async function ingestJobUrl(rawUrl: string): Promise<ExtractedJob> {
  let url = validateJobUrl(rawUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    await assertPublicDns(url);
    const response = await fetch(url, { redirect:"manual", signal:AbortSignal.timeout(12_000), headers:{"User-Agent":"ApplyIQ/1.0 job-page reader","Accept":"text/html,application/xhtml+xml"}, cache:"no-store" });
    if (response.status >= 300 && response.status < 400) {
      const location=response.headers.get("location"); if(!location) throw new Error("The job page redirected without a destination.");
      if (redirect === MAX_REDIRECTS) throw new Error("The job page redirected too many times.");
      url=validateJobUrl(new URL(location,url).toString()); continue;
    }
    if (!response.ok) throw new Error(`The job site returned HTTP ${response.status}.`);
    const contentType=response.headers.get("content-type")?.toLowerCase() || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("The URL does not point to an HTML job page.");
    const declared=Number(response.headers.get("content-length") || 0); if(declared>MAX_BYTES) throw new Error("The job page is too large to process safely.");
    const bytes=await response.arrayBuffer(); if(bytes.byteLength>MAX_BYTES) throw new Error("The job page is too large to process safely.");
    return extractJobFromHtml(new TextDecoder().decode(bytes),url.toString());
  }
  throw new UnsafeJobUrlError("The job URL could not be processed safely.");
}
