import { spawn } from "bun";
import { join } from "path";
import { mkdir, watch } from "fs/promises";
import * as esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";

const isWatch = process.argv.includes("--watch");

async function buildCSS(): Promise<void> {
  const tailwindBin = join(
    import.meta.dir,
    "node_modules",
    ".bin",
    "tailwindcss",
  );

  const proc = spawn({
    cmd: [
      tailwindBin,
      "-i",
      "src/index.css",
      "-o",
      "dist/assets/index.css",
      "--minify",
    ],
    cwd: import.meta.dir,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Tailwind build failed with exit code ${exitCode}`);
  }

  console.log("✓ CSS bundled");
}

async function buildJS(): Promise<void> {
  try {
    await esbuild.build({
      entryPoints: [join(import.meta.dir, "src/main.ts")],
      outdir: join(import.meta.dir, "dist/assets"),
      bundle: true,
      minify: !isWatch,
      format: "esm",
      target: "es2020",
      conditions: ["svelte", "browser"],
      define: {
        "process.env.NODE_ENV": isWatch ? '"development"' : '"production"',
      },
      plugins: [
        sveltePlugin({
          preprocess: sveltePreprocess(),
          compilerOptions: {
            dev: isWatch,
          },
        }),
      ],
      logLevel: "info",
    });

    console.log("✓ JavaScript bundled");
  } catch (error) {
    console.error("Build failed:", error);
    if (!isWatch) {
      process.exit(1);
    }
  }
}

async function copyHTML(): Promise<void> {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="assets/index.css" />
    <title>Rule Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="assets/main.js"></script>
  </body>
</html>`;

  await Bun.write(join(import.meta.dir, "dist/index.html"), html);
  console.log("✓ HTML generated");
}

async function ensureDistDir(): Promise<void> {
  await mkdir(join(import.meta.dir, "dist", "assets"), { recursive: true });
}

async function build(): Promise<void> {
  console.log(
    isWatch ? "Building webview (watch mode)..." : "Building webview...",
  );

  await ensureDistDir();
  await Promise.all([buildCSS(), buildJS(), copyHTML()]);

  console.log("✓ Build complete");
}

async function watchMode(): Promise<void> {
  // Initial build
  await build();

  console.log("\n👀 Watching for changes... (Press Ctrl+C to stop)\n");

  const srcDir = join(import.meta.dir, "src");

  // Use fs.watch for file changes
  const watcher = watch(srcDir, { recursive: true });

  let debounceTimer: Timer | null = null;

  for await (const event of watcher) {
    if (event.filename) {
      // Debounce rebuilds
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(async () => {
        console.log(`\n📝 Changed: ${event.filename}`);
        try {
          if (event.filename.endsWith(".css")) {
            await buildCSS();
          } else if (
            event.filename.endsWith(".svelte") ||
            event.filename.endsWith(".ts")
          ) {
            await buildJS();
          }
          console.log(
            "✓ Rebuild complete - reload window to see changes (Cmd+R)\n",
          );
        } catch (error) {
          console.error("Rebuild failed:", error);
        }
      }, 100);
    }
  }
}

if (isWatch) {
  await watchMode();
} else {
  await build();
}
