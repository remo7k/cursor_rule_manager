<script lang="ts">
  import { manager } from "../stores/manager";
  import type { RuleFile, RuleFolder } from "../stores/vscode";
  import FolderCard from "./FolderCard.svelte";

  interface DocsSource {
    id: string;
    name: string;
    repo: string;
  }

  export let sources: DocsSource[] = [];
  export let scraping: boolean = false;
  export let scrapeProgress: { current: number; total: number; currentPage: string } | null = null;
  export let globalFolders: RuleFolder[] = [];
  export let projectFolders: RuleFolder[] = [];
  export let enabledRuleIds: Set<string> = new Set();
  export let selectedRuleId: string | null = null;
  export let onSelectRule: (rule: RuleFile) => void = () => {};
  export let onToggleRule: (ruleId: string, enabled: boolean) => void = () => {};
  export let onDeleteRule: (rulePath: string) => void = () => {};
  export let onToggleFolder: (folderId: string, enabled: boolean) => void = () => {};
  export let onDeleteFolder: (folderPath: string) => void = () => {};
  export let onAddRule: (folderPath: string) => void = () => {};

  let selectedSource: string = "";
  let selectedLocation: "global" | "project" = "project";
  let showDownloadForm = false;

  function handleScrape() {
    if (!selectedSource) return;
    manager.scrapeDocs(selectedSource, selectedLocation);
  }

  function getSelectedSourceName(): string {
    return sources.find((s) => s.id === selectedSource)?.name ?? "docs";
  }

  // Filter folders that are documentation (folder name matches a source ID)
  function getDocsFolders(folders: RuleFolder[]): RuleFolder[] {
    const sourceIds = new Set(sources.map((s) => s.id.toLowerCase()));
    return folders.filter((f) => sourceIds.has(f.name.toLowerCase()));
  }

  $: progressPercent = scrapeProgress
    ? Math.round((scrapeProgress.current / scrapeProgress.total) * 100)
    : 0;

  $: docsFolders = [...getDocsFolders(projectFolders), ...getDocsFolders(globalFolders)];

  $: hasScrapedDocs = docsFolders.length > 0;
  $: totalDocsCount = docsFolders.reduce((acc, f) => acc + f.rules.length, 0);

  // Show form when scraping OR when user opened it
  $: showPanel = showDownloadForm || scraping;
</script>

<div class="docs-section">
  <div class="section-header">
    <h2 class="section-title">Docs</h2>
    <span class="docs-count">{totalDocsCount}</span>
    {#if !scraping}
      <button
        class="section-add-btn"
        on:click={() => (showDownloadForm = !showDownloadForm)}
        title="Download documentation"
      >
        {showDownloadForm ? "Cancel" : "+ Download"}
      </button>
    {/if}
  </div>

  <!-- Download Panel (form or progress) -->
  {#if showPanel}
    <div class="download-panel" class:is-scraping={scraping}>
      {#if scraping}
        <!-- Scraping in progress -->
        <div class="scraping-status">
          <div class="status-header">
            <span class="spinner"></span>
            <span class="status-title">Downloading {getSelectedSourceName()}</span>
          </div>

          {#if scrapeProgress}
            <div class="progress-section">
              <div class="progress-bar">
                <div class="progress-fill" style="width: {progressPercent}%"></div>
              </div>
              <div class="progress-details">
                <span class="progress-count"
                  >{scrapeProgress.current} / {scrapeProgress.total} files</span
                >
                <span class="progress-percent">{progressPercent}%</span>
              </div>
              <div class="progress-current">{scrapeProgress.currentPage}</div>
            </div>
          {:else}
            <div class="progress-section">
              <div class="progress-bar">
                <div class="progress-fill progress-fill--indeterminate"></div>
              </div>
              <div class="progress-current">Fetching file list from GitHub...</div>
            </div>
          {/if}
        </div>
      {:else}
        <!-- Download form -->
        <div class="form-row">
          <select bind:value={selectedSource} class="form-select">
            <option value="">Select source...</option>
            {#each sources as source (source.id)}
              <option value={source.id}>{source.name}</option>
            {/each}
          </select>
          <select bind:value={selectedLocation} class="form-select form-select--small">
            <option value="project">Project</option>
            <option value="global">Global</option>
          </select>
          <button class="download-btn" on:click={handleScrape} disabled={!selectedSource}>
            ↓
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Docs Folders -->
  {#if hasScrapedDocs}
    {#each docsFolders as folder (folder.id)}
      <FolderCard
        {folder}
        {enabledRuleIds}
        {selectedRuleId}
        {onToggleFolder}
        {onToggleRule}
        {onSelectRule}
        {onAddRule}
        {onDeleteRule}
        {onDeleteFolder}
        initialExpanded={false}
      />
    {/each}
  {:else if !showDownloadForm}
    <div class="empty-state">
      <p>No documentation downloaded yet.</p>
      <button class="empty-btn" on:click={() => (showDownloadForm = true)}>
        Download Documentation
      </button>
    </div>
  {/if}
</div>

<style>
  .docs-section {
    margin-bottom: 24px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding: 0 4px;
  }

  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.5;
    margin: 0;
  }

  .docs-count {
    font-size: 10px;
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    opacity: 0.6;
  }

  .section-add-btn {
    margin-left: auto;
    font-size: 10px;
    padding: 3px 8px;
    background: rgba(255, 255, 255, 0.06);
    border: none;
    border-radius: 3px;
    color: inherit;
    cursor: pointer;
    opacity: 0.6;
    transition: all 150ms ease;
  }

  .section-add-btn:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  /* Download Panel */
  .download-panel {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 8px;
  }

  .download-panel.is-scraping {
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.2);
  }

  .form-row {
    display: flex;
    gap: 6px;
  }

  .form-select {
    flex: 1;
    padding: 6px 8px;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border, rgba(255, 255, 255, 0.1));
    border-radius: 4px;
    color: var(--vscode-input-foreground);
    font-size: 11px;
    cursor: pointer;
  }

  .form-select--small {
    flex: 0 0 70px;
  }

  .form-select:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }

  .download-btn {
    padding: 6px 10px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background 150ms ease;
  }

  .download-btn:hover:not(:disabled) {
    background: var(--vscode-button-hoverBackground);
  }

  .download-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Scraping Status */
  .scraping-status {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .status-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(59, 130, 246, 0.3);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .status-title {
    font-size: 12px;
    font-weight: 500;
    color: #60a5fa;
  }

  .progress-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .progress-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    border-radius: 3px;
    transition: width 200ms ease;
  }

  .progress-fill--indeterminate {
    width: 30%;
    animation: indeterminate 1.5s ease-in-out infinite;
  }

  @keyframes indeterminate {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }

  .progress-details {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
  }

  .progress-count {
    opacity: 0.7;
  }

  .progress-percent {
    font-weight: 600;
    color: #60a5fa;
  }

  .progress-current {
    font-size: 10px;
    opacity: 0.5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 20px;
    opacity: 0.6;
  }

  .empty-state p {
    margin: 0 0 12px;
    font-size: 12px;
  }

  .empty-btn {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.08);
    border: none;
    border-radius: 4px;
    color: inherit;
    font-size: 11px;
    cursor: pointer;
    transition: background 150ms ease;
  }

  .empty-btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }
</style>
