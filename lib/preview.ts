import "server-only";
import { cookies } from "next/headers";

export const PREVIEW_COOKIE = "applyiq_preview";
export function publicDemoEnabled(){return process.env.NEXT_PUBLIC_APPLYIQ_PUBLIC_DEMO === "true";}
export function previewAvailable(){return process.env.NODE_ENV === "development" || publicDemoEnabled();}
export async function isPreviewMode(){return publicDemoEnabled() || (previewAvailable() && (await cookies()).get(PREVIEW_COOKIE)?.value === "1");}
