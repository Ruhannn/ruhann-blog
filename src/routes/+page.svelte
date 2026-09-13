<script lang="ts">
  import type { PageData } from "./$types";
  import { page } from "$app/stores";
  import Head from "$lib/components/Head.svelte";
  import Tag from "$lib/components/Tag.svelte";
  import { HOME, INFO, SOCIALS } from "$lib/consts";
  import { formatDate } from "$lib/utils/formatDate";

  export let data: PageData;

  let searching = false;
  let query = "";
  let input: HTMLInputElement | undefined;

  $: tag = $page.url.searchParams.get("tag") ?? "all";

  $: tags = ["all", ...new Set(data.blogs.flatMap(b => b.tags))];
  $: needle = query.trim().toLowerCase();
  $: visible = searching
    ? data.blogs.filter(b => matchesQuery(b.title, b.tags))
    : data.blogs.filter(b => tag === "all" || b.tags.includes(tag));

  function matchesQuery(title: string, postTags: string[]) {
    if (!needle) {
      return true;
    }
    return (
      title.toLowerCase().includes(needle)
      || postTags.some(t => t.toLowerCase().includes(needle))
    );
  }

  async function openFind() {
    searching = true;
    await Promise.resolve();
    input?.focus();
  }

  function closeFind() {
    searching = false;
    query = "";
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      closeFind();
      return;
    }

    const target = e.target as HTMLElement | null;
    if (
      target
      && (/^(?:INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
        || target.isContentEditable)
    ) {
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) {
      return;
    }
    if (e.key === "/") {
      e.preventDefault();
      openFind();
    }
  }
</script>

<Head
  title={HOME.TITLE}
  description={HOME.DESCRIPTION}
  image="/og/default.png"
/>

<svelte:window on:keydown={onKeydown} />

<div class="shell">
  <section class="intro animate" id="about" style="--d:40ms">
    <h1>{INFO.FULL_NAME}</h1>
    <p>
      {INFO.DESCRIPTION}
    </p>
    <dl class="kv">
      {#each SOCIALS as SOCIAL (SOCIAL.NAME)}
        <dt>{SOCIAL.NAME}</dt>
        <dd><a href={SOCIAL.HREF}>{SOCIAL.NAME}</a></dd>
      {/each}
      <dt>email</dt>
      <dd><a href={`mailto:${INFO.EMAIL}`}>{INFO.EMAIL}</a></dd>
      <dt>feed</dt>
      <dd><a href="/rss.xml">/rss.xml</a></dd>
    </dl>
  </section>

  <div class="list-head animate" style="--d:140ms">
    <p class="sec-label">Writing</p>
    {#if searching}
      <label class="find">
        <span class="sig">/</span>
        <input
          bind:this={input}
          bind:value={query}
          type="search"
          placeholder="search posts…"
          autocomplete="off"
          aria-label="Search posts"
        />
        <button type="button" class="esc" on:click={closeFind}>esc</button>
      </label>
    {:else}
      <div class="tag-chips">
        {#each tags as t (t)}
          <Tag
            label={t}
            href={t === "all" ? "/" : undefined}
            active={tag === t}
            noscroll
          />
        {/each}
        <button
          type="button"
          class="find-open"
          on:click={openFind}
          aria-label="Search posts (press /)"
        >
          /
        </button>
      </div>
    {/if}
  </div>

  <ul class="post-list">
    {#each visible as blog, i (blog.id)}
      <li class="animate" style={`--d:${190 + Math.min(i, 8) * 40}ms`}>
        <a class="post-row" href={`/blog/${blog.slug}`}>
          <time class="d" datetime={new Date(blog.createdAt).toISOString()}>
            {formatDate(new Date(blog.createdAt))}
          </time>
          <span class="t">{blog.title}</span>
          <span class="r">{blog.readTime.replace(" read", "")}</span>
          {#if blog.description}
            <span class="desc"><span>{blog.description}</span></span>
          {/if}
        </a>
      </li>
    {/each}
  </ul>

  {#if visible.length === 0}
    <p class="list-empty">
      {searching ? `no posts match “${query}”.` : `nothing tagged “${tag}”.`}
    </p>
  {/if}
</div>
