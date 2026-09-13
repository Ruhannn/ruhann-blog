import { getHighlighter } from "$lib/service/shiki";
import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";
import sanitizeHtml from "sanitize-html";

function escapeAttr(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * isomorphic-dompurify cannot run on Cloudflare Workers — it reaches for jsdom,
 * which has no DOM to stand on there, so every post threw. sanitize-html parses
 * the string directly and works in the Workers runtime.
 *
 * The allowlist keeps what the blog actually renders: Shiki's spans and inline
 * styles, and the video/iframe embeds from Notion. Everything else is dropped,
 * scripts and event handlers included.
 */
const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "style",
    "figure",
    "figcaption",
    "video",
    "source",
    "iframe",
    "h1",
    "h2",
  ],
  allowedAttributes: {
    "*": ["class", "style", "id"],
    "a": ["href", "name", "target", "rel"],
    "img": ["src", "alt", "title", "width", "height", "loading", "decoding"],
    "video": ["src", "controls", "preload", "playsinline", "poster", "width", "height"],
    "source": ["src", "type"],
    "iframe": ["src", "title", "loading", "allow", "allowfullscreen", "width", "height"],
    "input": ["type", "checked", "disabled"],
  },
  // Embeds may only point at players we chose, never at an arbitrary origin.
  allowedIframeHostnames: ["www.youtube-nocookie.com", "www.youtube.com", "player.vimeo.com"],
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowVulnerableTags: true,
};

export const markdownToHtml = async (m: string) => {
  marked.use(gfmHeadingId());
  const highlighter = await getHighlighter();
  marked.use({
    async: true,
    renderer: {
      // Below-the-fold images shouldn't block the read, and a caption is worth
      // having when Notion gives us one.
      image({ href, title, text }: { href: string; title?: string | null; text?: string }) {
        const src = escapeAttr(href);
        const alt = escapeAttr(text ?? "");
        const img = `<img src="${src}" alt="${alt}" loading="lazy" decoding="async" />`;
        return title
          ? `<figure>${img}<figcaption>${escapeAttr(title)}</figcaption></figure>`
          : img;
      },
      code({ text, lang }: { text: string; lang?: string }) {
        const language = lang || "text";
        try {
          const html = highlighter.codeToHtml(text, {
            lang: language,
            themes: {
              light: "catppuccin-latte",
              dark: "catppuccin-mocha",
            },
          });
          return html;
        }
        catch {
          return `<pre><code class="language-${language}">${text}</code></pre>`;
        }
      },
    },
  });

  const rawHtml = await marked.parse(m);

  return sanitizeHtml(rawHtml, SANITIZE);
};
