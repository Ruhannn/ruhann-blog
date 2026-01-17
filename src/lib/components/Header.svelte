<script lang="ts">
  import ThemeToggle from "./ThemeToggle.svelte";

  interface NavItem {
    name: string;
    link: string;
  }

  export let navItems: NavItem[] = [];
</script>

<div
  class="flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-transparent dark:border-white/20 rounded-full bg-[#f9f7ff] dark:bg-[#181826] shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-5000 items-center justify-center space-x-4 px-5 py-1.5 navbar"
>
  {#each navItems as navItem}
    <a
      href={navItem.link}
      class="relative text-text items-center flex space-x-1"
    >
      <span class="block sm:hidden">
        <!--  -->
      </span>
      <span class="hidden sm:block">{navItem.name}</span>
    </a>
  {/each}
  <a
    href="https://ruhann.me"
    target="_blank"
    rel="noopener noreferrer"
    class="border font-medium relative border-neutral-200 dark:border-white/20 text-black dark:text-white px-4 py-2 rounded-full"
  >
    <span>about</span>
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <span class="absolute inset-x-0 w-1/2 h-px mx-auto -bottom-px bg-linear-to-r from-transparent via-blue-500 to-transparent" />
  </a>
  <ThemeToggle />
</div>
