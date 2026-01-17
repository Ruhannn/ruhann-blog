import { browser } from "$app/environment";
import { startCircleAnimation } from "$lib/utils/startCircleAnimation";
import { writable } from "svelte/store";

export type ThemeType = "light" | "dark";

function createThemeStore() {
  const { subscribe, set, update } = writable<ThemeType>("light");

  function getSystemTheme(): ThemeType {
    if (!browser) {
      return "light";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function getSavedTheme(): ThemeType | null {
    if (!browser) {
      return null;
    }
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    return null;
  }

  function applyTheme(theme: ThemeType, skipTransition = false) {
    if (!browser) {
      return;
    }

    if (skipTransition) {
      const css = document.createElement("style");
      css.setAttribute("data-theme-transition", "true");
      css.textContent = `*:not([data-circle-animation], [data-circle-animation] *) {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        -ms-transition: none !important;
        transition: none !important;
      }`;
      document.head.appendChild(css);

      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      }
      else {
        document.documentElement.classList.remove("dark");
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.head.removeChild(css);
        });
      });
    }
    else {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      }
      else {
        document.documentElement.classList.remove("dark");
      }
    }
  }

  function initialize() {
    if (!browser) {
      return;
    }

    const savedTheme = getSavedTheme();
    const initialTheme = savedTheme || getSystemTheme();

    applyTheme(initialTheme, true);
    set(initialTheme);
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = getSavedTheme();
      if (!savedTheme) {
        const newTheme = e.matches ? "dark" : "light";
        applyTheme(newTheme, true);
        set(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }

  function toggle(x?: number, y?: number) {
    update((current) => {
      const next = current === "light" ? "dark" : "light";
      if (browser) {
        localStorage.setItem("theme", next);
        if (x !== undefined && y !== undefined) {
          startCircleAnimation(() => applyTheme(next, true), x, y);
        }
        else {
          applyTheme(next, true);
        }
      }
      return next;
    });
  }

  return {
    subscribe,
    toggle,
    initialize,
  };
}

export const theme = createThemeStore();
