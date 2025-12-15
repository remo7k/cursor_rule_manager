import type { DocsSourceConfig } from "./types";

/**
 * Next.js documentation scraper configuration
 * Source: https://github.com/vercel/next.js
 */
export const nextjsConfig: DocsSourceConfig = {
  id: "nextjs",
  name: "Next.js",
  owner: "vercel",
  repo: "next.js",
  branch: "canary",
  docsPath: "docs",
  defaultGlobs: "*.jsx, *.tsx, *.js, *.ts",
  extensions: [".mdx"],
  globMappings: [
    // App Router
    { pattern: "app", globs: "**/app/**, *.tsx, *.jsx" },
    { pattern: "routing", globs: "**/app/**" },
    { pattern: "pages", globs: "**/pages/**" },
    // Data fetching
    { pattern: "data-fetching", globs: "*.tsx, *.jsx, *.ts, *.js" },
    { pattern: "caching", globs: "*.tsx, *.ts" },
    // Rendering
    { pattern: "rendering", globs: "*.tsx, *.jsx" },
    // API routes
    { pattern: "api-routes", globs: "**/api/**, route.ts, route.js" },
    { pattern: "route-handlers", globs: "route.ts, route.js" },
    // Styling
    { pattern: "styling", globs: "*.tsx, *.jsx, *.css, *.scss" },
    // Configuration
    {
      pattern: "configuring",
      globs: "next.config.js, next.config.ts, next.config.mjs",
    },
    // Middleware
    { pattern: "middleware", globs: "middleware.ts, middleware.js" },
    // Server Actions
    { pattern: "server-actions", globs: "*.tsx, *.ts" },
    { pattern: "forms", globs: "*.tsx, *.jsx" },
    // Deployment
    { pattern: "deploying", globs: "next.config.js, next.config.ts" },
    // Optimization
    { pattern: "optimizing", globs: "*.tsx, *.jsx, *.ts, *.js" },
  ],
};

