import "server-only";
import { cookies } from "next/headers";

export const PREVIEW_COOKIE = "applyiq_preview";
export function previewAvailable(){return process.env.NODE_ENV === "development";}
export async function isPreviewMode(){return previewAvailable() && (await cookies()).get(PREVIEW_COOKIE)?.value === "1";}
