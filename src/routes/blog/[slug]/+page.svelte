<script lang="ts">
  import type { PageData } from "./$types";
  import Head from "$lib/components/Head.svelte";
  import Reactions from "$lib/components/Reactions.svelte";
  import Tag from "$lib/components/Tag.svelte";
  import { formatDate } from "$lib/utils/formatDate";

  export let data: PageData;
</script>

<Head
  title={data.data.title}
  description={data.data.description}
  image={data.ogImage}
  type="article"
/>

<div class="mx-auto max-w-4xl p-5">
  <header class="post-head animate" style="--d:40ms">
    <a class="back" href="/"><span class="ar">←</span> all posts</a>
    <h1>{data.data.title}</h1>
    <div class="post-meta">
      <time datetime={new Date(data.data.createdAt).toISOString()}>
        {formatDate(new Date(data.data.createdAt))}
      </time>
      <span>{data.data.readTime}</span>
      {#if data.data.tags.length}
        <span class="post-tags">
          {#each data.data.tags as t (t)}
            <a
              class="chip"
              class:on={false}
              href={`/?tag=${encodeURIComponent(t)}`}
            >
              #{t}
            </a>
          {/each}
        </span>
      {/if}
    </div>
  </header>

  <article class="animate" style="--d:120ms">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html data.markdown}
  </article>

  <Reactions slug={data.data.slug} counters={data.counters} />

  {#if data.next}
    <a
      class="post-foot animate"
      href={`/blog/${data.next.slug}`}
      style="--d:160ms"
    >
      <span class="lbl">next</span>
      <span class="nxt">{data.next.title}</span>
    </a>
  {/if}
</div>
