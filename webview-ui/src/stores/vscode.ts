import { writable, derived } from "svelte/store";
import { vscodeApi } from "../utils/vscodeApi";

// Types for files and folders
export interface RuleFile {
  id: string;
  name: string;
  filename: string;
  content: string;
  path: string;
  type: "rule" | "readme" | "other";
  extension: string;
}

export interface RuleFolder {
  id: string;
  name: string;
  path: string;
  readme?: RuleFile;
  rules: RuleFile[];
  otherFiles: RuleFile[];
  source: "project" | "global";
}

export interface RulesData {
  folders: RuleFolder[];
  rootRules: RuleFile[];
  rootOtherFiles: RuleFile[];
  cursorrules?: RuleFile;
}

export interface Config {
  enabledDocs: string[];
  enabledRules: string[];
}

export interface AppState {
  projectData: RulesData;
  globalData: RulesData;
  config: Config;
  loading: boolean;
}

type MessageType =
  | { type: "init"; data: AppState }
  | { type: "error"; message: string }
  | { type: "refresh" };

const emptyRulesData: RulesData = {
  folders: [],
  rootRules: [],
  rootOtherFiles: [],
};

// Create the main store
function createVSCodeStore() {
  const { subscribe, set, update } = writable<AppState>({
    projectData: emptyRulesData,
    globalData: emptyRulesData,
    config: { enabledDocs: [], enabledRules: [] },
    loading: true,
  });

  // Initialize: request data and set up message listener
  function init() {
    vscodeApi.postMessage({ type: "getInitialData" });

    window.addEventListener("message", (event: MessageEvent<MessageType>) => {
      const message = event.data;

      switch (message.type) {
        case "init":
          set({ ...message.data, loading: false });
          break;
        case "error":
          console.error("Extension error:", message.message);
          update((state) => ({ ...state, loading: false }));
          break;
        case "refresh":
          vscodeApi.postMessage({ type: "getInitialData" });
          break;
      }
    });
  }

  return {
    subscribe,
    init,
    openFile: (path: string) =>
      vscodeApi.postMessage({ type: "openFile", path }),
    openManager: () => vscodeApi.postMessage({ type: "openManager" }),
  };
}

export const vscode = createVSCodeStore();

// Derived stores for convenience
export const loading = derived(vscode, ($vscode) => $vscode.loading);
export const projectData = derived(vscode, ($vscode) => $vscode.projectData);
export const globalData = derived(vscode, ($vscode) => $vscode.globalData);
export const config = derived(vscode, ($vscode) => $vscode.config);
