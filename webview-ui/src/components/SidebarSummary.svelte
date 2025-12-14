<script lang="ts">
  import type { RulesData, Config } from "../stores/vscode";

  export let projectData: RulesData;
  export let globalData: RulesData;
  export let config: Config;
  export let onGenerate: () => void;
  export let onOpenFile: (path: string) => void;

  $: projectFolders = projectData.folders.length;
  $: globalFolders = globalData.folders.length;

  $: projectRules =
    projectData.rootRules.length + projectData.folders.reduce((acc, f) => acc + f.rules.length, 0);

  $: globalRules =
    globalData.rootRules.length + globalData.folders.reduce((acc, f) => acc + f.rules.length, 0);

  $: enabledCount = config.enabledRules.length;
  $: totalRules = projectRules + globalRules;

  // Get recent rules
  $: recentRules = (() => {
    const rules: Array<{
      id: string;
      name: string;
      folder: string;
      path: string;
    }> = [];

    for (const folder of projectData.folders) {
      for (const rule of folder.rules) {
        rules.push({
          id: rule.id,
          name: rule.name,
          folder: folder.name,
          path: rule.path,
        });
      }
    }

    for (const rule of projectData.rootRules) {
      rules.push({
        id: rule.id,
        name: rule.name,
        folder: "Root",
        path: rule.path,
      });
    }

    return rules;
  })();

  $: displayRules = recentRules.slice(-5).reverse();
</script>

<div class="p-3">
  <!-- Stats -->
  <div class="stats-grid">
    <div class="stat-box stat-box--large">
      <div class="stat-value">{totalRules}</div>
      <div class="stat-label">Total Rules</div>
    </div>

    <div class="stat-box">
      <div class="stat-value stat-value--small">{projectRules}</div>
      <div class="stat-label">Project</div>
    </div>

    <div class="stat-box">
      <div class="stat-value stat-value--small">{globalRules}</div>
      <div class="stat-label">Global</div>
    </div>

    <div class="stat-box">
      <div class="stat-value stat-value--small">{projectFolders + globalFolders}</div>
      <div class="stat-label">Folders</div>
    </div>

    <div class="stat-box">
      <div class="stat-value stat-value--small text-success">{enabledCount}</div>
      <div class="stat-label">Enabled</div>
    </div>
  </div>

  <!-- Actions -->
  <div class="actions">
    <button class="btn" on:click={onGenerate}> Generate .cursorrules </button>
  </div>

  <!-- Recent Rules -->
  {#if displayRules.length > 0}
    <div class="recent-list">
      <div class="recent-header">Recent Rules</div>
      {#each displayRules as rule (rule.id)}
        <button class="recent-item" on:click={() => onOpenFile(rule.path)}>
          <span class="recent-name">{rule.name}</span>
          <span class="recent-folder">{rule.folder}</span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Status -->
  {#if projectData.cursorrules}
    <div class="status-bar">
      <span>
        <span class="status-icon">✓</span>
        .cursorrules exists
      </span>
      <button class="rule-action" on:click={() => onOpenFile(projectData.cursorrules?.path ?? "")}>
        View
      </button>
    </div>
  {/if}
</div>

<style>
  .actions {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .actions .btn {
    width: 100%;
  }
</style>
