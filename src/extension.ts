import * as vscode from "vscode";
import { SidebarProvider } from "./providers/SidebarProvider";
import { PreviewPanelProvider } from "./providers/PreviewPanelProvider";
import { generateCursorRules } from "./utils/generator";
import { DocsScraperService } from "./services/DocsScraperService";
import type { RuleFile } from "./services/RulesService";

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

  // Register open preview command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "ruleManager.openPreview",
      (rule: RuleFile) => {
        console.log("openPreview command called with rule:", rule);
        PreviewPanelProvider.createOrShow(context.extensionUri, rule);
      },
    ),
  );

  // Register scrape docs command
  const docsScraperService = new DocsScraperService();

  // Register GitHub login command
  context.subscriptions.push(
    vscode.commands.registerCommand("ruleManager.loginGitHub", async () => {
      const success = await docsScraperService.login();
      if (success) {
        vscode.window.showInformationMessage(
          "Logged in to GitHub! You now have 5000 API requests/hour.",
        );
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("ruleManager.scrapeDocs", async () => {
      const sources = docsScraperService.getAvailableSources();

      // Pick a source
      const sourceItems = sources.map((s) => ({
        label: s.name,
        description: `${s.owner}/${s.repo}`,
        id: s.id,
      }));

      const selectedSource = await vscode.window.showQuickPick(sourceItems, {
        placeHolder: "Select documentation source to scrape",
      });

      if (!selectedSource) {
        return;
      }

      // Pick storage location
      const locationItems = [
        {
          label: "Global",
          description: "~/.cursor/rules/ - Available in all projects",
          id: "global" as const,
        },
        {
          label: "Project",
          description: ".cursor/rules/ - Only this project",
          id: "project" as const,
        },
      ];

      const selectedLocation = await vscode.window.showQuickPick(
        locationItems,
        {
          placeHolder: "Where should the documentation be saved?",
        },
      );

      if (!selectedLocation) {
        return;
      }

      const workspaceUri = vscode.workspace.workspaceFolders?.[0]?.uri;
      if (selectedLocation.id === "project" && !workspaceUri) {
        vscode.window.showErrorMessage(
          "No workspace folder open. Please open a folder first.",
        );
        return;
      }

      // Scrape with progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Scraping ${selectedSource.label} documentation`,
          cancellable: false,
        },
        async (progress) => {
          try {
            const results = await docsScraperService.scrapeSource(
              selectedSource.id,
              selectedLocation.id,
              workspaceUri,
              (p) => {
                progress.report({
                  message: `${p.current}/${p.total}: ${p.currentPage}`,
                  increment: (1 / p.total) * 100,
                });
              },
            );

            const successful = results.filter((r) => r.success).length;
            const failed = results.filter((r) => !r.success).length;

            if (failed > 0) {
              vscode.window.showWarningMessage(
                `Scraped ${successful} pages, ${failed} failed. Check output for details.`,
              );
            } else {
              vscode.window.showInformationMessage(
                `Successfully scraped ${successful} documentation pages!`,
              );
            }

            // Refresh sidebar to show new rules
            sidebarProvider.refresh();
          } catch (error) {
            vscode.window.showErrorMessage(
              `Failed to scrape documentation: ${error}`,
            );
          }
        },
      );
    }),
  );
}

export function deactivate() {}
