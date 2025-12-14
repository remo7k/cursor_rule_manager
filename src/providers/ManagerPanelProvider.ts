import * as vscode from "vscode";
import { RulesService } from "../services/RulesService";
import { GlobalRulesService } from "../services/GlobalRulesService";
import { ConfigService } from "../services/ConfigService";

export class ManagerPanelProvider {
  public static currentPanel: ManagerPanelProvider | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  private rulesService: RulesService;
  private globalRulesService: GlobalRulesService;
  private configService: ConfigService;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If panel already exists, show it
    if (ManagerPanelProvider.currentPanel) {
      ManagerPanelProvider.currentPanel._panel.reveal(column);
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      "ruleManager.manager",
      "Rule Manager",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      },
    );

    ManagerPanelProvider.currentPanel = new ManagerPanelProvider(
      panel,
      extensionUri,
    );
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.rulesService = new RulesService();
    this.globalRulesService = new GlobalRulesService();
    this.configService = new ConfigService();

    // Set HTML content
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "getInitialData":
            await this._sendInitialData();
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

          case "openFile":
            await this._openFile(message.path);
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

          case "updateRule":
            await this._updateRule(message.rulePath, message.content);
            break;
        }
      },
      null,
      this._disposables,
    );

    // Handle panel disposal
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    ManagerPanelProvider.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private async _sendInitialData() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      this._panel.webview.postMessage({
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

      this._panel.webview.postMessage({
        type: "init",
        data: {
          projectData,
          globalData,
          config,
          viewType: "manager",
        },
      });
    } catch (error) {
      this._panel.webview.postMessage({
        type: "error",
        message: `Failed to load data: ${error}`,
      });
    }
  }

  private async _toggleRule(ruleId: string, enabled: boolean) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    try {
      const config = await this.configService.getConfig(workspaceFolder.uri);

      if (enabled) {
        // Add to enabled rules if not already present
        if (!config.enabledRules.includes(ruleId)) {
          config.enabledRules.push(ruleId);
        }
      } else {
        // Remove from enabled rules
        config.enabledRules = config.enabledRules.filter((id) => id !== ruleId);
      }

      await this.configService.updateConfig(workspaceFolder.uri, config);

      // Send updated config back
      this._panel.webview.postMessage({
        type: "configUpdated",
        config,
      });
    } catch (error) {
      this._panel.webview.postMessage({
        type: "error",
        message: `Failed to toggle rule: ${error}`,
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

  private async _toggleFolder(folderId: string, enabled: boolean) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    try {
      const [projectData, globalData, config] = await Promise.all([
        this.rulesService.getRulesData(workspaceFolder.uri),
        this.globalRulesService.getRulesData(),
        this.configService.getConfig(workspaceFolder.uri),
      ]);

      // Find the folder and get all rule IDs
      const allFolders = [...projectData.folders, ...globalData.folders];
      const folder = allFolders.find((f) => f.id === folderId);
      if (!folder) return;

      const ruleIds = folder.rules.map((r) => r.id);

      if (enabled) {
        // Add all rule IDs
        for (const id of ruleIds) {
          if (!config.enabledRules.includes(id)) {
            config.enabledRules.push(id);
          }
        }
      } else {
        // Remove all rule IDs
        config.enabledRules = config.enabledRules.filter(
          (id) => !ruleIds.includes(id),
        );
      }

      await this.configService.updateConfig(workspaceFolder.uri, config);
      this._panel.webview.postMessage({ type: "configUpdated", config });
    } catch (error) {
      this._panel.webview.postMessage({
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
      this._panel.webview.postMessage({ type: "configUpdated", config });
    } catch (error) {
      this._panel.webview.postMessage({
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

      // Open the new file
      const doc = await vscode.workspace.openTextDocument(rulePath);
      await vscode.window.showTextDocument(doc);

      // Refresh data
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

      // Ensure directory exists
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

      // Open the new file
      const doc = await vscode.workspace.openTextDocument(rulePath);
      await vscode.window.showTextDocument(doc);

      // Refresh data
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

      // Ensure base directory exists
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

  private async _updateRule(rulePath: string, content: string) {
    try {
      await this.rulesService.updateRule(rulePath, content);
    } catch (error) {
      this._panel.webview.postMessage({
        type: "error",
        message: `Failed to update rule: ${error}`,
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

      this._panel.webview.postMessage({
        type: "dataUpdated",
        data: { projectData, globalData, config },
      });
    } catch (error) {
      this._panel.webview.postMessage({
        type: "error",
        message: `Failed to refresh data: ${error}`,
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

    const mainStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-ui",
        "dist",
        "assets",
        "main.css",
      ),
    );

    const nonce = this._getNonce();

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
<body data-view="manager">
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
