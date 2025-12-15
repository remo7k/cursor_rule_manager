import type { DocsSourceConfig } from "./types";

/**
 * TypeScript documentation scraper configuration
 * Source: https://github.com/microsoft/TypeScript-Website
 */
export const typescriptConfig: DocsSourceConfig = {
  id: "typescript",
  name: "TypeScript",
  owner: "microsoft",
  repo: "TypeScript-Website",
  branch: "v2",
  docsPath: "packages/documentation/copy/en/handbook-v2",
  defaultGlobs: "*.ts, *.tsx",
  extensions: [".md"],
  globMappings: [
    // Basics
    { pattern: "Basics", globs: "*.ts, *.tsx" },
    { pattern: "Everyday", globs: "*.ts, *.tsx" },
    // Types
    { pattern: "Type", globs: "*.ts, *.tsx" },
    { pattern: "Narrowing", globs: "*.ts, *.tsx" },
    { pattern: "Object", globs: "*.ts, *.tsx" },
    { pattern: "Functions", globs: "*.ts, *.tsx" },
    // Classes
    { pattern: "Classes", globs: "*.ts, *.tsx" },
    // Modules
    { pattern: "Modules", globs: "*.ts, *.tsx" },
    // Generics
    { pattern: "Generics", globs: "*.ts, *.tsx" },
    // Utility types
    { pattern: "Utility", globs: "*.ts, *.tsx" },
    // Decorators
    { pattern: "Decorators", globs: "*.ts, *.tsx" },
    // Declaration files
    { pattern: "Declaration", globs: "*.d.ts" },
    // JSX
    { pattern: "JSX", globs: "*.tsx, *.jsx" },
  ],
};

