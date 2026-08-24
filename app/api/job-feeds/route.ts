import { z } from "zod";
import {
  createJobFeed,
  deleteJobFeed,
  listJobFeeds,
} from "@/lib/repositories/job-feeds";
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  boardUrl: z.string().url().max(2000),
});
export async function GET() {
  return Response.json({ feeds: await listJobFeeds() });
}
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success)
      return Response.json(
        { error: "Add a company name and supported careers-board URL." },
        { status: 400 },
      );
    return Response.json(await createJobFeed(parsed.data), { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not save feed.",
      },
      { status: 500 },
    );
  }
}
export async function DELETE(request: Request) {
  try {
    const parsed = z
      .object({ id: z.string().min(1).max(100) })
      .safeParse(await request.json());
    if (!parsed.success)
      return Response.json(
        { error: "Choose a company to remove." },
        { status: 400 },
      );
    return Response.json(await deleteJobFeed(parsed.data.id));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not remove company.",
      },
      { status: 500 },
    );
  }
}
