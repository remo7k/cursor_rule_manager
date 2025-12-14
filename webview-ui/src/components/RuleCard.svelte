<script lang="ts">
  import type { RuleFile } from "../stores/vscode";

  export let rule: RuleFile;
  export let enabled: boolean;
  export let selected: boolean;
  export let onToggle: (ruleId: string, enabled: boolean) => void;
  export let onSelect: () => void;
  export let onDelete: () => void;

  let menuOpen = false;

  function handleToggleClick(e: Event) {
    e.stopPropagation();
    onToggle(rule.id, !enabled);
  }

  function handleMenuToggle(e: Event) {
    e.stopPropagation();
    menuOpen = !menuOpen;
  }

  function handleDeleteClick(e: Event) {
    e.stopPropagation();
    menuOpen = false;
    onDelete();
  }

  function handleClickOutside() {
    if (menuOpen) {
      menuOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<button class="rule-card" class:selected class:enabled on:click={onSelect}>
  <span class="rule-name">{rule.name}</span>

  <div class="rule-actions">
    <button
      class="toggle"
      class:active={enabled}
      on:click={handleToggleClick}
      title={enabled ? "Disable rule" : "Enable rule"}
    >
      <span class="toggle-dot"></span>
    </button>

    <div class="menu-wrapper">
      <button class="menu-btn" on:click={handleMenuToggle} title="More actions"> ⋯ </button>

      {#if menuOpen}
        <div class="menu-dropdown" on:click|stopPropagation>
          <button class="menu-item menu-item--danger" on:click={handleDeleteClick}
            >Delete Rule</button
          >
        </div>
      {/if}
    </div>
  </div>
</button>

<style>
  .rule-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 6px 10px;
    margin-bottom: 2px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    transition: all 150ms ease;
    text-align: left;
    color: inherit;
  }

  .rule-card:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .rule-card.selected {
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--vscode-focusBorder, #007acc);
  }

  .rule-card:not(.enabled) {
    opacity: 0.5;
  }

  .rule-name {
    flex: 1;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rule-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: opacity 150ms ease;
  }

  .rule-card:hover .rule-actions {
    opacity: 1;
  }

  .toggle {
    position: relative;
    width: 28px;
    height: 16px;
    border-radius: 8px;
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

  .toggle-dot {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--vscode-foreground);
    transition: transform 150ms ease;
  }

  .toggle.active .toggle-dot {
    transform: translateX(12px);
  }

  .menu-wrapper {
    position: relative;
  }

  .menu-btn {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 12px;
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
    min-width: 100px;
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
</style>
