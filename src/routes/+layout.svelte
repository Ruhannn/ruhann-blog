<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import favicon from "$lib/assets/favicon.svg";
  import Header from "$lib/components/Header.svelte";
  import { onMount } from "svelte";
  import "./layout.css";

  function animate() {
    const animateElements = document.querySelectorAll(".animate");
    animateElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add("show");
      }, index * 150);
    });
  }

  onMount(() => {
    animate();
  });

  afterNavigate(() => {
    animate();
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Header
  navItems={[
    {
      name: "Home",
      link: "/",
    // icon: () => <HiHome class="w-4 h-4 text-text" />
    },
  ]}
/>

<main>
  <slot />
</main>
