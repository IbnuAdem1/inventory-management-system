const { spawn, spawnSync } = require("child_process");
const path = require("path");
const rootDir = path.resolve(__dirname, "..");
const npmBin = "npx";

function startProcess(command, args, options = {}) {
  return spawn(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
    ...options,
  });
}

function shutdown(code = 0, children = []) {
  for (const child of children) {
    if (child && !child.killed) {
      child.kill("SIGINT");
    }
  }
  setTimeout(() => process.exit(code), 250).unref();
}

const build = spawnSync(npmBin, ["tsc"], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const tscWatch = startProcess(npmBin, ["tsc", "-w", "--preserveWatchOutput"]);
const nodeWatch = startProcess("node", ["--watch", "dist/index.js"]);
const children = [tscWatch, nodeWatch];

process.on("SIGINT", () => shutdown(0, children));
process.on("SIGTERM", () => shutdown(0, children));

tscWatch.on("exit", (code) => {
  if (code && code !== 0) {
    shutdown(code, [nodeWatch]);
  }
});

nodeWatch.on("exit", (code) => {
  if (code && code !== 0) {
    shutdown(code, [tscWatch]);
  }
});