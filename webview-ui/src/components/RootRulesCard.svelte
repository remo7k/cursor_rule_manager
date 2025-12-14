<script lang="ts">
  import type { RuleFile } from "../stores/vscode";
  import RuleCard from "./RuleCard.svelte";

  export let rules: RuleFile[];
  export let label: string;
  export let enabledRuleIds: Set<string>;
  export let selectedRuleId: string | null;
  export let onToggleAll: (enabled: boolean) => void;
  export let onToggleRule: (ruleId: string, enabled: boolean) => void;
  export let onSelectRule: (rule: RuleFile) => void;
  export let onAddRule: () => void;
  export let onDeleteRule: (rulePath: string) => void;
  export let initialExpanded: boolean = true;

  let expanded = initialExpanded;
  let menuOpen = false;

  $: allEnabled = rules.every((r) => enabledRuleIds.has(r.id));
  $: someEnabled = rules.some((r) => enabledRuleIds.has(r.id));
  $: indeterminate = someEnabled && !allEnabled;

  function handleToggle(e: Event) {
    e.stopPropagation();
    onToggleAll(!allEnabled);
  }

  function handleMenuToggle(e: Event) {
    e.stopPropagation();
    menuOpen = !menuOpen;
  }

  function handleAdd(e: Event) {
    e.stopPropagation();
    menuOpen = false;
    onAddRule();
  }

  function handleClickOutside() {
    if (menuOpen) {
      menuOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="root-rules-card">
  <button class="folder-header" on:click={() => (expanded = !expanded)}>
    <span class="folder-chevron" class:expanded>▶</span>
    <span class="folder-name">{label} <span class="folder-count">{rules.length}</span></span>

    <div class="folder-actions">
      {#if rules.length > 0}
        <button
          class="toggle"
          class:active={allEnabled}
          class:indeterminate
          on:click={handleToggle}
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
            <button class="menu-item" on:click={handleAdd} role="menuitem">+ Add Rule</button>
          </div>
        {/if}
      </div>
    </div>
  </button>

  {#if expanded}
    <div class="folder-children">
      {#each rules as rule (rule.id)}
        <RuleCard
          {rule}
          enabled={enabledRuleIds.has(rule.id)}
          selected={selectedRuleId === rule.id}
          onToggle={onToggleRule}
          onSelect={() => onSelectRule(rule)}
          onDelete={() => onDeleteRule(rule.path)}
        />
      {/each}

      {#if rules.length === 0}
        <div class="empty-folder">Empty — add a rule</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .root-rules-card {
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
    min-width: 120px;
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
