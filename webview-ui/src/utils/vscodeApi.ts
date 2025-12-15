/**
 * VS Code API singleton
 * acquireVsCodeApi() can only be called once per webview
 */

declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

export const vscodeApi = acquireVsCodeApi();

