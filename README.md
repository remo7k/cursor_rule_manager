# Cursor Rule Manager

A VS Code extension for Cursor that provides a visual interface to manage AI context rules and documentation. Instead of hunting through multiple rule locations, you get a unified GUI to view, create, and organize rules from all sources.

## Why Use This?

When working with Cursor AI, context rules can come from multiple places:

- A `.cursorrules` file in your project root
- Individual rule files in `.cursor/rules/`
- Global rules in `~/.cursor/rules/`
- Documentation you want the AI to reference

This extension gives you a single dashboard to see everything and manage what's active.

## Features

- **Unified Rules Overview**: See ALL rules affecting your project from every source in one place
- **Rules Manager**: Create, edit, and delete custom project rules with frontmatter support
- **GitHub Docs Scraper**: Download documentation directly from any GitHub repo folder as rules
- **Live Preview**: Preview rule content

## Installation

### Quick Install (Recommended for Team Members)

1. **Get the `.vsix` file** from the team (or build it yourself - see below)

2. **Install in Cursor**:
   - Open Cursor
   - Go to Extensions (⌘+Shift+X on Mac, Ctrl+Shift+X on Windows/Linux)
   - Click the `...` menu in the top-right of the Extensions panel
   - Select **"Install from VSIX..."**
   - Choose the `.vsix` file

3. **Verify installation**: You should see a "Rule Manager" icon (⚖) in the activity bar on the left

### Building the VSIX Yourself

**Prerequisites:**

- [Node.js](https://nodejs.org/) v18+
- [Bun](https://bun.sh) runtime

```bash
# Clone the repo
git clone https://github.com/o7k/rule-manager.git
cd rule-manager

# Install dependencies
npm install
cd webview-ui && bun install && cd ..

# Build and package
npm run package
```

This creates `cursor-rule-manager-0.1.0.vsix` in the project root. Share this file with your team.

## Usage

1. **Open any project** in Cursor

2. **Click the Rule Manager icon** (⚖) in the activity bar (left sidebar)

3. **Navigate the tabs**:
   - **Manager**: See all rules, toggle docs/rules on/off
   - **Preview**: View rule content

4. **Add custom rules** by creating `.md` files in `.cursor/rules/`

## Scraping Docs from GitHub

You can import documentation directly from any GitHub repository:

1. **Use a pre-configured source** — Built-in support for Svelte, React, Next.js, and TypeScript docs

2. **Use any GitHub URL** — Paste a link to any folder in a GitHub repo:

   ```
   https://github.com/owner/repo/tree/branch/path/to/docs
   ```

   The extension will recursively download all `.md` and `.mdx` files from that folder and add them as rules.

**Example:** To import Prisma docs, paste:

```
https://github.com/prisma/docs/tree/main/content
```

**Note:** For large repos, you may want to log in to GitHub (Command Palette → "Rule Manager: Login to GitHub") to get higher API rate limits (5000 requests/hour vs 60).

## Project Structure (In Your Projects)

When using this extension, your projects can have this structure:

```
your-project/
├── .cursor/
│   ├── rules/          # Project-specific rules
│   │   ├── typescript.md
│   │   └── testing.md
│   └── config.json     # Toggle state (auto-managed by extension)
└── .cursorrules        # Your project rules
```

## Development

For contributors working on the extension itself:

```bash
# Install dependencies
npm install
cd webview-ui && bun install && cd ..

# Build everything
npm run build

# Watch mode for development
npm run watch

# Launch extension in debug mode
# Press F5 in VS Code/Cursor

# Other commands
npm run typecheck    # Type checking
npm run lint         # Lint code
npm run format       # Format code
npm run clean        # Clean build artifacts
npm run package      # Create .vsix file
```

## Tech Stack

- **Extension**: TypeScript + VS Code API + esbuild
- **Webview UI**: Svelte + Tailwind CSS
- **Runtime**: Bun (webview build) + Node (extension)
- **Tooling**: ESLint + Prettier + TypeScript

## License

MIT
