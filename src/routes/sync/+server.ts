import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async () => {
  return new Response("done ;3", {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
