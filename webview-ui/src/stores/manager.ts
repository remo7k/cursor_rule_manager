import { writable, derived } from "svelte/store";
import { vscodeApi } from "../utils/vscodeApi";
import type { RulesData, RuleFile, Config } from "./vscode";

export interface ManagerState {
  projectData: RulesData;
  globalData: RulesData;
  config: Config;
  selectedRule: RuleFile | null;
  loading: boolean;
}

const emptyRulesData: RulesData = {
  folders: [],
  rootRules: [],
  rootOtherFiles: [],
};

function createManagerStore() {
  const { subscribe, set, update } = writable<ManagerState>({
    projectData: emptyRulesData,
    globalData: emptyRulesData,
    config: { enabledDocs: [], enabledRules: [] },
    selectedRule: null,
    loading: true,
  });

  function init() {
    vscodeApi.postMessage({ type: "getInitialData" });

    window.addEventListener("message", (event) => {
      const message = event.data;

      switch (message.type) {
        case "init":
          update((state) => ({
            ...state,
            ...message.data,
            loading: false,
          }));
          break;
        case "configUpdated":
          update((state) => ({
            ...state,
            config: message.config,
          }));
          break;
        case "dataUpdated":
          update((state) => ({
            ...state,
            projectData: message.data.projectData,
            globalData: message.data.globalData,
            config: message.data.config,
          }));
          break;
        case "ruleCreated":
          // Refresh data and open the new file
          vscodeApi.postMessage({ type: "getInitialData" });
          break;
        case "error":
          console.error("Extension error:", message.message);
          update((state) => ({ ...state, loading: false }));
          break;
      }
    });
  }

  function selectRule(rule: RuleFile | null) {
    update((state) => ({ ...state, selectedRule: rule }));
  }

  function toggleRule(ruleId: string, enabled: boolean) {
    vscodeApi.postMessage({ type: "toggleRule", ruleId, enabled });
  }

  function toggleFolder(folderId: string, enabled: boolean) {
    vscodeApi.postMessage({ type: "toggleFolder", folderId, enabled });
  }

  function toggleRootRules(source: "project" | "global", enabled: boolean) {
    vscodeApi.postMessage({ type: "toggleRootRules", source, enabled });
  }

  function openFile(path: string) {
    vscodeApi.postMessage({ type: "openFile", path });
  }

  function createRule(folderPath: string) {
    vscodeApi.postMessage({ type: "createRule", folderPath });
  }

  function createRootRule(source: "project" | "global") {
    vscodeApi.postMessage({ type: "createRootRule", source });
  }

  function deleteRule(rulePath: string) {
    vscodeApi.postMessage({ type: "deleteRule", rulePath });
  }

  function createFolder(source: "project" | "global") {
    vscodeApi.postMessage({ type: "createFolder", source });
  }

  function deleteFolder(folderPath: string) {
    vscodeApi.postMessage({ type: "deleteFolder", folderPath });
  }

  return {
    subscribe,
    init,
    selectRule,
    toggleRule,
    toggleFolder,
    toggleRootRules,
    openFile,
    createRule,
    createRootRule,
    deleteRule,
    createFolder,
    deleteFolder,
  };
}

export const manager = createManagerStore();

// Derived stores
export const allRules = derived(manager, ($manager) => {
  const rules: Array<
    RuleFile & { source: "project" | "global"; folderName: string }
  > = [];

  // Project rules
  for (const folder of $manager.projectData.folders) {
    for (const rule of folder.rules) {
      rules.push({ ...rule, source: "project", folderName: folder.name });
    }
  }
  for (const rule of $manager.projectData.rootRules) {
    rules.push({ ...rule, source: "project", folderName: "Root" });
  }

  // Global rules
  for (const folder of $manager.globalData.folders) {
    for (const rule of folder.rules) {
      rules.push({ ...rule, source: "global", folderName: folder.name });
    }
  }
  for (const rule of $manager.globalData.rootRules) {
    rules.push({ ...rule, source: "global", folderName: "Root" });
  }

  return rules;
});

export const enabledRuleIds = derived(manager, ($manager) => {
  return new Set($manager.config.enabledRules);
});
