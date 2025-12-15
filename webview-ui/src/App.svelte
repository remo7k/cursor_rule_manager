<script lang="ts">
  import { onMount } from "svelte";
  import { manager } from "./stores/manager";
  import { preview } from "./stores/preview";
  import Manager from "./pages/Manager.svelte";
  import RulePreview from "./components/RulePreview.svelte";

  let viewType: "manager" | "preview" = "manager";

  onMount(() => {
    // Check if we're in preview view based on body data attribute
    const bodyView = document.body.getAttribute("data-view");
    if (bodyView === "preview") {
      viewType = "preview";
      preview.init();
    } else {
      manager.init();
    }
  });
</script>

{#if viewType === "preview"}
  {#if $preview.loading}
    <div class="loading-container">
      <div>Loading...</div>
    </div>
  {:else if $preview.rule}
    <RulePreview
      rule={$preview.rule}
      onOpenFile={preview.openFile}
      onRuleUpdate={preview.updateRule}
    />
  {:else}
    <div class="loading-container">
      <div>No rule selected</div>
    </div>
  {/if}
{:else if $manager.loading}
  <div class="loading-container">
    <div>Loading...</div>
  </div>
{:else}
  <Manager />
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
