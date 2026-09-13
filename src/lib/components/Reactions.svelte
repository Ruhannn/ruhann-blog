<script lang="ts">
  import type { Counters } from "$lib/service/notion";
  import { onMount } from "svelte";

  export let slug: string;
  /** Rendered server-side from the cached counts, so the number is never blank. */
  export let counters: Counters;

  type Vote = "like" | "dislike" | null;

  let likes = counters.likes;
  let dislikes = counters.dislikes;
  let vote: Vote = null;
  let pending = false;
  let bump: Vote = null;

  const storageKey = `vote:${slug}`;

  onMount(() => {
    // The reader's own vote is the only thing the server can't put in cached
    // HTML, and it's the one thing the browser already knows. No request.
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "like" || saved === "dislike") {
        vote = saved;
      }
    }
    catch {
    // storage blocked — the button just starts unpressed
    }

    fetch(`/api/view/${slug}`, { method: "POST", keepalive: true }).catch(() => {});
  });

  function remember(next: Vote) {
    try {
      if (next) {
        localStorage.setItem(storageKey, next);
      }
      else {
        localStorage.removeItem(storageKey);
      }
    }
    catch {
    // nothing to do — the server still dedupes on its own
    }
  }

  async function cast(choice: Exclude<Vote, null>) {
    if (pending) {
      return;
    }

    const previous = { likes, dislikes, vote };
    const next: Vote = vote === choice ? null : choice;

    if (vote === "like") {
      likes -= 1;
    }
    if (vote === "dislike") {
      dislikes -= 1;
    }
    if (next === "like") {
      likes += 1;
    }
    if (next === "dislike") {
      dislikes += 1;
    }
    vote = next;
    remember(next);

    if (next) {
      bump = next;
      setTimeout(() => (bump = null), 260);
    }

    pending = true;
    try {
      const res = await fetch(`/api/reactions/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: choice }),
      });
      if (!res.ok) {
        throw new Error(String(res.status));
      }
      const data = await res.json() as { likes: number; dislikes: number; vote: Vote };
      likes = data.likes;
      dislikes = data.dislikes;
      vote = data.vote;
      remember(data.vote);
    }
    catch {
      ({ likes, dislikes, vote } = previous);
      remember(previous.vote);
    }
    finally {
      pending = false;
    }
  }
</script>

<div class="reactions">
  <button
    type="button"
    class="react"
    class:on={vote === "like"}
    class:bump={bump === "like"}
    aria-pressed={vote === "like"}
    aria-label="Like this post"
    on:click={() => cast("like")}
  >
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Zm4.4-7.6L10 9v12h7.6a2 2 0 0 0 2-1.6l1.3-7a2 2 0 0 0-2-2.4H14l.6-3.3a1.8 1.8 0 0 0-3.2-1.3Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
    <span class="n">{likes}</span>
  </button>

  <button
    type="button"
    class="react"
    class:on={vote === "dislike"}
    class:bump={bump === "dislike"}
    aria-pressed={vote === "dislike"}
    aria-label="Dislike this post"
    on:click={() => cast("dislike")}
  >
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3Zm-4.4 7.6L14 15V3H6.4a2 2 0 0 0-2 1.6l-1.3 7A2 2 0 0 0 5.1 14H10l-.6 3.3a1.8 1.8 0 0 0 3.2 1.3Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
    <span class="n">{dislikes}</span>
  </button>
</div>
