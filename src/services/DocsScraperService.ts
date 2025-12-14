import * as vscode from "vscode";
import * as https from "https";
import * as os from "os";
import * as path from "path";
import type {
  DocsSourceConfig,
  ScrapeResult,
  ScrapeProgress,
  StorageLocation,
} from "../scrapers/types";
import { svelteConfig } from "../scrapers/svelte";
import { reactConfig } from "../scrapers/react";
import { nextjsConfig } from "../scrapers/nextjs";
import { typescriptConfig } from "../scrapers/typescript";

interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
}

export class DocsScraperService {
  private sources: Map<string, DocsSourceConfig>;

  constructor() {
    // Register available sources
    this.sources = new Map();
    this.sources.set(svelteConfig.id, svelteConfig);
    this.sources.set(reactConfig.id, reactConfig);
    this.sources.set(nextjsConfig.id, nextjsConfig);
    this.sources.set(typescriptConfig.id, typescriptConfig);
  }

  /**
   * Check if user is logged in to GitHub
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const session = await vscode.authentication.getSession("github", [], {
        createIfNone: false,
      });
      return !!session;
    } catch {
      return false;
    }
  }

  /**
   * Login to GitHub via VS Code's OAuth flow
   */
  async login(): Promise<boolean> {
    try {
      const session = await vscode.authentication.getSession("github", [], {
        createIfNone: true,
      });
      return !!session;
    } catch {
      return false;
    }
  }

  /**
   * Get GitHub token from VS Code's authentication
   */
  private async getGitHubToken(): Promise<string | undefined> {
    try {
      const session = await vscode.authentication.getSession("github", [], {
        createIfNone: false,
      });
      return session?.accessToken;
    } catch {
      return undefined;
    }
  }

