import * as cheerio from "cheerio";

export interface ExtractedJob {
  title: string; company: string; location: string; description: string;
  sourceUrl: string; extractionMethod: "json-ld" | "html";
}

type JsonObject = Record<string, unknown>;
function objects(value: unknown): JsonObject[] {
  if (Array.isArray(value)) return value.flatMap(objects);
  if (!value || typeof value !== "object") return [];
  const item = value as JsonObject;
  return [item, ...objects(item["@graph"])];
}
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function typeIncludes(value: unknown, expected: string) { return Array.isArray(value) ? value.includes(expected) : value === expected; }
function organizationName(value: unknown) { if (!value || typeof value !== "object") return ""; return text((value as JsonObject).name); }
function addressText(value: unknown): string {
  if (Array.isArray(value)) return value.map(addressText).filter(Boolean).join("; ");
  if (!value || typeof value !== "object") return "";
  const item = value as JsonObject; const address = (item.address && typeof item.address === "object" ? item.address : item) as JsonObject;
  return [address.addressLocality, address.addressRegion, address.addressCountry].map(text).filter(Boolean).join(", ");
}
function cleanHtml(value: string) { return cheerio.load(`<main>${value}</main>`)("main").text().replace(/\s+/g," ").trim(); }

export function extractJobFromHtml(html: string, sourceUrl: string): ExtractedJob {
  const $ = cheerio.load(html);
  for (const element of $("script[type='application/ld+json']").toArray()) {
    try {
      const parsed: unknown = JSON.parse($(element).text());
      const job = objects(parsed).find(item => typeIncludes(item["@type"], "JobPosting"));
      if (!job) continue;
      const description = cleanHtml(text(job.description));
      if (description.length < 100) continue;
      const remote = text(job.jobLocationType).toUpperCase() === "TELECOMMUTE";
      const applicantLocation = addressText(job.applicantLocationRequirements);
      return {
        title:text(job.title) || pageTitle($), company:organizationName(job.hiringOrganization) || meta($,"og:site_name") || "Company not identified",
        location:remote ? applicantLocation ? `Remote — ${applicantLocation}` : "Remote" : addressText(job.jobLocation) || "Location not identified",
        description, sourceUrl, extractionMethod:"json-ld",
      };
    } catch { /* Ignore malformed JSON-LD and continue to visible content. */ }
  }
  const selectors = ["[data-testid*='job-description']","[class*='job-description']","[id*='job-description']","main","article"];
  let description = "";
  for (const selector of selectors) { const candidate=$(selector).first().text().replace(/\s+/g," ").trim(); if(candidate.length>description.length) description=candidate; }
  if (description.length < 100) throw new Error("We could not find a complete job description on this page.");
  const title = meta($,"og:title") || $("h1").first().text().trim() || pageTitle($);
  const company = meta($,"og:site_name") || $("[class*='company']").first().text().replace(/\s+/g," ").trim() || new URL(sourceUrl).hostname.replace(/^www\./,"");
  const location = $("[class*='location']").first().text().replace(/\s+/g," ").trim() || "Location not identified";
  return { title:title.slice(0,160), company:company.slice(0,160), location:location.slice(0,160), description:description.slice(0,50000), sourceUrl, extractionMethod:"html" };
}
function meta($: cheerio.CheerioAPI, property: string) { return $(`meta[property='${property}'],meta[name='${property}']`).first().attr("content")?.trim() || ""; }
function pageTitle($: cheerio.CheerioAPI) { return $("title").text().replace(/\s+/g," ").trim().split(/\s+[|–—-]\s+/)[0] || "Job opportunity"; }
