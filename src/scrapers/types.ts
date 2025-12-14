/**
 * Configuration types for documentation scrapers
 */

export interface GlobMapping {
  /** File pattern to match (e.g., "01-" for files starting with 01-) */
  pattern: string;
  /** Glob patterns for when this rule should apply */
  globs: string;
}

export interface DocsSourceConfig {
  /** Unique identifier (e.g., "svelte", "react") */
  id: string;
  /** Display name (e.g., "Svelte 5") */
  name: string;
  /** GitHub owner (e.g., "sveltejs") */
  owner: string;
  /** GitHub repo (e.g., "svelte") */
  repo: string;
  /** Branch name (e.g., "main") */
  branch: string;
  /** Path to docs directory in the repo (e.g., "documentation/docs") */
  docsPath: string;
  /** Default glob pattern for rules */
  defaultGlobs: string;
  /** Optional mapping of file patterns to specific globs */
  globMappings?: GlobMapping[];
  /** File extensions to include (e.g., [".md"]) */
  extensions: string[];
}

export interface ScrapeResult {
  success: boolean;
  outputName: string;
  outputPath?: string;
  error?: string;
}

export interface ScrapeProgress {
  current: number;
  total: number;
  currentPage: string;
}

export type StorageLocation = "global" | "project";
