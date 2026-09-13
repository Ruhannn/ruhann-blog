import type { PageServerLoad } from "./$types";
import { createNotionService } from "$lib/service/notion";

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
  const env = platform!.env;

  const notion = createNotionService(env);
  const blogs = await notion.getBlogs();

  setHeaders({
    "Cache-Control": "no-store",
  });

  return {
    blogs,
  };
};