  /**
   * Get all available documentation sources
   */
  getAvailableSources(): DocsSourceConfig[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get a specific source by ID
   */
  getSource(id: string): DocsSourceConfig | undefined {
    return this.sources.get(id);
  }

  /**
   * Parse a GitHub URL to extract owner, repo, branch, and path
   * Supports: https://github.com/owner/repo/tree/branch/path/to/docs
   */
  parseGitHubUrl(url: string): {
    owner: string;
    repo: string;
    branch: string;
    path: string;
  } | null {
    // Match: github.com/owner/repo/tree/branch/path...
    const match = url.match(
      /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/(.+)/,
    );
    if (!match) {
      return null;
    }
    return {
      owner: match[1],
      repo: match[2],
      branch: match[3],
      path: match[4].replace(/\/$/, ""), // Remove trailing slash
    };
  }

  /**
   * Scrape docs from a custom GitHub URL
   */
  async scrapeCustomUrl(
    url: string,
    name: string,
    location: StorageLocation,
    workspaceUri?: vscode.Uri,
    onProgress?: (progress: ScrapeProgress) => void,
  ): Promise<ScrapeResult[]> {
    const parsed = this.parseGitHubUrl(url);
    if (!parsed) {
      throw new Error(
        "Invalid GitHub URL. Expected format: https://github.com/owner/repo/tree/branch/path",
      );
    }

    // Create a temporary source config for this custom URL
    const customSource: DocsSourceConfig = {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      owner: parsed.owner,
      repo: parsed.repo,
      branch: parsed.branch,
      docsPath: parsed.path,
      defaultGlobs: "**/*",
      extensions: [".md", ".mdx"],
    };

    const results: ScrapeResult[] = [];
    const outputDir = this.getOutputDir(
      location,
      customSource.id,
      workspaceUri,
    );

    // Ensure output directory exists
    await vscode.workspace.fs.createDirectory(outputDir);

    // Fetch list of files from GitHub API
    const files = await this.listGitHubFilesCustom(customSource);
    const mdFiles = files.filter((f) =>
      customSource.extensions.some((ext) => f.name.endsWith(ext)),
    );

    if (mdFiles.length === 0) {
      throw new Error("No markdown files found at the specified URL");
    }

    // Process files in parallel batches
    const BATCH_SIZE = 10;
    let completed = 0;

    for (let i = 0; i < mdFiles.length; i += BATCH_SIZE) {
      const batch = mdFiles.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (file) => {
        const outputName = this.filePathToOutputNameCustom(
          file.path,
          customSource,
        );
        try {
          const result = await this.scrapeFileCustom(
            customSource,
            file,
            outputDir,
          );
          return result;
        } catch (error) {
          return {
            success: false,
            outputName,
            error: error instanceof Error ? error.message : String(error),
          } as ScrapeResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      completed += batch.length;
      onProgress?.({
        current: completed,
        total: mdFiles.length,
        currentPage: `Batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(mdFiles.length / BATCH_SIZE)}`,
      });

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < mdFiles.length) {
        await this.delay(200);
      }
    }

    return results;
  }

  /**
   * List files for custom source
   */
  private async listGitHubFilesCustom(
    source: DocsSourceConfig,
  ): Promise<GitHubFile[]> {
    const files: GitHubFile[] = [];
    await this.fetchDirectoryContentsCustom(
      source.owner,
      source.repo,
      source.branch,
      source.docsPath,
      files,
    );
    return files;
  }

  /**
   * Recursively fetch directory contents for custom source
   */
  private async fetchDirectoryContentsCustom(
    owner: string,
    repo: string,
    branch: string,
    dirPath: string,
    files: GitHubFile[],
  ): Promise<void> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}?ref=${branch}`;
    const response = await this.fetchJson<GitHubFile[]>(url);

    for (const item of response) {
      if (item.type === "file") {
        files.push(item);
      } else if (item.type === "dir") {
        await this.fetchDirectoryContentsCustom(
          owner,
          repo,
          branch,
          item.path,
          files,
        );
        await this.delay(50);
      }
    }
  }

  /**
   * Scrape a single file for custom source
   */
  private async scrapeFileCustom(
    source: DocsSourceConfig,
    file: GitHubFile,
    outputDir: vscode.Uri,
  ): Promise<ScrapeResult> {
    const outputName = this.filePathToOutputNameCustom(file.path, source);

    // Fetch raw content
    const rawUrl = `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.branch}/${file.path}`;
    const markdown = await this.fetchText(rawUrl);

    // Generate description from filename
    const description = this.generateDescriptionCustom(file.name, source.name);

    // Generate MDC with frontmatter (use default globs for custom sources)
    const mdc = this.generateMdc(
      description,
      source.defaultGlobs,
      markdown,
      rawUrl,
    );

    // Write file
    const filePath = vscode.Uri.joinPath(outputDir, `${outputName}.mdc`);
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(mdc, "utf-8"));

    return {
      success: true,
      outputName,
      outputPath: filePath.fsPath,
    };
  }

  /**
   * Convert file path to output name for custom source
   */
  private filePathToOutputNameCustom(
    filePath: string,
    source: DocsSourceConfig,
  ): string {
    // Remove the docs path prefix
    let relativePath = filePath.replace(source.docsPath + "/", "");

    // Remove .md/.mdx extension
    relativePath = relativePath.replace(/\.mdx?$/, "");

    // Remove numeric prefixes like "01-", "02-"
    relativePath = relativePath.replace(/\d+-/g, "");

    // Replace slashes with dashes
    relativePath = relativePath.replace(/\//g, "-");

    // Add source prefix
    return `${source.id}-${relativePath}`.toLowerCase();
  }

  /**
   * Generate description for custom source
   */
  private generateDescriptionCustom(
    filename: string,
    sourceName: string,
  ): string {
    // Remove extension
    let name = filename.replace(/\.mdx?$/, "");

    // Remove numeric prefix
    name = name.replace(/^\d+-/, "");

    // Convert dashes to spaces and capitalize
    name = name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return `${sourceName} - ${name}`;
  }

  /**
   * Scrape all docs from a GitHub repository
   */
  async scrapeSource(
    sourceId: string,
    location: StorageLocation,
    workspaceUri?: vscode.Uri,
    onProgress?: (progress: ScrapeProgress) => void,
  ): Promise<ScrapeResult[]> {
    const source = this.sources.get(sourceId);
    if (!source) {
      throw new Error(`Unknown documentation source: ${sourceId}`);
    }

    const results: ScrapeResult[] = [];
    const outputDir = this.getOutputDir(location, source.id, workspaceUri);

    // Ensure output directory exists
    await vscode.workspace.fs.createDirectory(outputDir);

    // Fetch list of files from GitHub API
    const files = await this.listGitHubFiles(source);
    const mdFiles = files.filter((f) =>
      source.extensions.some((ext) => f.name.endsWith(ext)),
    );

    // Process files in parallel batches
    const BATCH_SIZE = 10;
    let completed = 0;

    for (let i = 0; i < mdFiles.length; i += BATCH_SIZE) {
      const batch = mdFiles.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (file) => {
        const outputName = this.filePathToOutputName(file.path, source);
        try {
          const result = await this.scrapeFile(source, file, outputDir);
          return result;
        } catch (error) {
          return {
            success: false,
            outputName,
            error: error instanceof Error ? error.message : String(error),
          } as ScrapeResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      completed += batch.length;
      onProgress?.({
        current: completed,
        total: mdFiles.length,
        currentPage: `Batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(mdFiles.length / BATCH_SIZE)}`,
      });

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < mdFiles.length) {
        await this.delay(200);
      }
    }

    return results;
  }

  /**
   * List all files in the docs directory using GitHub API
   */
  private async listGitHubFiles(
    source: DocsSourceConfig,
  ): Promise<GitHubFile[]> {
    const files: GitHubFile[] = [];
    await this.fetchDirectoryContents(source, source.docsPath, files);
    return files;
  }

  /**
   * Recursively fetch directory contents from GitHub
   */
  private async fetchDirectoryContents(
    source: DocsSourceConfig,
    dirPath: string,
    files: GitHubFile[],
  ): Promise<void> {
    const url = `https://api.github.com/repos/${source.owner}/${source.repo}/contents/${dirPath}?ref=${source.branch}`;
    const response = await this.fetchJson<GitHubFile[]>(url);

    for (const item of response) {
      if (item.type === "file") {
        files.push(item);
      } else if (item.type === "dir") {
        await this.fetchDirectoryContents(source, item.path, files);
        // Small delay between directory requests
        await this.delay(50);
      }
    }
  }

  /**
   * Scrape a single markdown file from GitHub
   */
  private async scrapeFile(
    source: DocsSourceConfig,
    file: GitHubFile,
    outputDir: vscode.Uri,
  ): Promise<ScrapeResult> {
    const outputName = this.filePathToOutputName(file.path, source);

    // Fetch raw content
    const rawUrl = `https://raw.githubusercontent.com/${source.owner}/${source.repo}/${source.branch}/${file.path}`;
    const markdown = await this.fetchText(rawUrl);

    // Determine globs based on file path
    const globs = this.getGlobsForFile(file.path, source);

    // Generate description from filename
    const description = this.generateDescription(file.name, source);

    // Generate MDC with frontmatter
    const mdc = this.generateMdc(description, globs, markdown, rawUrl);

    // Write file
    const filePath = vscode.Uri.joinPath(outputDir, `${outputName}.mdc`);
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(mdc, "utf-8"));

    return {
      success: true,
      outputName,
      outputPath: filePath.fsPath,
    };
  }

  /**
   * Convert file path to output name
   * e.g., "documentation/docs/02-runes/01-state.md" -> "svelte-runes-state"
   */
  private filePathToOutputName(
    filePath: string,
    source: DocsSourceConfig,
  ): string {
    // Remove the docs path prefix
    let relativePath = filePath.replace(source.docsPath + "/", "");

    // Remove .md extension
    relativePath = relativePath.replace(/\.md$/, "");

    // Remove numeric prefixes like "01-", "02-"
    relativePath = relativePath.replace(/\d+-/g, "");

    // Replace slashes with dashes
    relativePath = relativePath.replace(/\//g, "-");

    // Add source prefix
    return `${source.id}-${relativePath}`.toLowerCase();
  }

  /**
   * Get glob patterns for a file based on config mappings
   */
  private getGlobsForFile(filePath: string, source: DocsSourceConfig): string {
    if (source.globMappings) {
      for (const mapping of source.globMappings) {
        if (filePath.toLowerCase().includes(mapping.pattern.toLowerCase())) {
          return mapping.globs;
        }
      }
    }
    return source.defaultGlobs;
  }

  /**
   * Generate a human-readable description from filename
   */
  private generateDescription(
    filename: string,
    source: DocsSourceConfig,
  ): string {
    // Remove extension
    let name = filename.replace(/\.md$/, "");

    // Remove numeric prefix
    name = name.replace(/^\d+-/, "");

    // Convert dashes to spaces and capitalize
    name = name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return `${source.name} - ${name}`;
  }

  /**
   * Generate MDC file content with frontmatter
   */
  private generateMdc(
    description: string,
    globs: string,
    markdown: string,
    sourceUrl: string,
  ): string {
    const frontmatter = [
      "---",
      `description: ${description}`,
      `globs: ${globs}`,
      `alwaysApply: false`,
      "---",
    ].join("\n");

    const header = `> Source: ${sourceUrl}\n`;

    return `${frontmatter}\n\n${header}\n${markdown}`;
  }

  /**
   * Fetch JSON from a URL
   */
  private async fetchJson<T>(url: string): Promise<T> {
    const token = await this.getGitHubToken();

    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {
        "User-Agent": "cursor-rule-manager",
        Accept: "application/vnd.github.v3+json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const request = https.get(url, { headers }, (response) => {
        if (response.statusCode === 403) {
          reject(
            new Error(
              "GitHub API rate limit exceeded. Please login to GitHub for higher limits.",
            ),
          );
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }

        let data = "";
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => {
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error("Failed to parse JSON response"));
          }
        });
        response.on("error", reject);
      });

      request.on("error", reject);
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error(`Timeout fetching ${url}`));
      });
    });
  }

  /**
   * Fetch text content from a URL
   */
  private async fetchText(url: string): Promise<string> {
    const token = await this.getGitHubToken();

    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {
        "User-Agent": "cursor-rule-manager",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const request = https.get(url, { headers }, (response) => {
        // Handle redirects
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          this.fetchText(response.headers.location).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode} for ${url}`));
          return;
        }

        let data = "";
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => resolve(data));
        response.on("error", reject);
      });

      request.on("error", reject);
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error(`Timeout fetching ${url}`));
      });
    });
  }

  /**
   * Get the output directory for scraped docs
   */
  private getOutputDir(
    location: StorageLocation,
    sourceId: string,
    workspaceUri?: vscode.Uri,
  ): vscode.Uri {
    if (location === "global") {
      const homeDir = os.homedir();
      return vscode.Uri.file(path.join(homeDir, ".cursor", "rules", sourceId));
    } else {
      if (!workspaceUri) {
        throw new Error("Workspace URI required for project storage");
      }
      return vscode.Uri.joinPath(workspaceUri, ".cursor", "rules", sourceId);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
