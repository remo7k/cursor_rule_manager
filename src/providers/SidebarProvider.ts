import * as vscode from "vscode";
import { RulesService } from "../services/RulesService";
import { GlobalRulesService } from "../services/GlobalRulesService";
import { ConfigService } from "../services/ConfigService";
import { generateCursorRules } from "../utils/generator";

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private rulesService: RulesService;
  private globalRulesService: GlobalRulesService;
  private configService: ConfigService;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    _context: vscode.ExtensionContext,
  ) {
    this.rulesService = new RulesService();
    this.globalRulesService = new GlobalRulesService();
    this.configService = new ConfigService();
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

        case "openManager":
          await vscode.commands.executeCommand("ruleManager.openManager");
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
