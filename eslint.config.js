import antfu from "@antfu/eslint-config";

export default antfu({
  type: "app",
  svelte: true,
  stylistic: {
    indent: 2,
    semi: true,
    quotes: "double",
  },
  formatters: {
    css: "prettier",
    html: "prettier",
    prettierOptions: {
      semi: true,
      singleQuote: false,
    },
  },
  lessOpinionated: true,
}, {
  rules: {
    "no-console": ["warn"],
    "import/no-mutable-exports":"off"
  },
});
