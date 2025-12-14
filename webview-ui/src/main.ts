import App from "./App.svelte";
import "./index.css";
import { vscode } from "./stores/vscode";

// Initialize the VS Code store
vscode.init();

const app = new App({
  target: document.getElementById("root")!,
});

export default app;
