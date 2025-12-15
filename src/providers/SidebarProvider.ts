import * as vscode from "vscode";
import { RulesService } from "../services/RulesService";
import { GlobalRulesService } from "../services/GlobalRulesService";
import { ConfigService } from "../services/ConfigService";
import { DocsScraperService } from "../services/DocsScraperService";
import { generateCursorRules } from "../utils/generator";
import type { StorageLocation } from "../scrapers/types";

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private rulesService: RulesService;
  private globalRulesService: GlobalRulesService;
  private configService: ConfigService;
  private docsScraperService: DocsScraperService;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    _context: vscode.ExtensionContext,
  ) {
    this.rulesService = new RulesService();
    this.globalRulesService = new GlobalRulesService();
    this.configService = new ConfigService();
    this.docsScraperService = new DocsScraperService();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "getInitialData":
          await this._sendInitialData();
          break;

        case "generate":
          await this._generate();
          break;

        case "openFile":
          await this._openFile(message.path);
          break;

        case "openPreview":
          console.log("SidebarProvider received openPreview:", message.rule);
          await vscode.commands.executeCommand(
            "ruleManager.openPreview",
            message.rule,
          );
          break;

        case "toggleRule":
          await this._toggleRule(message.ruleId, message.enabled);
          break;

        case "toggleFolder":
          await this._toggleFolder(message.folderId, message.enabled);
          break;

        case "toggleRootRules":
          await this._toggleRootRules(message.source, message.enabled);
          break;

        case "createRule":
          await this._createRule(message.folderPath);
          break;

        case "createRootRule":
          await this._createRootRule(message.source);
          break;

        case "deleteRule":
          await this._deleteRule(message.rulePath);
          break;

        case "createFolder":
          await this._createFolder(message.source);
          break;

        case "deleteFolder":
          await this._deleteFolder(message.folderPath);
          break;

        case "getDocsSources":
          await this._sendDocsSources();
          break;

        case "scrapeDocs":
          await this._scrapeDocs(message.sourceId, message.location);
          break;

        case "scrapeCustomUrl":
          await this._scrapeCustomUrl(
            message.url,
            message.name,
            message.location,
          );
          break;
      }
    });
  }

  public refresh() {
    if (this._view) {
      this._sendInitialData();
    }
  }

  private async _sendInitialData() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      this._view?.webview.postMessage({
        type: "error",
        message: "No workspace folder open",
      });
      return;
    }

    try {
      const [projectData, globalData, config] = await Promise.all([
        this.rulesService.getRulesData(workspaceFolder.uri),
        this.globalRulesService.getRulesData(),
        this.configService.getConfig(workspaceFolder.uri),
      ]);

      this._view?.webview.postMessage({
        type: "init",
        data: {
          projectData,
          globalData,
          config,
          loading: false,
        },
      });
    } catch (error) {
      this._view?.webview.postMessage({
        type: "error",
        message: `Failed to load data: ${error}`,
      });
    }
  }

  private async _sendUpdatedData() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    try {
      const [projectData, globalData, config] = await Promise.all([
        this.rulesService.getRulesData(workspaceFolder.uri),
        this.globalRulesService.getRulesData(),
        this.configService.getConfig(workspaceFolder.uri),
      ]);

      this._view?.webview.postMessage({
        type: "dataUpdated",
        data: { projectData, globalData, config },
      });
    } catch (error) {
      this._view?.webview.postMessage({
        type: "error",
        message: `Failed to refresh data: ${error}`,
      });
    }
  }

  private async _generate() {
    try {
      await generateCursorRules();
      this._view?.webview.postMessage({
        type: "generated",
        success: true,
      });
      vscode.window.showInformationMessage(
        ".cursorrules generated successfully!",
      );
    } catch (error) {
      this._view?.webview.postMessage({
        type: "error",
        message: `Failed to generate: ${error}`,
      });
    }
  }

  private async _openFile(path: string) {
    try {
      const document = await vscode.workspace.openTextDocument(path);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
  }

  private async _toggleRule(ruleId: string, enabled: boolean) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    try {
      const config = await this.configService.getConfig(workspaceFolder.uri);

      if (enabled) {
        if (!config.enabledRules.includes(ruleId)) {
          config.enabledRules.push(ruleId);
        }
      } else {
        config.enabledRules = config.enabledRules.filter((id) => id !== ruleId);
      }

      await this.configService.updateConfig(workspaceFolder.uri, config);

      this._view?.webview.postMessage({
        type: "configUpdated",
        config,
      });
    } catch (error) {
      this._view?.webview.postMessage({
        type: "error",
        message: `Failed to toggle rule: ${error}`,
      });
    }
  }

  private async _toggleFolder(folderId: string, enabled: boolean) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    try {
      const [projectData, globalData, config] = await Promise.all([
        this.rulesService.getRulesData(workspaceFolder.uri),
        this.globalRulesService.getRulesData(),
        this.configService.getConfig(workspaceFolder.uri),
      ]);

      const allFolders = [...projectData.folders, ...globalData.folders];
      const folder = allFolders.find((f) => f.id === folderId);
      if (!folder) return;

      const ruleIds = folder.rules.map((r) => r.id);

      if (enabled) {
        for (const id of ruleIds) {
          if (!config.enabledRules.includes(id)) {
            config.enabledRules.push(id);
          }
        }
      } else {
        config.enabledRules = config.enabledRules.filter(
          (id) => !ruleIds.includes(id),
        );
      }

      await this.configService.updateConfig(workspaceFolder.uri, config);
      this._view?.webview.postMessage({ type: "configUpdated", config });
    } catch (error) {
      this._view?.webview.postMessage({
        type: "error",
        message: `Failed to toggle folder: ${error}`,
      });
    }
  }

  private async _toggleRootRules(
    source: "project" | "global",
    enabled: boolean,
  ) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    try {
      const [projectData, globalData, config] = await Promise.all([
        this.rulesService.getRulesData(workspaceFolder.uri),
        this.globalRulesService.getRulesData(),
        this.configService.getConfig(workspaceFolder.uri),
      ]);

      const rootRules =
        source === "project" ? projectData.rootRules : globalData.rootRules;
      const ruleIds = rootRules.map((r) => r.id);

      if (enabled) {
        for (const id of ruleIds) {
          if (!config.enabledRules.includes(id)) {
            config.enabledRules.push(id);
          }
        }
      } else {
        config.enabledRules = config.enabledRules.filter(
          (id) => !ruleIds.includes(id),
        );
      }

      await this.configService.updateConfig(workspaceFolder.uri, config);
      this._view?.webview.postMessage({ type: "configUpdated", config });
    } catch (error) {
      this._view?.webview.postMessage({
        type: "error",
        message: `Failed to toggle root rules: ${error}`,
      });
    }
  }

  private async _createRule(folderPath: string) {
    const name = await vscode.window.showInputBox({
      prompt: "Enter rule name",
      placeHolder: "my-rule",
      validateInput: (value) => {
        if (!value) return "Name is required";
        if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
          return "Name can only contain letters, numbers, hyphens, and underscores";
        }
        return null;
      },
    });

    if (!name) return;

    try {
      const rulePath = vscode.Uri.file(`${folderPath}/${name}.mdc`);
      const template = `---
description: 
alwaysApply: false
---

# ${name}

Add your rule content here.
`;
      await vscode.workspace.fs.writeFile(rulePath, Buffer.from(template));

      const doc = await vscode.workspace.openTextDocument(rulePath);
      await vscode.window.showTextDocument(doc);

      await this._sendUpdatedData();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create rule: ${error}`);
    }
  }

  private async _createRootRule(source: "project" | "global") {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const name = await vscode.window.showInputBox({
      prompt: "Enter rule name",
      placeHolder: "my-rule",
      validateInput: (value) => {
        if (!value) return "Name is required";
        if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
          return "Name can only contain letters, numbers, hyphens, and underscores";
        }
        return null;
      },
    });

    if (!name) return;

    try {
      let basePath: vscode.Uri;
      if (source === "project") {
        basePath = vscode.Uri.joinPath(workspaceFolder.uri, ".cursor", "rules");
      } else {
        const homeDir = process.env.HOME || process.env.USERPROFILE || "";
        basePath = vscode.Uri.file(`${homeDir}/.cursor/rules`);
      }

      try {
        await vscode.workspace.fs.createDirectory(basePath);
      } catch {
        // Directory might already exist
      }

      const rulePath = vscode.Uri.joinPath(basePath, `${name}.mdc`);
      const template = `---
description: 
alwaysApply: false
---

# ${name}

Add your rule content here.
`;
      await vscode.workspace.fs.writeFile(rulePath, Buffer.from(template));

      const doc = await vscode.workspace.openTextDocument(rulePath);
      await vscode.window.showTextDocument(doc);

      await this._sendUpdatedData();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create rule: ${error}`);
    }
  }

  private async _deleteRule(rulePath: string) {
    const confirm = await vscode.window.showWarningMessage(
      "Are you sure you want to delete this rule?",
      { modal: true },
      "Delete",
    );

    if (confirm !== "Delete") return;

    try {
      await vscode.workspace.fs.delete(vscode.Uri.file(rulePath));
      vscode.window.showInformationMessage("Rule deleted");
      await this._sendUpdatedData();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete rule: ${error}`);
    }
  }

  private async _createFolder(source: "project" | "global") {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const name = await vscode.window.showInputBox({
      prompt: "Enter folder name",
      placeHolder: "my-folder",
      validateInput: (value) => {
        if (!value) return "Name is required";
        if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
          return "Name can only contain letters, numbers, hyphens, and underscores";
        }
        return null;
      },
    });

    if (!name) return;

    try {
      let basePath: vscode.Uri;
      if (source === "project") {
        basePath = vscode.Uri.joinPath(workspaceFolder.uri, ".cursor", "rules");
      } else {
        const homeDir = process.env.HOME || process.env.USERPROFILE || "";
        basePath = vscode.Uri.file(`${homeDir}/.cursor/rules`);
      }

      try {
        await vscode.workspace.fs.createDirectory(basePath);
      } catch {
        // Directory might already exist
      }

      const folderPath = vscode.Uri.joinPath(basePath, name);
      await vscode.workspace.fs.createDirectory(folderPath);

      vscode.window.showInformationMessage(`Folder "${name}" created`);
      await this._sendUpdatedData();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to create folder: ${error}`);
    }
  }

  private async _deleteFolder(folderPath: string) {
    const confirm = await vscode.window.showWarningMessage(
      "Are you sure you want to delete this folder and all its rules?",
      { modal: true },
      "Delete",
    );

    if (confirm !== "Delete") return;

    try {
      await vscode.workspace.fs.delete(vscode.Uri.file(folderPath), {
        recursive: true,
      });
      vscode.window.showInformationMessage("Folder deleted");
      await this._sendUpdatedData();
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to delete folder: ${error}`);
    }
  }

  private async _sendDocsSources() {
    const sources = this.docsScraperService.getAvailableSources().map((s) => ({
      id: s.id,
      name: s.name,
      repo: `${s.owner}/${s.repo}`,
    }));

    this._view?.webview.postMessage({
      type: "docsSources",
      sources,
    });
  }

  private async _scrapeDocs(sourceId: string, location: StorageLocation) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (location === "project" && !workspaceFolder) {
      this._view?.webview.postMessage({
        type: "scrapeError",
        message: "No workspace folder open for project storage",
      });
      return;
    }

    const source = this.docsScraperService.getSource(sourceId);
    if (!source) {
      this._view?.webview.postMessage({
        type: "scrapeError",
        message: `Unknown source: ${sourceId}`,
      });
      return;
    }

    this._view?.webview.postMessage({
      type: "scrapeStarted",
      sourceId,
    });

    try {
      const results = await this.docsScraperService.scrapeSource(
        sourceId,
        location,
        workspaceFolder?.uri,
        (progress) => {
          this._view?.webview.postMessage({
            type: "scrapeProgress",
            ...progress,
          });
        },
      );

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success);

      this._view?.webview.postMessage({
        type: "scrapeComplete",
        successful,
        failed: failed.length,
        errors: failed.map((f) => ({ name: f.outputName, error: f.error })),
      });

      await this._sendUpdatedData();
    } catch (error) {
      this._view?.webview.postMessage({
        type: "scrapeError",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async _scrapeCustomUrl(
    url: string,
    name: string,
    location: StorageLocation,
  ) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (location === "project" && !workspaceFolder) {
      this._view?.webview.postMessage({
        type: "scrapeError",
        message: "No workspace folder open for project storage",
      });
      return;
    }

    this._view?.webview.postMessage({
      type: "scrapeStarted",
      sourceId: name,
    });

    try {
      const results = await this.docsScraperService.scrapeCustomUrl(
        url,
        name,
        location,
        workspaceFolder?.uri,
        (progress) => {
          this._view?.webview.postMessage({
            type: "scrapeProgress",
            ...progress,
          });
        },
      );

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success);

      this._view?.webview.postMessage({
        type: "scrapeComplete",
        successful,
        failed: failed.length,
        errors: failed.map((f) => ({ name: f.outputName, error: f.error })),
      });

      await this._sendUpdatedData();
    } catch (error) {
      this._view?.webview.postMessage({
        type: "scrapeError",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "dist",
        "assets",
        "main.js",
      ),
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "dist",
        "assets",
        "index.css",
      ),
    );

    const nonce = this._getNonce();

    const mainStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "dist",
        "assets",
        "main.css",
      ),
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${styleUri}">
  <link rel="stylesheet" href="${mainStyleUri}">
  <title>Rule Manager</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
