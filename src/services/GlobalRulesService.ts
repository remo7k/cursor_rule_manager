import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import type { RuleFile, RuleFolder, RulesData } from "./RulesService";

// Extensions that Cursor recognizes as rules
const RULE_EXTENSIONS = [".md", ".mdc"];
const IGNORED_FILES = [
  ".DS_Store",
  "config.json",
  "mcp.json",
  "worktrees.json",
  "custom-modes.md",
];

export class GlobalRulesService {
  private getGlobalRulesDir(): vscode.Uri {
    const homeDir = os.homedir();
    return vscode.Uri.file(path.join(homeDir, ".cursor", "rules"));
  }

  async getRulesData(): Promise<RulesData> {
    const data: RulesData = {
      folders: [],
      rootRules: [],
      rootOtherFiles: [],
    };

    const rulesDir = this.getGlobalRulesDir();
    await this.scanDirectoryRecursive(rulesDir, data);

    return data;
  }

  private async scanDirectoryRecursive(
    dirUri: vscode.Uri,
    data: RulesData,
  ): Promise<void> {
    try {
      const entries = await vscode.workspace.fs.readDirectory(dirUri);

      const files: [string, vscode.FileType][] = [];
      const subdirs: [string, vscode.FileType][] = [];

      for (const [name, type] of entries) {
        if (IGNORED_FILES.includes(name)) continue;
        if (name.startsWith(".")) continue;

        if (type === vscode.FileType.Directory) {
          subdirs.push([name, type]);
        } else if (type === vscode.FileType.File) {
          files.push([name, type]);
        }
      }

      // Process files at root level
      for (const [name] of files) {
        const file = await this.createRuleFile(dirUri, name, "root");
        if (file.type === "rule") {
          data.rootRules.push(file);
        } else if (file.type === "other") {
          data.rootOtherFiles.push(file);
        }
      }

      // Process subdirectories
      for (const [name] of subdirs) {
        const folderUri = vscode.Uri.joinPath(dirUri, name);
        const folder = await this.scanFolder(folderUri, name, data);
        if (folder && folder.rules.length > 0) {
          data.folders.push(folder);
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  private async scanFolder(
    folderUri: vscode.Uri,
    folderName: string,
    data: RulesData,
  ): Promise<RuleFolder | null> {
    try {
      const entries = await vscode.workspace.fs.readDirectory(folderUri);

      const folder: RuleFolder = {
        id: `global:folder:${folderName}`,
        name: this.formatFolderName(folderName),
        path: folderUri.fsPath,
        rules: [],
        otherFiles: [],
        source: "global",
      };

      for (const [name, type] of entries) {
        if (IGNORED_FILES.includes(name)) continue;
        if (name.startsWith(".")) continue;

        if (type === vscode.FileType.File) {
          const file = await this.createRuleFile(folderUri, name, folderName);

          if (file.type === "readme") {
            folder.readme = file;
          } else if (file.type === "rule") {
            folder.rules.push(file);
          } else {
            folder.otherFiles.push(file);
          }
        } else if (type === vscode.FileType.Directory) {
          // Recursively scan subdirectories
          const subFolderUri = vscode.Uri.joinPath(folderUri, name);
          const subFolderName = `${folderName}/${name}`;
          const subFolder = await this.scanFolder(
            subFolderUri,
            subFolderName,
            data,
          );
          if (subFolder && subFolder.rules.length > 0) {
            data.folders.push(subFolder);
          }
        }
      }

      return folder;
    } catch {
      return null;
    }
  }

  private async createRuleFile(
    dirUri: vscode.Uri,
    filename: string,
    folderName: string,
  ): Promise<RuleFile> {
    const filePath = vscode.Uri.joinPath(dirUri, filename);
    const content = await vscode.workspace.fs.readFile(filePath);
    const ext = this.getExtension(filename);
    const baseName = filename.replace(/\.[^.]+$/, "");

    let type: "rule" | "readme" | "other" = "other";

    if (filename.toLowerCase() === "readme.md") {
      type = "readme";
    } else if (RULE_EXTENSIONS.includes(ext)) {
      type = "rule";
    }

    return {
      id: `global:${folderName}:${filename}`,
      name: this.formatRuleName(baseName),
      filename,
      content: content.toString(),
      path: filePath.fsPath,
      type,
      extension: ext,
    };
  }

  private getExtension(filename: string): string {
    const match = filename.match(/\.[^.]+$/);
    return match ? match[0] : "";
  }

  private formatFolderName(name: string): string {
    return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private formatRuleName(name: string): string {
    return name
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Legacy method
  async getRules(): Promise<RuleFile[]> {
    const data = await this.getRulesData();
    const allRules: RuleFile[] = [...data.rootRules];

    for (const folder of data.folders) {
      allRules.push(...folder.rules);
    }

    return allRules;
  }
}
