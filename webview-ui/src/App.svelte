<script lang="ts">
  import { vscode, loading, projectData, globalData, config } from './stores/vscode';
  import SidebarSummary from './components/SidebarSummary.svelte';
</script>

{#if $loading}
  <div class="loading-container">
    <div>Loading...</div>
  </div>
{:else}
  <SidebarSummary
    projectData={$projectData}
    globalData={$globalData}
    config={$config}
    onGenerate={vscode.generate}
    onOpenFile={vscode.openFile}
  />
{/if}

<style>
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    opacity: 0.8;
  }
</style>
