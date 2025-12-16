import type { DocsSourceConfig } from "./types";

/**
 * Svelte 5 documentation scraper configuration
 * Source: https://github.com/sveltejs/svelte/tree/main/documentation/docs
 */
export const svelteConfig: DocsSourceConfig = {
  id: "svelte",
  name: "Svelte 5",
  owner: "sveltejs",
  repo: "svelte",
  branch: "main",
  docsPath: "documentation/docs",
  defaultGlobs: "*.svelte",
  extensions: [".md"],
  globMappings: [
    // Svelte core docs
    { pattern: "01-introduction", globs: "*.svelte" },
    { pattern: "02-runes", globs: "*.svelte, *.svelte.ts, *.svelte.js" },
    { pattern: "03-template-syntax", globs: "*.svelte" },
    { pattern: "04-styling", globs: "*.svelte, *.css" },
    { pattern: "05-special-elements", globs: "*.svelte" },
    { pattern: "06-runtime", globs: "*.svelte, *.ts, *.js" },
    { pattern: "07-misc", globs: "*.svelte" },
    // SvelteKit docs
    { pattern: "kit", globs: "**/routes/**, *.svelte" },
    { pattern: "10-getting-started", globs: "**/routes/**" },
    {
      pattern: "20-core-concepts",
      globs: "**/routes/**, +page.svelte, +layout.svelte",
    },
    {
      pattern: "25-build-and-deploy",
      globs: "svelte.config.js, svelte.config.ts",
    },
    {
      pattern: "30-advanced",
      globs: "hooks.server.ts, hooks.client.ts, +page.server.ts",
    },
    // Stores
    { pattern: "stores", globs: "*.svelte, **/stores/**" },
    // Actions
    { pattern: "actions", globs: "*.svelte, **/actions/**" },
    // Transitions
    { pattern: "transitions", globs: "*.svelte" },
    // Load functions
    {
      pattern: "load",
      globs: "+page.ts, +page.server.ts, +layout.ts, +layout.server.ts",
    },
    // Form actions
    { pattern: "form-actions", globs: "+page.server.ts" },
    // Hooks
    { pattern: "hooks", globs: "hooks.server.ts, hooks.client.ts, hooks.ts" },
  ],
};



