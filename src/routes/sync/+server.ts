import type { RequestHandler } from "@sveltejs/kit";
import { notion } from "$lib/service/notion";

export const GET: RequestHandler = async () => {
  await notion.clearAllCache();

  return new Response("done ;3", {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
