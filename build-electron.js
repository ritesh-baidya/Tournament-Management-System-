const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

async function build() {
  const outDir = path.join(__dirname, 'dist-electron');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Copy sql-wasm.wasm to dist-electron
  const wasmSrc = path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  const wasmDest = path.join(outDir, 'sql-wasm.wasm');
  if (fs.existsSync(wasmSrc)) {
    fs.copyFileSync(wasmSrc, wasmDest);
    console.log('✓ Copied sql-wasm.wasm to dist-electron');
  }

  const commonConfig = {
    bundle: true,
    platform: 'node',
    target: 'node20',
    sourcemap: true,
    external: ['electron', 'discord.js', 'xlsx'],
    format: 'cjs',
  };

  const mainConfig = {
    ...commonConfig,
    entryPoints: [path.join(__dirname, 'electron', 'main.ts')],
    outfile: path.join(outDir, 'main.cjs'),
  };

  const preloadConfig = {
    ...commonConfig,
    entryPoints: [path.join(__dirname, 'electron', 'preload.ts')],
    outfile: path.join(outDir, 'preload.cjs'),
  };

  if (isWatch) {
    const ctxMain = await esbuild.context(mainConfig);
    const ctxPreload = await esbuild.context(preloadConfig);
    await ctxMain.watch();
    await ctxPreload.watch();
    console.log('Watching electron main & preload files...');
  } else {
    await esbuild.build(mainConfig);
    await esbuild.build(preloadConfig);
    console.log('✓ Built electron main & preload successfully');
  }
}

build().catch((err) => {
  console.error('Electron build failed:', err);
  process.exit(1);
});
