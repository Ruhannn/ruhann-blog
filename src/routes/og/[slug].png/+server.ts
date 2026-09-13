import type { RequestHandler } from "./$types";
import { createNotionService } from "$lib/service/notion";
import { error } from "@sveltejs/kit";

const WIDTH = 1200;
const HEIGHT = 630;

const BG = "#1c1b22";
const TEXT = "#eae9fc";
const ACCENT = "#7aa2f7";
const MUTED = "#8b8a9b";

const escape = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function markup(title: string, date: string, readTime: string, tags: string[]) {
  const size = title.length > 78 ? 56 : title.length > 46 ? 68 : 80;

  const chips = tags
    .slice(0, 3)
    .map(
      t =>
        `<div style="display:flex;font-size:22px;color:${ACCENT};background:rgba(122,162,247,0.12);padding:8px 16px;border-radius:6px;margin-left:10px;">${escape(t)}</div>`,
    )
    .join("");

  return `
  <div style="width:${WIDTH}px;height:${HEIGHT}px;display:flex;flex-direction:column;background:${BG};padding:64px 80px 58px;font-family:DM Sans;position:relative;">
    <div style="position:absolute;top:0;left:0;width:${WIDTH}px;height:340px;display:flex;background:linear-gradient(180deg, rgba(122,162,247,0.13) 0%, rgba(122,162,247,0) 100%);"></div>
    <div style="position:absolute;top:0;left:0;width:${WIDTH}px;height:6px;display:flex;background:${ACCENT};"></div>

    <div style="display:flex;font-size:27px;color:${ACCENT};letter-spacing:-0.01em;">ruhan ~</div>

    <div style="display:flex;flex:1;align-items:center;">
      <div style="display:flex;font-size:${size}px;font-weight:700;color:${TEXT};line-height:1.08;letter-spacing:-0.037em;max-width:1000px;">${escape(title)}</div>
    </div>

    <div style="display:flex;align-items:center;border-top:1px solid rgba(234,233,252,0.11);padding-top:30px;">
      <div style="display:flex;font-size:25px;color:${MUTED};">${escape(date)}</div>
      <div style="display:flex;color:#3f3e4d;margin:0 14px;">·</div>
      <div style="display:flex;font-size:25px;color:${MUTED};">${escape(readTime)}</div>
      <div style="display:flex;flex:1;"></div>
      ${chips}
    </div>
  </div>`;
}

export const GET: RequestHandler = async ({ params, platform, request }) => {
  const env = platform!.env;
  const cache = (globalThis as any).caches?.default as Cache | undefined;
  const key = new Request(request.url, { method: "GET" });

  const hit = await cache?.match(key);
  if (hit) {
    return hit;
  }

  const notion = createNotionService(env);
  let post = (await notion.getBlogs()).find(b => b.slug === params.slug);
  if (!post) {
    post = (await notion.refreshBlogs()).find(b => b.slug === params.slug);
  }
  if (!post) {
    throw error(404, "Not found");
  }

  const [{ ImageResponse }, regular, bold] = await Promise.all([
    import("workers-og"),
    env.ASSETS.fetch(new Request("https://assets.local/og/dm-sans-400.woff")).then(r => r.arrayBuffer()),
    env.ASSETS.fetch(new Request("https://assets.local/og/dm-sans-700.woff")).then(r => r.arrayBuffer()),
  ]);

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(post.createdAt));

  const image = new ImageResponse(
    markup(post.title, date, post.readTime, post.tags),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "DM Sans", data: regular, weight: 400, style: "normal" },
        { name: "DM Sans", data: bold, weight: 700, style: "normal" },
      ],
    },
  );

  const response = new Response(image.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=604800",
    },
  });

  platform?.context?.waitUntil?.(cache?.put(key, response.clone()) ?? Promise.resolve());

  return response;
};
