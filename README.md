# Cursor Rule Manager

A VS Code extension for Cursor that provides a GUI to manage documentation and rules. View, create, and organize rules from all sources in one place.

## Features

- **Rules Overview**: View ALL rules affecting your project from:
  - `.cursorrules` file in project root
  - `.cursor/rules/` directory (project-level)
  - `~/.cursor/rules/` (global Cursor rules)
  
- **Docs Manager**: Toggle documentation files to include in generated rules
- **Rules Manager**: Create, edit, and delete custom project rules
- **Generate**: Combine enabled docs and rules into a single `.cursorrules` file

## Installation

### Development

1. Clone this repository
2. Install [Bun](https://bun.sh) if you don't have it:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```
3. Install dependencies:
   ```bash
   bun install
   cd webview-ui && bun install && cd ..
   ```
4. Build:
   ```bash
   bun run build
   ```
5. Press F5 in VS Code/Cursor to launch the extension in debug mode

### From VSIX

1. Run `bun run package` to create a `.vsix` file
2. In Cursor: Extensions → ... → Install from VSIX

## Usage

1. Open a project in Cursor
2. Click the "Rule Manager" icon in the activity bar (sidebar)
3. Use the tabs to navigate:
   - **Overview**: See all rules affecting your project
   - **Docs**: Toggle documentation files (add `.md` files to `.cursor/docs/`)
   - **Rules**: Create and manage project-specific rules
4. Click "Generate" to create/update your `.cursorrules` file

## Project Structure

```
your-project/
├── .cursor/
│   ├── docs/           # Add scraped documentation here
│   │   ├── nextjs-15.md
│   │   └── prisma.md
│   ├── rules/          # Project-specific rules
│   │   ├── typescript.md
│   │   └── testing.md
│   └── config.json     # Toggle state (auto-managed)
└── .cursorrules        # Generated from enabled docs/rules
```

## Development

```bash
# Install dependencies
bun install
cd webview-ui && bun install && cd ..

# Build everything
bun run build

# Watch mode (extension only)
bun run watch

# Type checking
bun run typecheck

# Lint
bun run lint

# Format code
bun run format

# Clean build artifacts
bun run clean

# Package as VSIX
bun run package
```

## Tech Stack

- **Extension**: TypeScript + VS Code API + esbuild
- **Webview UI**: React 18 + Tailwind CSS
- **Bundler**: Bun (webview) + esbuild (extension)
- **Tooling**: ESLint + Prettier + TypeScript

## License

MIT
