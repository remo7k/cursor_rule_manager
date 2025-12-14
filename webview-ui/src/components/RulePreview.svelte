<script lang="ts">
  import SvelteMarkdown from "svelte-markdown";
  import type { RuleFile } from "../stores/vscode";
  import { parseFrontmatter } from "../utils/frontmatter";

  export let rule: RuleFile;
  export let onOpenFile: (path: string) => void;

  $: parsed = parseFrontmatter(rule.content);
  $: hasFrontmatter = Object.keys(parsed.frontmatter).length > 0;
</script>

<div class="preview-container">
  <div class="preview-header">
    <div class="preview-title">
      <h2>{rule.name}</h2>
      <span class="preview-path">{rule.path}</span>
    </div>
    <button class="btn btn-secondary" on:click={() => onOpenFile(rule.path)}>
      Open in Editor
    </button>
  </div>

  {#if hasFrontmatter}
    <div class="frontmatter-section">
      <h3>Metadata</h3>
      <div class="frontmatter-grid">
        {#each Object.entries(parsed.frontmatter) as [key, value]}
          {#if value !== undefined}
            <div class="frontmatter-item">
              <span class="frontmatter-key">{key}</span>
              <span class="frontmatter-value">
                {#if typeof value === "boolean"}
                  <span class="badge" class:badge-success={value} class:badge-muted={!value}>
                    {value ? "Yes" : "No"}
                  </span>
                {:else}
                  {value}
                {/if}
              </span>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <div class="preview-content">
    <h3>Content</h3>
    <div class="markdown-body">
      <SvelteMarkdown source={parsed.content} />
    </div>
  </div>
</div>

<style>
  .preview-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
  }

  .preview-title h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .preview-path {
    font-size: 11px;
    opacity: 0.5;
    font-family: monospace;
    display: block;
    margin-top: 4px;
  }

  .frontmatter-section {
    padding: 16px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.01);
  }

  .frontmatter-section h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.6;
    margin: 0 0 12px;
  }

  .frontmatter-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .frontmatter-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .frontmatter-key {
    font-size: 11px;
    opacity: 0.5;
    text-transform: capitalize;
  }

  .frontmatter-value {
    font-size: 13px;
  }

  .preview-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
  }

  .preview-content h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.6;
    margin: 0 0 16px;
  }

  .markdown-body {
    font-size: 14px;
    line-height: 1.6;
  }

  .markdown-body :global(h1),
  .markdown-body :global(h2),
  .markdown-body :global(h3),
  .markdown-body :global(h4) {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }

  .markdown-body :global(h1) {
    font-size: 1.5em;
  }

  .markdown-body :global(h2) {
    font-size: 1.3em;
  }

  .markdown-body :global(h3) {
    font-size: 1.1em;
  }

  .markdown-body :global(p) {
    margin: 0.8em 0;
  }

  .markdown-body :global(code) {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
  }

  .markdown-body :global(pre) {
    background: rgba(0, 0, 0, 0.3);
    padding: 12px 16px;
    border-radius: 4px;
    overflow-x: auto;
  }

  .markdown-body :global(pre code) {
    background: none;
    padding: 0;
  }

  .markdown-body :global(ul),
  .markdown-body :global(ol) {
    padding-left: 1.5em;
    margin: 0.8em 0;
  }

  .markdown-body :global(li) {
    margin: 0.3em 0;
  }

  .markdown-body :global(blockquote) {
    border-left: 3px solid var(--vscode-button-background, #007acc);
    padding-left: 16px;
    margin: 1em 0;
    opacity: 0.8;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 500;
  }

  .badge-success {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
  }

  .badge-muted {
    background: rgba(255, 255, 255, 0.08);
    color: var(--vscode-foreground);
    opacity: 0.7;
  }
</style>
