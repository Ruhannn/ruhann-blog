import type { RequestHandler } from "./$types";
import { PUBLIC_SITE_URL } from "$env/static/public";
import { HOME } from "$lib/consts";
import { notion } from "$lib/service/notion";
import RSS from "rss";

export const GET: RequestHandler = async () => {
  const blogs = await notion.getBlogs();
  const items = blogs.sort(
    (a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
  );

  const feed = new RSS({
    title: HOME.TITLE,
    description: HOME.DESCRIPTION,
    site_url: PUBLIC_SITE_URL,
    feed_url: `${PUBLIC_SITE_URL}/rss.xml`,
  });

  items.forEach((item) => {
    feed.item({
      title: item.title,
      description: item.description,
      url: `${PUBLIC_SITE_URL}/blog/${item.slug}/`,
      date: new Date(item.createdAt),
    });
  });

  return new Response(feed.xml(), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
