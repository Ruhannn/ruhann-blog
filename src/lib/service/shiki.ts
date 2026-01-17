// src/lib/utils/shiki.ts
import type { HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki";
import { createHighlighterCore } from "shiki/core";
import bash from "shiki/langs/bash.mjs";
import css from "shiki/langs/css.mjs";
import html from "shiki/langs/html.mjs";
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import jsx from "shiki/langs/jsx.mjs";
import markdown from "shiki/langs/markdown.mjs";
import python from "shiki/langs/python.mjs";
import sass from "shiki/langs/sass.mjs";
import tsx from "shiki/langs/tsx.mjs";
import typescript from "shiki/langs/typescript.mjs";
import catppuccinLatte from "shiki/themes/catppuccin-latte.mjs";
import catppuccinMocha from "shiki/themes/catppuccin-mocha.mjs";

let highlighter: HighlighterCore | null = null;

export async function getHighlighter(): Promise<HighlighterCore> {
  if (highlighter) {
    return highlighter;
  }

  highlighter = await createHighlighterCore({
    themes: [catppuccinLatte, catppuccinMocha],
    langs: [
      bash,
      css,
      html,
      javascript,
      json,
      markdown,
      sass,
      typescript,
      tsx,
      jsx,
      python,
    ],
    engine: createJavaScriptRegexEngine(),
  });

  return highlighter;
}
