<script lang="ts">
  export let name: string;
  export let path: string;
  export let onOpenFile: (path: string) => void;
</script>

<div class="preview-header">
  <div class="preview-title">
    <h2>{name}</h2>
    <span class="preview-path">{path}</span>
  </div>
  <button class="btn btn-secondary" on:click={() => onOpenFile(path)}> Open in Editor </button>
</div>

<style>
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
</style>
