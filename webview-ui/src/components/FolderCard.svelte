<script lang="ts">
  import type { RuleFolder, RuleFile } from "../stores/vscode";
  import RuleCard from "./RuleCard.svelte";

  export let folder: RuleFolder;
  export let enabledRuleIds: Set<string>;
  export let selectedRuleId: string | null;
  export let onToggleFolder: (folderId: string, enabled: boolean) => void;
  export let onToggleRule: (ruleId: string, enabled: boolean) => void;
  export let onSelectRule: (rule: RuleFile) => void;
  export let onAddRule: (folderPath: string) => void;
  export let onDeleteRule: (rulePath: string) => void;
  export let onDeleteFolder: (folderPath: string) => void;
  export let initialExpanded: boolean = true;

  let expanded = initialExpanded;
  let menuOpen = false;

  $: allEnabled = folder.rules.every((r) => enabledRuleIds.has(r.id));
  $: someEnabled = folder.rules.some((r) => enabledRuleIds.has(r.id));
  $: indeterminate = someEnabled && !allEnabled;

  function handleFolderToggle(e: Event) {
    e.stopPropagation();
    onToggleFolder(folder.id, !allEnabled);
  }

  function handleMenuToggle(e: Event) {
    e.stopPropagation();
    menuOpen = !menuOpen;
  }

  function handleAddRule(e: Event) {
    e.stopPropagation();
    menuOpen = false;
    onAddRule(folder.path);
  }

  function handleDeleteFolder(e: Event) {
    e.stopPropagation();
    menuOpen = false;
    onDeleteFolder(folder.path);
  }

  function handleClickOutside(e: MouseEvent) {
    if (menuOpen) {
      menuOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="folder-card">
  <button class="folder-header" on:click={() => (expanded = !expanded)}>
    <span class="folder-chevron" class:expanded>▶</span>
    <span class="folder-name"
      >{folder.name} <span class="folder-count">{folder.rules.length}</span></span
    >

    <div class="folder-actions">
      {#if folder.rules.length > 0}
        <button
          class="toggle"
          class:active={allEnabled}
          class:indeterminate
          on:click={handleFolderToggle}
          title={allEnabled ? "Disable all" : "Enable all"}
        >
          <span class="toggle-dot"></span>
        </button>
      {/if}

      <div class="menu-wrapper">
        <button class="menu-btn" on:click={handleMenuToggle} title="More actions"> ⋯ </button>

        {#if menuOpen}
          <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
          <div class="menu-dropdown" on:click|stopPropagation role="menu" tabindex="-1">
            <button class="menu-item" on:click={handleAddRule} role="menuitem">+ Add Rule</button>
            <button
              class="menu-item menu-item--danger"
              on:click={handleDeleteFolder}
              role="menuitem">Delete Folder</button
            >
          </div>
        {/if}
      </div>
    </div>
  </button>

  {#if expanded}
    <div class="folder-children">
      {#each folder.rules as rule (rule.id)}
        <RuleCard
          {rule}
          enabled={enabledRuleIds.has(rule.id)}
          selected={selectedRuleId === rule.id}
          onToggle={onToggleRule}
          onSelect={() => onSelectRule(rule)}
          onDelete={() => onDeleteRule(rule.path)}
        />
      {/each}

      {#if folder.rules.length === 0}
        <div class="empty-folder">Empty — add a rule</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .folder-card {
    margin-bottom: 4px;
  }

  .folder-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    cursor: pointer;
    transition: all 150ms ease;
    text-align: left;
    color: inherit;
  }

  .folder-header:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .folder-chevron {
    font-size: 10px;
    opacity: 0.6;
    transition: transform 150ms ease;
  }

  .folder-chevron.expanded {
    transform: rotate(90deg);
  }

  .folder-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .folder-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 10px;
    font-weight: 500;
    opacity: 0.6;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 9px;
    margin-left: 6px;
  }

  .folder-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0;
    transition: opacity 150ms ease;
  }

  .folder-header:hover .folder-actions {
    opacity: 1;
  }

  .toggle {
    position: relative;
    width: 32px;
    height: 18px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    cursor: pointer;
    transition: background-color 150ms ease;
    flex-shrink: 0;
  }

  .toggle:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .toggle.active {
    background: var(--vscode-button-background, #007acc);
  }

  .toggle.indeterminate {
    background: var(--vscode-button-background, #007acc);
    opacity: 0.6;
  }

  .toggle-dot {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--vscode-foreground);
    transition: transform 150ms ease;
  }

  .toggle.active .toggle-dot,
  .toggle.indeterminate .toggle-dot {
    transform: translateX(14px);
  }

  .menu-wrapper {
    position: relative;
  }

  .menu-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    color: inherit;
    opacity: 0.5;
    transition: all 150ms ease;
  }

  .menu-btn:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  .menu-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    min-width: 130px;
    background: var(--vscode-editor-background, #1e1e1e);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 100;
    overflow: hidden;
  }

  .menu-item {
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: inherit;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    transition: background-color 150ms ease;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .menu-item--danger:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }

  .folder-children {
    padding-left: 20px;
    margin-top: 4px;
  }

  .empty-folder {
    padding: 12px;
    font-size: 12px;
    opacity: 0.5;
    text-align: center;
  }
</style>



