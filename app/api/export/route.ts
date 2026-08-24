import { listJobs } from "@/lib/repositories/jobs";

function cell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
export async function GET() {
  const jobs=await listJobs();
  const headers = ["company","role","location","arrangement","salary","match_score","category","status","source"];
  const rows = jobs.map(j => [j.company,j.title,j.location,j.arrangement,j.salary,j.score,j.category,j.status,j.source]);
  const csv = [headers, ...rows].map(row => row.map(cell).join(",")).join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=applyiq-export.csv" } });
}
