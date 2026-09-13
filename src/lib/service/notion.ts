import type { Blog } from "$lib/types";
import { genericEmbed, videoEmbed } from "$lib/utils/embeds";
import { markdownToHtml } from "$lib/utils/markdownToHtml";
import { NotionToMarkdown } from "notion-to-md";

/** Counts move often and matter little — a short window keeps Notion quiet. */
const COUNTER_TTL = 300;

/** Content is pushed in by /sync; this only catches a webhook that never fired. */
const CONTENT_TTL = 86400;

/** Notion allows roughly 3 requests/second. Stay under it during a full sync. */
const SYNC_CONCURRENCY = 3;

export interface Counters {
  views: number;
  likes: number;
  dislikes: number;
}

interface CachedBlogPost {
  data: Blog;
  markdown: string;
}

export default class NotionService {
  private databaseId: string;
  private token: string;
  private baseUrl = "https://api.notion.com/v1";
  private headers: Record<string, string>;
  private kv?: KVNamespace;
  n2m: NotionToMarkdown;

  constructor(env: Env) {
    this.databaseId = env.NOTION_BLOG_DATABASE_ID;
    this.token = env.NOTION_TOKEN;
    this.kv = env.CACHE;
    this.headers = {
      "Authorization": `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    };

    // notion-to-md needs a client-like object with blocks.children.list
    const notionClientShim = {
      blocks: {
        children: {
          list: async ({ block_id }: { block_id: string }) => {
            const res = await fetch(
              `${this.baseUrl}/blocks/${block_id}/children?page_size=100`,
              { headers: this.headers },
            );
            if (!res.ok) {
              throw new Error(`Notion API error: ${res.status}`);
            }
            return res.json();
          },
        },
      },
    };

    this.n2m = new NotionToMarkdown({ notionClient: notionClientShim as any });

    // Without these, a Notion video block renders as a plain link.
    this.n2m.setCustomTransformer("video", async (block: any) => {
      const content = block.video;
      const url = content?.type === "external" ? content.external.url : content?.file?.url;
      const caption = (content?.caption ?? []).map((t: any) => t.plain_text).join("");
      return videoEmbed(url, caption) ?? false;
    });

    this.n2m.setCustomTransformer("embed", async (block: any) => {
      const url = block.embed?.url;
      const caption = (block.embed?.caption ?? []).map((t: any) => t.plain_text).join("");
      return genericEmbed(url, caption) ?? false;
    });
  }

  // ponytail: KV is the cache. Sync pushes fresh content in, so reads never
  // need Notion. TTL is only a safety net for a webhook that never fired.
  private async cacheWrite<T>(key: string, ttl: number, data: T): Promise<void> {
    if (!this.kv) {
      return;
    }
    await this.kv.put(key, JSON.stringify(data), ttl > 0 ? { expirationTtl: ttl } : undefined);
  }

  private async cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    if (this.kv) {
      const hit = await this.kv.get<T>(key, "json");
      if (hit !== null) {
        return hit;
      }
    }

    const data = await fn();
    await this.cacheWrite(key, ttl, data);

    return data;
  }

  private async notionRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Notion API error ${res.status}: ${error}`);
    }
    return res.json() as Promise<T>;
  }

  /**
   * Post counters live on the Notion page itself — Views, Likes and Dislikes
   * number properties. Reads go through the edge cache; writes are read-then-write,
   * so two clicks landing in the same second can cost one count. That is an
   * accepted trade for having no database.
   */
  async getCounters(pageId: string): Promise<Counters> {
    return this.cached(`counters:${pageId}`, COUNTER_TTL, async () => {
      const page = await this.notionRequest<{ properties: any }>(`/pages/${pageId}`, "GET");
      return NotionService.pageToCounters(page);
    });
  }

  async bumpCounters(pageId: string, delta: Partial<Counters>): Promise<Counters> {
    const current = await this.getCounters(pageId);
    const next: Counters = {
      views: Math.max(0, current.views + (delta.views ?? 0)),
      likes: Math.max(0, current.likes + (delta.likes ?? 0)),
      dislikes: Math.max(0, current.dislikes + (delta.dislikes ?? 0)),
    };

    const properties: Record<string, { number: number }> = {};
    if (delta.views) {
      properties.Views = { number: next.views };
    }
    if (delta.likes) {
      properties.Likes = { number: next.likes };
    }
    if (delta.dislikes) {
      properties.Dislikes = { number: next.dislikes };
    }

    if (Object.keys(properties).length > 0) {
      await this.notionRequest(`/pages/${pageId}`, "PATCH", { properties });
    }

    // Write through, so the next reader sees the new count immediately instead
    // of waiting out the TTL on a value we already know is stale.
    await this.cacheWrite(`counters:${pageId}`, COUNTER_TTL, next);

    return next;
  }

  private static pageToCounters(page: any): Counters {
    const n = (name: string) => page?.properties?.[name]?.number ?? 0;
    return { views: n("Views"), likes: n("Likes"), dislikes: n("Dislikes") };
  }

  private async notionPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Notion API error ${res.status}: ${error}`);
    }
    return res.json() as Promise<T>;
  }

  async getBlogs(): Promise<Blog[]> {
    return this.cached("blogs", CONTENT_TTL, () => this.fetchBlogs());
  }

  /**
   * Renaming a post in Notion changes its slug, which leaves the cached list
   * pointing at URLs that 404 until the TTL expires. One forced refresh on a
   * miss makes that self-healing instead of a 30-minute dead link.
   */
  async refreshBlogs(): Promise<Blog[]> {
    const blogs = await this.fetchBlogs();
    await this.cacheWrite("blogs", CONTENT_TTL, blogs);
    return blogs;
  }

  private async fetchBlogs(): Promise<Blog[]> {
    const response = await this.notionPost<{ results: any[] }>(
      `/databases/${this.databaseId}/query`,
      {
        filter: {
          property: "Published",
          checkbox: { equals: true },
        },
        sorts: [{ property: "Updated", direction: "descending" }],
      },
    );

    return response.results.map(NotionService.pageToBlogTransformer);
  }

  async getBlogBySlug(slug: string): Promise<CachedBlogPost> {
    return this.cached(`blog:${slug}`, CONTENT_TTL, () => this.fetchBlogBySlug(slug));
  }

  private async fetchBlogBySlug(slug: string): Promise<CachedBlogPost> {
    const response = await this.notionPost<{ results: any[] }>(
      `/databases/${this.databaseId}/query`,
      {
        filter: {
          property: "Slug",
          formula: { string: { equals: slug } },
        },
      },
    );

    const page = response.results[0];
    if (!page) {
      throw new Error(`No blog found for slug: ${slug}`);
    }
    const mdBlocks = await this.n2m.pageToMarkdown(page.id);
    const markdown = await markdownToHtml(
      this.n2m.toMarkdownString(mdBlocks).parent,
    );
    const data = NotionService.pageToBlogTransformer(page);

    return { data, markdown };
  }

  private static pageToBlogTransformer(page: any): Blog {
    const props = page.properties ?? {};
    const words = props.Words?.number ?? 0;

    return {
      id: page.id,
      cover:
        page?.cover?.type === "external"
          ? page.cover.external.url
          : page?.cover?.type === "file"
            ? page.cover.file.url
            : null,
      title: props.Name?.title?.[0]?.plain_text ?? "Untitled",
      description: props.Description?.rich_text?.[0]?.plain_text ?? "",
      tags: (props.Tags?.multi_select ?? []).map((t: any) => t.name),
      createdAt: page.created_time,
      lastUpdateAt: page.last_edited_time,
      slug: props.Slug?.formula?.string ?? "",
      readTime: `${Math.ceil(words / 200 + 1)} mins read`,
    };
  }

  /**
   * Push model: refetch everything from Notion and write it into KV, so the
   * first visitor after a sync gets a warm read instead of a cold Notion call.
   * Also drops keys for posts that no longer exist — a rename leaves the old
   * slug behind, and nothing else would ever clean it up.
   */
  async purge(): Promise<number> {
    if (!this.kv) {
      return 0;
    }

    const blogs = await this.fetchBlogs();
    await this.cacheWrite("blogs", CONTENT_TTL, blogs);

    // Sequential batches, not Promise.all over everything: a full sync of N
    // posts is N Notion calls, and firing them at once earns 429s past ~10.
    for (let i = 0; i < blogs.length; i += SYNC_CONCURRENCY) {
      await Promise.all(blogs.slice(i, i + SYNC_CONCURRENCY).map(async (b) => {
        const post = await this.fetchBlogBySlug(b.slug);
        await this.cacheWrite(`blog:${b.slug}`, CONTENT_TTL, post);
        await this.kv!.delete(`counters:${b.id}`);
      }));
    }

    await this.deleteOrphans(new Set(blogs.map(b => `blog:${b.slug}`)));

    return blogs.length;
  }

  /** Remove `blog:*` keys whose slug is no longer in the published set. */
  private async deleteOrphans(live: Set<string>): Promise<void> {
    let cursor: string | undefined;
    do {
      const page = await this.kv!.list({ prefix: "blog:", cursor });
      await Promise.all(
        page.keys
          .filter(k => !live.has(k.name))
          .map(k => this.kv!.delete(k.name)),
      );
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  }
}

export function createNotionService(env: Env) {
  return new NotionService(env);
}
