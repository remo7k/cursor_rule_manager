import * as vscode from "vscode";

export interface RuleFile {
  id: string;
  name: string;
  filename: string;
  content: string;
  path: string;
  type: "rule" | "readme" | "other";
  extension: string;
}

export interface RuleFolder {
  id: string;
  name: string;
  path: string;
  readme?: RuleFile;
  rules: RuleFile[];
  otherFiles: RuleFile[];
  source: "project" | "global";
}

export interface RulesData {
  folders: RuleFolder[];
  rootRules: RuleFile[];
  rootOtherFiles: RuleFile[];
  cursorrules?: RuleFile;
}

// Extensions that Cursor recognizes as rules
const RULE_EXTENSIONS = [".md", ".mdc"];
const IGNORED_FILES = [
  ".DS_Store",
  "config.json",
  "mcp.json",
  "worktrees.json",
  "custom-modes.md",
];

export class RulesService {
  private getRulesDir(workspaceUri: vscode.Uri): vscode.Uri {
    return vscode.Uri.joinPath(workspaceUri, ".cursor", "rules");
  }

  private getCursorRulesPath(workspaceUri: vscode.Uri): vscode.Uri {
    return vscode.Uri.joinPath(workspaceUri, ".cursorrules");
  }

  async getRulesData(workspaceUri: vscode.Uri): Promise<RulesData> {
    const data: RulesData = {
      folders: [],
      rootRules: [],
      rootOtherFiles: [],
    };

    // Get .cursorrules file
    data.cursorrules = await this.getCursorRulesFile(workspaceUri);

    // Scan .cursor/rules/ directory recursively
    const rulesDir = this.getRulesDir(workspaceUri);
    await this.scanDirectoryRecursive(rulesDir, data, "project");

    return data;
  }

  private async getCursorRulesFile(
    workspaceUri: vscode.Uri,
  ): Promise<RuleFile | undefined> {
    const cursorRulesPath = this.getCursorRulesPath(workspaceUri);

    try {
      const content = await vscode.workspace.fs.readFile(cursorRulesPath);
      const text = content.toString();

      if (text.trim()) {
        return {
          id: "cursorrules:main",
          name: ".cursorrules",
          filename: ".cursorrules",
          content: text,
          path: cursorRulesPath.fsPath,
          type: "rule",
          extension: "",
        };
      }
    } catch {
      // .cursorrules doesn't exist
    }

    return undefined;
  }

  private async scanDirectoryRecursive(
    dirUri: vscode.Uri,
    data: RulesData,
    source: "project" | "global",
  ): Promise<void> {
    try {
      const entries = await vscode.workspace.fs.readDirectory(dirUri);

      // Separate files and subdirectories
      const files: [string, vscode.FileType][] = [];
      const subdirs: [string, vscode.FileType][] = [];

      for (const [name, type] of entries) {
        if (IGNORED_FILES.includes(name)) continue;
        if (name.startsWith(".") && name !== ".cursorrules") continue;

        if (type === vscode.FileType.Directory) {
          subdirs.push([name, type]);
        } else if (type === vscode.FileType.File) {
          files.push([name, type]);
        }
      }

      // Process files at root level of rules dir
      for (const [name] of files) {
        const file = await this.createRuleFile(dirUri, name, source, "root");
        if (file.type === "rule") {
          data.rootRules.push(file);
        } else if (file.type === "other") {
          data.rootOtherFiles.push(file);
        }
      }

      // Process subdirectories as folders
      for (const [name] of subdirs) {
        const folderUri = vscode.Uri.joinPath(dirUri, name);
        const folder = await this.scanFolder(folderUri, name, source, data);
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
    source: "project" | "global",
    data: RulesData,
  ): Promise<RuleFolder | null> {
    try {
      const entries = await vscode.workspace.fs.readDirectory(folderUri);

      const folder: RuleFolder = {
        id: `${source}:folder:${folderName}`,
        name: this.formatFolderName(folderName),
        path: folderUri.fsPath,
        rules: [],
        otherFiles: [],
        source,
      };

      for (const [name, type] of entries) {
        if (IGNORED_FILES.includes(name)) continue;
        if (name.startsWith(".")) continue;

        if (type === vscode.FileType.File) {
          const file = await this.createRuleFile(
            folderUri,
            name,
            source,
            folderName,
          );

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
            source,
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
    source: "project" | "global",
    folderName: string,
  ): Promise<RuleFile> {
    const filePath = vscode.Uri.joinPath(dirUri, filename);
    const content = await vscode.workspace.fs.readFile(filePath);
    const ext = this.getExtension(filename);
    const baseName = filename.replace(/\.[^.]+$/, "");

    // Determine file type
    let type: "rule" | "readme" | "other" = "other";

    if (filename.toLowerCase() === "readme.md") {
      type = "readme";
    } else if (RULE_EXTENSIONS.includes(ext)) {
      type = "rule";
    }

    return {
      id: `${source}:${folderName}:${filename}`,
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
    // Convert "backend-rules" to "Backend Rules"
    return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private formatRuleName(name: string): string {
    // Convert "backend-agent" to "Backend Agent"
    return name
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Legacy method for backward compatibility
  async getRules(workspaceUri: vscode.Uri): Promise<RuleFile[]> {
    const data = await this.getRulesData(workspaceUri);
    const allRules: RuleFile[] = [...data.rootRules];

    for (const folder of data.folders) {
      allRules.push(...folder.rules);
    }

    return allRules;
  }

  async getCursorRulesContent(workspaceUri: vscode.Uri): Promise<RuleFile[]> {
    const file = await this.getCursorRulesFile(workspaceUri);
    return file ? [file] : [];
  }

  async createRule(
    workspaceUri: vscode.Uri,
    folderPath: string | null,
    name: string,
    content: string,
  ): Promise<void> {
    let targetDir: vscode.Uri;

    if (folderPath) {
      targetDir = vscode.Uri.file(folderPath);
    } else {
      targetDir = this.getRulesDir(workspaceUri);
    }

    // Ensure directory exists
    try {
      await vscode.workspace.fs.createDirectory(targetDir);
    } catch {
      // Directory might already exist
    }

    // Sanitize name for filename
    const safeName = name.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
    const filePath = vscode.Uri.joinPath(targetDir, `${safeName}.mdc`);

    await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, "utf8"));
  }

  async updateRule(rulePath: string, content: string): Promise<void> {
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(rulePath),
      Buffer.from(content, "utf8"),
    );
  }

  async deleteRule(rulePath: string): Promise<void> {
    await vscode.workspace.fs.delete(vscode.Uri.file(rulePath));
  }

  async createFolder(workspaceUri: vscode.Uri, name: string): Promise<void> {
    const rulesDir = this.getRulesDir(workspaceUri);
    const safeName = name.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
    const folderPath = vscode.Uri.joinPath(rulesDir, safeName);

    await vscode.workspace.fs.createDirectory(folderPath);
  }
}
