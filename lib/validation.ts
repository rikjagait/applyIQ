import { z } from "zod";

export const jobIntakeSchema = z.object({
  sourceUrl: z.string().trim().url().max(2000),
  title: z.string().trim().max(160).optional().default(""), company: z.string().trim().max(160).optional().default(""),
  location: z.string().trim().max(160).optional().default(""), description: z.string().trim().max(50000).optional().default(""),
}).superRefine((value,ctx)=>{
  const hasManual = value.title.length >= 2 && value.company.length >= 2 && value.location.length >= 2 && value.description.length >= 100;
  if (!value.sourceUrl && !hasManual) ctx.addIssue({code:"custom",message:"Add a job URL or complete the manual fields."});
});

export const manualJobSchema = jobIntakeSchema;

export const resumeUploadSchema = z.object({
  name: z.string().regex(/\.(docx|pdf)$/i), size: z.number().max(10 * 1024 * 1024),
});
