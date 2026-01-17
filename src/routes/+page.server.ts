import type { PageServerLoad } from "./$types";
import { notion } from "$lib/service/notion";

export const load: PageServerLoad = async () => {
  const blogs = await notion.getBlogs();

  return {
    blogs,
  };
};
