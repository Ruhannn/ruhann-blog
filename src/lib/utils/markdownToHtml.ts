import { getHighlighter } from "$lib/service/shiki";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";

export const markdownToHtml = async (m: string) => {
  marked.use(gfmHeadingId());
  const highlighter = await getHighlighter();
  marked.use({
    async: true,
    renderer: {
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
  const markdown = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ["style"],
    ADD_ATTR: ["style", "class"],
  });

  return markdown;
};
