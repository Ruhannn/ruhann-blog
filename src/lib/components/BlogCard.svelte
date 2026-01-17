<script lang="ts">
  import type { Blog } from "$lib/types";
  import { formatDate } from "$lib/utils/formatDate";

  export let blog: Blog;
</script>

<a href={`/blog/${blog.slug}`}>
  <div class="w-full min-w-75 h-70 [box-shadow:0_2px_4px_0_rgba(0,0,0,0.1)] rounded-lg box-border overflow-hidden **:[transition:0.3s_ease_all] [&:hover_img]:-mt-8 [&:hover_h3]:p-[8px_12px_0] [&:focus-within_img]:-mt-8 [&:focus-within_h3]:p-[8px_12px_0] dark:bg-[#1e1e2e] bg-[#f9f7ff] text-text truncate animate">
    {#if blog.cover}
      <img
        class="w-full h-56 object-cover block"
        src={blog.cover}
        alt={`cover image for ${blog.title}`}
      />
    {/if}
    <h3 class="p-[12px_12px_48px] leading-8 font-medium text-xl">
      {blog.title}
    </h3>
    <div class="p-[8px_12px]">
      <p class="leading-normal">
        {formatDate(new Date(blog.createdAt))} — {blog.readTime}
      </p>
    </div>
  </div>
</a>
