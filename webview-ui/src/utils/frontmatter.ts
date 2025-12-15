/**
 * Simple frontmatter parser for Cursor rule files
 * Handles YAML frontmatter between --- delimiters
 */

export interface RuleFrontmatter {
  description?: string;
  globs?: string;
  alwaysApply?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface ParsedRule {
  frontmatter: RuleFrontmatter;
  content: string;
  raw: string;
}

/**
 * Parse frontmatter from a rule file content
 */
export function parseFrontmatter(raw: string): ParsedRule {
  const trimmed = raw.trim();

  // Check if file starts with frontmatter delimiter
  if (!trimmed.startsWith("---")) {
    return {
      frontmatter: {},
      content: raw,
      raw,
    };
  }

  // Find the closing delimiter
  const endIndex = trimmed.indexOf("---", 3);
  if (endIndex === -1) {
    return {
      frontmatter: {},
      content: raw,
      raw,
    };
  }

  const frontmatterStr = trimmed.slice(3, endIndex).trim();
  const content = trimmed.slice(endIndex + 3).trim();

  // Parse YAML-like frontmatter (simple key: value pairs)
  const frontmatter: RuleFrontmatter = {};

  for (const line of frontmatterStr.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: string | boolean = line.slice(colonIndex + 1).trim();

    // Parse booleans
    if (value === "true") {
      value = true;
    } else if (value === "false") {
      value = false;
    }

    frontmatter[key] = value;
  }

  return {
    frontmatter,
    content,
    raw,
  };
}

/**
 * Serialize frontmatter and content back to a rule file string
 */
export function serializeFrontmatter(
  frontmatter: RuleFrontmatter,
  content: string,
): string {
  const entries = Object.entries(frontmatter).filter(
    ([, value]) => value !== undefined && value !== "",
  );

  if (entries.length === 0) {
    return content;
  }

  const frontmatterLines = entries.map(([key, value]) => {
    if (typeof value === "boolean") {
      return `${key}: ${value}`;
    }
    return `${key}: ${value}`;
  });

  return `---\n${frontmatterLines.join("\n")}\n---\n${content}`;
}

/**
 * Get display label for frontmatter field
 */
export function getFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    description: "Description",
    globs: "File Patterns (globs)",
    alwaysApply: "Always Apply",
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Get placeholder for frontmatter field
 */
export function getFieldPlaceholder(key: string): string {
  const placeholders: Record<string, string> = {
    description: "Brief description of what this rule does",
    globs: "*.py, **/api/**, src/**/*.ts",
    alwaysApply: "",
  };
  return placeholders[key] || "";
}

