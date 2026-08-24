import "server-only";
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export class UnsafeJobUrlError extends Error {}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
    (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
    parts[0] >= 224;
}

function isPrivateIpv6(address: string) {
  const value = address.toLowerCase();
  return value === "::1" || value === "::" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe8") || value.startsWith("fe9") || value.startsWith("fea") || value.startsWith("feb") || value.startsWith("::ffff:127.") || value.startsWith("::ffff:10.") || value.startsWith("::ffff:192.168.");
}

export function isPrivateAddress(address: string) {
  const version = isIP(address);
  return version === 4 ? isPrivateIpv4(address) : version === 6 ? isPrivateIpv6(address) : true;
}

export function validateJobUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new UnsafeJobUrlError("Enter a valid public job URL."); }
  if (url.protocol !== "https:") throw new UnsafeJobUrlError("Job URLs must use HTTPS.");
  if (url.username || url.password) throw new UnsafeJobUrlError("URLs containing credentials are not allowed.");
  if (url.port && url.port !== "443") throw new UnsafeJobUrlError("Only standard HTTPS job URLs are allowed.");
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".home")) throw new UnsafeJobUrlError("Private-network URLs are not allowed.");
  if (isIP(host) && isPrivateAddress(host)) throw new UnsafeJobUrlError("Private-network URLs are not allowed.");
  url.hash = "";
  return url;
}

export async function assertPublicDns(url: URL) {
  let addresses: Awaited<ReturnType<typeof lookup>>[] | { address: string }[];
  try { addresses = await lookup(url.hostname, { all:true, verbatim:true }); }
  catch { throw new UnsafeJobUrlError("The job site could not be reached."); }
  if (!addresses.length || addresses.some(({address}) => isPrivateAddress(address))) throw new UnsafeJobUrlError("The URL resolves to a private or unsafe network address.");
}
