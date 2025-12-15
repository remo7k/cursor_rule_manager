import type { DocsSourceConfig } from "./types";

/**
 * React documentation scraper configuration
 * Source: https://github.com/reactjs/react.dev
 */
export const reactConfig: DocsSourceConfig = {
  id: "react",
  name: "React",
  owner: "reactjs",
  repo: "react.dev",
  branch: "main",
  docsPath: "src/content",
  defaultGlobs: "*.jsx, *.tsx, *.js, *.ts",
  extensions: [".md", ".mdx"],
  globMappings: [
    // Learn section
    { pattern: "learn", globs: "*.jsx, *.tsx, *.js, *.ts" },
    // Reference section
    { pattern: "reference/react", globs: "*.jsx, *.tsx" },
    { pattern: "reference/react-dom", globs: "*.jsx, *.tsx" },
    { pattern: "reference/rules", globs: "*.jsx, *.tsx" },
    // Hooks
    { pattern: "use", globs: "*.jsx, *.tsx" },
    { pattern: "useState", globs: "*.jsx, *.tsx" },
    { pattern: "useEffect", globs: "*.jsx, *.tsx" },
    { pattern: "useContext", globs: "*.jsx, *.tsx" },
    { pattern: "useReducer", globs: "*.jsx, *.tsx" },
    { pattern: "useCallback", globs: "*.jsx, *.tsx" },
    { pattern: "useMemo", globs: "*.jsx, *.tsx" },
    { pattern: "useRef", globs: "*.jsx, *.tsx" },
    // Components
    { pattern: "components", globs: "*.jsx, *.tsx" },
    // Server components
    { pattern: "server", globs: "*.jsx, *.tsx" },
  ],
};

