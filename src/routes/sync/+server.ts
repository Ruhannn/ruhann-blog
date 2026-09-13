import type { RequestHandler } from "./$types";
import { createNotionService } from "$lib/service/notion";
import { error, json } from "@sveltejs/kit";

const sync: RequestHandler = async ({ platform, url, request }) => {
  const env = platform!.env;
  const token = url.searchParams.get("token") ?? request.headers.get("x-sync-token");

  if (!env.SYNC_TOKEN || token !== env.SYNC_TOKEN) {
    throw error(401, "Unauthorized");
  }

  const purged = await createNotionService(env).purge();

  return json({ purged }, { headers: { "Cache-Control": "no-store" } });
};

export const GET = sync;
export const POST = sync;
