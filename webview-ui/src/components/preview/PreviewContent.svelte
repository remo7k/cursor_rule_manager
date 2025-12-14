<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import SvelteMarkdown from "svelte-markdown";

  export let content: string;
  export let rulePath: string;

  const dispatch = createEventDispatcher<{
    update: { content: string };
  }>();

  let mode: "edit" | "preview" = "preview";
  let editContent = content;
  let lastRulePath = "";

  // Only sync when a different rule is selected
  $: if (rulePath !== lastRulePath) {
    lastRulePath = rulePath;
    editContent = content;
  }

  function handleContentChange() {
    if (editContent !== content) {
      dispatch("update", { content: editContent });
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    // Allow Tab for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      editContent = editContent.substring(0, start) + "  " + editContent.substring(end);

      // Restore cursor position after Svelte updates the DOM
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }

    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleContentChange();
    }
  }
</script>

<div class="content-section">
  <div class="content-header">
    <h3>Content</h3>
    <div class="mode-toggle">
      <button
        class="mode-btn"
        class:mode-btn--active={mode === "preview"}
        on:click={() => {
          handleContentChange();
          mode = "preview";
        }}
      >
        Preview
      </button>
      <button
        class="mode-btn"
        class:mode-btn--active={mode === "edit"}
        on:click={() => (mode = "edit")}
      >
        Edit
      </button>
    </div>
  </div>

  <div class="content-body">
    {#if mode === "edit"}
      <textarea
        class="content-editor"
        bind:value={editContent}
        on:blur={handleContentChange}
        on:keydown={handleKeydown}
        placeholder="Write your rule content here..."
        spellcheck="false"
      ></textarea>
    {:else}
      <div class="markdown-body">
        <SvelteMarkdown source={editContent} />
      </div>
    {/if}
  </div>
</div>

<style>
  .content-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 16px 24px;
  }

  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .content-header h3 {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.4;
    margin: 0;
  }

  .mode-toggle {
    display: flex;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    padding: 2px;
  }

  .mode-btn {
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 500;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    border-radius: 3px;
    opacity: 0.5;
    transition: all 100ms ease;
  }

  .mode-btn:hover {
    opacity: 0.7;
  }

  .mode-btn--active {
    background: rgba(255, 255, 255, 0.1);
    opacity: 1;
  }

  .content-body {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Editor textarea */
  .content-editor {
    flex: 1;
    width: 100%;
    padding: 16px;
    font-size: 13px;
    font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
    line-height: 1.6;
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    color: inherit;
    resize: none;
    transition: border-color 150ms ease;
  }

  .content-editor:focus {
    outline: none;
    border-color: var(--vscode-focusBorder, #007acc);
    background: rgba(0, 0, 0, 0.2);
  }

  .content-editor::placeholder {
    opacity: 0.3;
  }

  /* Markdown preview */
  .markdown-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    font-size: 14px;
    line-height: 1.6;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }

  .markdown-body :global(h1),
  .markdown-body :global(h2),
  .markdown-body :global(h3),
  .markdown-body :global(h4) {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }

  .markdown-body :global(h1:first-child),
  .markdown-body :global(h2:first-child),
  .markdown-body :global(h3:first-child) {
    margin-top: 0;
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

  .markdown-body :global(p:first-child) {
    margin-top: 0;
  }

  .markdown-body :global(code) {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
    font-family: "SF Mono", Monaco, "Cascadia Code", Consolas, monospace;
  }

  .markdown-body :global(pre) {
    background: rgba(0, 0, 0, 0.3);
    padding: 12px 16px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1em 0;
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

  .markdown-body :global(a) {
    color: var(--vscode-textLink-foreground, #3794ff);
  }

  .markdown-body :global(strong) {
    font-weight: 600;
  }

  .markdown-body :global(hr) {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 1.5em 0;
  }
</style>
