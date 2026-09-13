import type { RequestHandler } from "./$types";
import { HOME } from "$lib/consts";
import { createNotionService } from "$lib/service/notion";
import RSS from "rss";

export const GET: RequestHandler = async ({ platform, setHeaders, url }) => {
  const env = platform!.env;
  const site = env.PUBLIC_SITE_URL || url.origin;

  const notion = createNotionService(env);
  const blogs = await notion.getBlogs();

  const items = blogs.sort(
    (a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
  );

  const feed = new RSS({
    title: HOME.TITLE,
    description: HOME.DESCRIPTION,
    site_url: site,
    feed_url: `${site}/rss.xml`,
  });

  items.forEach((item) => {
    feed.item({
      title: item.title,
      description: item.description,
      url: `${site}/blog/${item.slug}/`,
      date: new Date(item.createdAt),
    });
  });

  setHeaders({
    "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  });

  return new Response(feed.xml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
