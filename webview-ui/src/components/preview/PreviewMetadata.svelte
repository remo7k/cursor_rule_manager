<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let frontmatter: Record<string, unknown>;
  export let rulePath: string;

  const dispatch = createEventDispatcher<{
    update: { key: string; value: unknown };
  }>();

  // Local state for editable fields
  let description = "";
  let globs: string[] = [];
  let alwaysApply = false;
  let newGlobInput = "";

  // Track which rule we're editing to know when to sync
  let lastRulePath = "";

  // Only sync when a DIFFERENT rule is selected (not on every frontmatter update)
  $: if (rulePath !== lastRulePath) {
    lastRulePath = rulePath;
    description = (frontmatter.description as string) || "";
    globs = parseGlobs(frontmatter.globs || frontmatter.glob);
    alwaysApply = (frontmatter.alwaysApply as boolean) ?? false;
  }

  // Parse globs into array
  function parseGlobs(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string") {
      return value
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);
    }
    return [];
  }

  // Handlers
  function handleDescriptionChange() {
    dispatch("update", { key: "description", value: description });
  }

  function handleAlwaysApplyToggle() {
    alwaysApply = !alwaysApply;
    dispatch("update", { key: "alwaysApply", value: alwaysApply });
  }

  function addGlob() {
    const trimmed = newGlobInput.trim();
    if (trimmed && !globs.includes(trimmed)) {
      globs = [...globs, trimmed];
      newGlobInput = "";
      dispatch("update", { key: "globs", value: globs.join(", ") });
    }
  }

  function removeGlob(glob: string) {
    globs = globs.filter((g) => g !== glob);
    dispatch("update", { key: "globs", value: globs.join(", ") });
  }

  function handleGlobKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addGlob();
    }
  }
</script>

<div class="metadata-section">
  <h3>Metadata</h3>

  <div class="metadata-grid">
    <!-- Description -->
    <div class="metadata-row">
      <span class="metadata-label">📝 Description</span>
      <input
        type="text"
        class="metadata-input"
        placeholder="Enter a description..."
        bind:value={description}
        on:blur={handleDescriptionChange}
        on:keydown={(e) => e.key === "Enter" && handleDescriptionChange()}
      />
    </div>

    <!-- Globs -->
    <div class="metadata-row">
      <span class="metadata-label">📁 Globs</span>
      <div class="glob-container">
        {#each globs as glob}
          <span class="glob-chip">
            {glob}
            <button class="glob-remove" on:click={() => removeGlob(glob)} title="Remove">×</button>
          </span>
        {/each}
        <input
          type="text"
          class="glob-input"
          placeholder="+ Add pattern"
          bind:value={newGlobInput}
          on:keydown={handleGlobKeydown}
          on:blur={addGlob}
        />
      </div>
    </div>

    <!-- Always Apply -->
    <div class="metadata-row">
      <span class="metadata-label">⚡ Always Apply</span>
      <button
        class="toggle-switch"
        class:toggle-switch--active={alwaysApply}
        on:click={handleAlwaysApplyToggle}
        role="switch"
        aria-checked={alwaysApply}
      >
        <span class="toggle-track">
          <span class="toggle-knob"></span>
        </span>
        <span class="toggle-text">{alwaysApply ? "Yes" : "No"}</span>
      </button>
    </div>
  </div>
</div>

<style>
  .metadata-section {
    padding: 12px 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.01);
  }

  .metadata-section h3 {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.4;
    margin: 0 0 10px;
  }

  .metadata-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .metadata-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 32px;
  }

  .metadata-label {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.5;
    min-width: 100px;
    flex-shrink: 0;
  }

  /* Text input */
  .metadata-input {
    flex: 1;
    padding: 6px 10px;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    color: inherit;
    transition: border-color 150ms ease;
  }

  .metadata-input:focus {
    outline: none;
    border-color: var(--vscode-focusBorder, #007acc);
    background: rgba(0, 0, 0, 0.25);
  }

  .metadata-input::placeholder {
    opacity: 0.35;
  }

  /* Glob container - inline chips with input */
  .glob-container {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .glob-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 6px 3px 8px;
    font-size: 11px;
    font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
    background: rgba(59, 130, 246, 0.12);
    color: #93c5fd;
    border-radius: 3px;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }

  .glob-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    padding: 0;
    font-size: 12px;
    line-height: 1;
    background: transparent;
    border: none;
    border-radius: 2px;
    color: inherit;
    cursor: pointer;
    opacity: 0.5;
    transition: all 100ms ease;
  }

  .glob-remove:hover {
    opacity: 1;
    background: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .glob-input {
    min-width: 100px;
    max-width: 140px;
    padding: 4px 8px;
    font-size: 11px;
    font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
    background: transparent;
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    color: inherit;
    transition: all 150ms ease;
  }

  .glob-input:focus {
    outline: none;
    border-style: solid;
    border-color: var(--vscode-focusBorder, #007acc);
    background: rgba(0, 0, 0, 0.2);
  }

  .glob-input::placeholder {
    opacity: 0.35;
  }

  /* Toggle switch - compact */
  .toggle-switch {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .toggle-track {
    position: relative;
    width: 28px;
    height: 16px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    transition: background 150ms ease;
  }

  .toggle-switch--active .toggle-track {
    background: rgba(34, 197, 94, 0.4);
  }

  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transition: all 150ms ease;
  }

  .toggle-switch--active .toggle-knob {
    left: 14px;
    background: #4ade80;
  }

  .toggle-text {
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    opacity: 0.6;
  }

  .toggle-switch--active .toggle-text {
    color: #4ade80;
    opacity: 1;
  }
</style>



