import * as vscode from "vscode";
import { RulesService } from "../services/RulesService";
import type { RuleFile } from "../services/RulesService";

export class PreviewPanelProvider {
  public static currentPanel: PreviewPanelProvider | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private rulesService: RulesService;
  private currentRule: RuleFile | undefined;

  public static createOrShow(extensionUri: vscode.Uri, rule: RuleFile) {
    const column = vscode.ViewColumn.One;

    // If panel already exists, update it with the new rule
    if (PreviewPanelProvider.currentPanel) {
      PreviewPanelProvider.currentPanel._panel.reveal(column);
      PreviewPanelProvider.currentPanel._updateRule(rule);
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      "ruleManager.preview",
      `Preview: ${rule.name}`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      },
    );

    PreviewPanelProvider.currentPanel = new PreviewPanelProvider(
      panel,
      extensionUri,
      rule,
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    rule: RuleFile,
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.rulesService = new RulesService();
    this.currentRule = rule;

    // Set HTML content
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "getInitialData":
            await this._sendRuleData();
            break;

          case "openFile":
            await this._openFile(message.path);
            break;

          case "updateRule":
            await this._updateRuleContent(message.path, message.content);
            break;
        }
      },
      null,
      this._disposables,
    );

    // Handle panel disposal
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  private _updateRule(rule: RuleFile) {
    this.currentRule = rule;
    this._panel.title = `Preview: ${rule.name}`;
    this._sendRuleData();
  }

  public dispose() {
    PreviewPanelProvider.currentPanel = undefined;
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private async _sendRuleData() {
    if (!this.currentRule) return;

    this._panel.webview.postMessage({
      type: "ruleData",
      rule: this.currentRule,
    });
  }

  private async _openFile(path: string) {
    try {
      const document = await vscode.workspace.openTextDocument(path);
      await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
  }

  private async _updateRuleContent(path: string, content: string) {
    try {
      await this.rulesService.updateRule(path, content);
      vscode.window.showInformationMessage("Rule updated successfully");
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to update rule: ${error}`);
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
  <title>Rule Preview</title>
</head>
<body data-view="preview">
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



