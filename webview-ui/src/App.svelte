<script lang="ts">
  import { onMount } from "svelte";
  import { vscode, loading, projectData, globalData, config } from "./stores/vscode";
  import { manager } from "./stores/manager";
  import SidebarSummary from "./components/SidebarSummary.svelte";
  import Manager from "./pages/Manager.svelte";

  let viewType: "sidebar" | "manager" = "sidebar";

  onMount(() => {
    // Check if we're in manager view based on body data attribute
    const bodyView = document.body.getAttribute("data-view");
    if (bodyView === "manager") {
      viewType = "manager";
      manager.init();
    } else {
      vscode.init();
    }
  });
</script>

{#if viewType === "manager"}
  {#if $manager.loading}
    <div class="loading-container">
      <div>Loading...</div>
    </div>
  {:else}
    <Manager />
  {/if}
{:else if $loading}
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
    onManageRules={vscode.openManager}
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
