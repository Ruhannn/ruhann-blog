/**
 * Notion video and embed blocks. notion-to-md turns both into a plain markdown
 * link — `[clip.mp4](https://…)` — so without this they render as blue text
 * instead of something you can play.
 */

const YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/;

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/** A 16:9 frame that reserves its space before the player loads, so nothing shifts. */
function frame(src: string, title: string) {
  return `<div class="embed"><iframe src="${escapeAttr(src)}" title="${escapeAttr(title)}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
}

export function videoEmbed(url: string, caption = ""): string | null {
  if (!url) {
    return null;
  }

  const youtube = url.match(YOUTUBE);
  if (youtube) {
    return frame(`https://www.youtube-nocookie.com/embed/${youtube[1]}`, caption || "YouTube video");
  }

  const vimeo = url.match(VIMEO);
  if (vimeo) {
    return frame(`https://player.vimeo.com/video/${vimeo[1]}`, caption || "Vimeo video");
  }

  // A real video file: preload metadata only, so opening a post never pulls
  // down megabytes the reader may not watch.
  if (/\.(?:mp4|webm|ogv|mov)(?:\?|$)/i.test(url)) {
    const label = caption ? `<figcaption>${escapeAttr(caption)}</figcaption>` : "";
    return `<figure class="video"><video controls preload="metadata" playsinline src="${escapeAttr(url)}"></video>${label}</figure>`;
  }

  return null;
}

/** Embeds that aren't video — CodePen, Figma, a tweet — stay a link unless we know the shape. */
export function genericEmbed(url: string, caption = ""): string | null {
  return videoEmbed(url, caption);
}
