import * as vscode from "vscode";
import { SidebarProvider } from "./providers/SidebarProvider";
import { generateCursorRules } from "./utils/generator";

export function activate(context: vscode.ExtensionContext) {
  console.log("Cursor Rule Manager is now active!");

  // Register the sidebar webview provider
  const sidebarProvider = new SidebarProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "ruleManager.sidebar",
      sidebarProvider,
    ),
  );

  // Register refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand("ruleManager.refresh", () => {
      sidebarProvider.refresh();
    }),
  );

  // Register generate command
  context.subscriptions.push(
    vscode.commands.registerCommand("ruleManager.generate", async () => {
      try {
        await generateCursorRules();
        vscode.window.showInformationMessage(
          ".cursorrules file generated successfully!",
        );
        sidebarProvider.refresh();
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to generate .cursorrules: ${error}`,
        );
      }
    }),
  );
}

export function deactivate() {}
