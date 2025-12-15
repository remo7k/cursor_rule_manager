<script lang="ts">
  import { manager, enabledRuleIds } from "../stores/manager";
  import type { RuleFile } from "../stores/vscode";
  import FolderCard from "../components/FolderCard.svelte";
  import RootRulesCard from "../components/RootRulesCard.svelte";
  import DocsSection from "../components/DocsSection.svelte";

  $: projectData = $manager.projectData;
  $: globalData = $manager.globalData;
  $: docsSources = $manager.docsSources;
  $: scraping = $manager.scraping;
  $: scrapeProgress = $manager.scrapeProgress;

  // Filter out docs folders from regular rules sections (folder name matches a source ID)
  $: docsSourceIds = new Set(docsSources.map((s) => s.id.toLowerCase()));
  $: globalRuleFolders = globalData.folders.filter((f) => !docsSourceIds.has(f.name.toLowerCase()));
  $: projectRuleFolders = projectData.folders.filter(
    (f) => !docsSourceIds.has(f.name.toLowerCase())
  );

  function handleToggleRule(ruleId: string, enabled: boolean) {
    manager.toggleRule(ruleId, enabled);
  }

  function handleToggleFolder(folderId: string, enabled: boolean) {
    manager.toggleFolder(folderId, enabled);
  }

  function handleToggleRootRules(source: "project" | "global", enabled: boolean) {
    manager.toggleRootRules(source, enabled);
  }

  function handleOpenRule(rule: RuleFile) {
    // Open the preview panel with this rule
    manager.openPreview(rule);
  }

  function handleAddRule(folderPath: string) {
    manager.createRule(folderPath);
  }

  function handleAddRootRule(source: "project" | "global") {
    manager.createRootRule(source);
  }

  function handleDeleteRule(rulePath: string) {
    manager.deleteRule(rulePath);
  }

  function handleDeleteFolder(folderPath: string) {
    manager.deleteFolder(folderPath);
  }

  function handleCreateFolder(source: "project" | "global") {
    manager.createFolder(source);
  }
</script>

<div class="manager-container">
  <div class="manager-header">
    <h1>Rule Manager</h1>
    <p class="manager-subtitle">Manage your Cursor rules</p>
  </div>

  <div class="rules-list">
    <!-- Docs Section -->
    <DocsSection
      sources={docsSources}
      {scraping}
      {scrapeProgress}
      globalFolders={globalData.folders}
      projectFolders={projectData.folders}
      enabledRuleIds={$enabledRuleIds}
      selectedRuleId={null}
      onSelectRule={handleOpenRule}
      onToggleRule={handleToggleRule}
      onDeleteRule={handleDeleteRule}
      onToggleFolder={handleToggleFolder}
      onDeleteFolder={handleDeleteFolder}
      onAddRule={handleAddRule}
    />

    <!-- Global Rules -->
    <div class="rules-section">
      <div class="section-header">
        <h2 class="section-title">Global Rules</h2>
        <button
          class="section-add-btn"
          on:click={() => handleCreateFolder("global")}
          title="Create folder"
        >
          + Folder
        </button>
      </div>

      {#each globalRuleFolders as folder (folder.id)}
        <FolderCard
          {folder}
          enabledRuleIds={$enabledRuleIds}
          selectedRuleId={null}
          onToggleFolder={handleToggleFolder}
          onToggleRule={handleToggleRule}
          onSelectRule={handleOpenRule}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
          onDeleteFolder={handleDeleteFolder}
          initialExpanded={true}
        />
      {/each}

      <RootRulesCard
        rules={globalData.rootRules}
        label="Root Rules"
        enabledRuleIds={$enabledRuleIds}
        selectedRuleId={null}
        onToggleAll={(enabled) => handleToggleRootRules("global", enabled)}
        onToggleRule={handleToggleRule}
        onSelectRule={handleOpenRule}
        onAddRule={() => handleAddRootRule("global")}
        onDeleteRule={handleDeleteRule}
        initialExpanded={false}
      />
    </div>

    <!-- Project Rules -->
    <div class="rules-section">
      <div class="section-header">
        <h2 class="section-title">Project Rules</h2>
        <button
          class="section-add-btn"
          on:click={() => handleCreateFolder("project")}
          title="Create folder"
        >
          + Folder
        </button>
      </div>

      {#each projectRuleFolders as folder (folder.id)}
        <FolderCard
          {folder}
          enabledRuleIds={$enabledRuleIds}
          selectedRuleId={null}
          onToggleFolder={handleToggleFolder}
          onToggleRule={handleToggleRule}
          onSelectRule={handleOpenRule}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
          onDeleteFolder={handleDeleteFolder}
          initialExpanded={false}
        />
      {/each}

      <RootRulesCard
        rules={projectData.rootRules}
        label="Root Rules"
        enabledRuleIds={$enabledRuleIds}
        selectedRuleId={null}
        onToggleAll={(enabled) => handleToggleRootRules("project", enabled)}
        onToggleRule={handleToggleRule}
        onSelectRule={handleOpenRule}
        onAddRule={() => handleAddRootRule("project")}
        onDeleteRule={handleDeleteRule}
        initialExpanded={false}
      />
    </div>
  </div>
</div>

<style>
  .manager-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--vscode-editor-background);
    color: var(--vscode-foreground);
  }

  .manager-header {
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .manager-header h1 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .manager-subtitle {
    font-size: 11px;
    opacity: 0.6;
    margin: 4px 0 0;
  }

  .rules-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .rules-section {
    margin-bottom: 24px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

  .section-add-btn {
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
</style>
