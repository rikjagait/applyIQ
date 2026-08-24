const MANIFEST_URL = "https://storage.stapply.ai/jobhive/v1/manifest.json";

type Manifest = {
  companies?: { csv?: string };
  updated_at?: string;
};

export type CompanyDirectoryEntry = {
  ats: string;
  name: string;
  slug: string;
  url: string;
};

function parseCsvRow(row: string) {
  const fields: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === '"') {
      if (quoted && row[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(value);
      value = "";
    } else value += character;
  }
  fields.push(value);
  return fields;
}

export function parseCompanyDirectory(csv: string): CompanyDirectoryEntry[] {
  const rows = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (!rows.length) return [];
  const headers = parseCsvRow(rows[0]).map(value => value.trim().toLowerCase());
  return rows.slice(1).map(row => {
    const values = parseCsvRow(row);
    const read = (name: string) => values[headers.indexOf(name)]?.trim() ?? "";
    return { ats: read("ats"), name: read("name"), slug: read("slug"), url: read("url") };
  }).filter(entry => entry.ats && entry.name && entry.url.startsWith("https://"));
}

function normalized(value: string) {
  return value.toLowerCase().replace(/\b(inc|llc|ltd|limited|company|co|group|holdings)\b\.?/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function rankCompanyMatches(entries: CompanyDirectoryEntry[], companyName: string, limit = 12) {
  const needle = normalized(companyName);
  if (!needle) return [];
  return entries.map(entry => {
    const name = normalized(entry.name);
    const slug = normalized(entry.slug);
    const exact = name === needle || slug === needle;
    const starts = name.startsWith(needle) || slug.startsWith(needle);
    const contains = name.includes(needle) || slug.includes(needle) || needle.includes(name);
    return { entry, score: exact ? 100 : starts ? 80 : contains ? 60 : 0 };
  }).filter(match => match.score > 0).sort((a, b) => b.score - a.score || a.entry.name.length - b.entry.name.length).slice(0, limit).map(match => match.entry);
}

async function getText(url: string, timeout = 15_000) {
  const response = await fetch(url, {
    headers: { accept: "text/csv,application/json", "user-agent": "ApplyIQ/1.0 job discovery" },
    next: { revalidate: 60 * 60 * 6 },
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) throw new Error(`Open jobs directory returned ${response.status}.`);
  return response.text();
}

export async function findCompaniesInStapply(companyName: string) {
  const manifest = JSON.parse(await getText(MANIFEST_URL)) as Manifest;
  if (!manifest.companies?.csv) throw new Error("Open jobs directory is temporarily unavailable.");
  const entries = parseCompanyDirectory(await getText(manifest.companies.csv, 20_000));
  return { matches: rankCompanyMatches(entries, companyName), updatedAt: manifest.updated_at ?? null };
}
