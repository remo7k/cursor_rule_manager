import { writable, derived } from "svelte/store";
import { vscodeApi } from "../utils/vscodeApi";
import type { RuleFile } from "./vscode";

interface PreviewState {
  loading: boolean;
  rule: RuleFile | null;
}

function createPreviewStore() {
  const { subscribe, set, update } = writable<PreviewState>({
    loading: true,
    rule: null,
  });

  // Listen for messages from the extension
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "ruleData":
        update((state) => ({
          ...state,
          loading: false,
          rule: message.rule,
        }));
        break;
    }
  });

  return {
    subscribe,
    init() {
      vscodeApi.postMessage({ type: "getInitialData" });
    },
    openFile(path: string) {
      vscodeApi.postMessage({ type: "openFile", path });
    },
    updateRule(path: string, content: string) {
      vscodeApi.postMessage({ type: "updateRule", path, content });
    },
  };
}

export const preview = createPreviewStore();



