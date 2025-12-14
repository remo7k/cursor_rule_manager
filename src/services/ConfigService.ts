import * as vscode from "vscode";

export interface Config {
  enabledDocs: string[];
  enabledRules: string[];
}

const DEFAULT_CONFIG: Config = {
  enabledDocs: [],
  enabledRules: [],
};

export class ConfigService {
  private getConfigPath(workspaceUri: vscode.Uri): vscode.Uri {
    return vscode.Uri.joinPath(workspaceUri, ".cursor", "config.json");
  }

  async getConfig(workspaceUri: vscode.Uri): Promise<Config> {
    const configPath = this.getConfigPath(workspaceUri);

    try {
      const content = await vscode.workspace.fs.readFile(configPath);
      const config = JSON.parse(content.toString());
      return {
        enabledDocs: config.enabledDocs || [],
        enabledRules: config.enabledRules || [],
      };
    } catch {
      // Config doesn't exist, return default
      return { ...DEFAULT_CONFIG };
    }
  }

  async updateConfig(workspaceUri: vscode.Uri, config: Config): Promise<void> {
    const configPath = this.getConfigPath(workspaceUri);

    // Ensure .cursor directory exists
    const cursorDir = vscode.Uri.joinPath(workspaceUri, ".cursor");
    try {
      await vscode.workspace.fs.createDirectory(cursorDir);
    } catch {
      // Directory might already exist
    }

    const content = JSON.stringify(config, null, 2);
    await vscode.workspace.fs.writeFile(
      configPath,
      Buffer.from(content, "utf8"),
    );
  }
}
