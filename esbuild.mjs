import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const isWatch = process.argv.includes('--watch');

// Helper: copy assets to dist/
function copyAssets() {
  const distAssetsDir = path.join('dist', 'assets');

  if (!fs.existsSync(distAssetsDir)) {
    fs.mkdirSync(distAssetsDir, { recursive: true });
  }

  // Copy PNG icon
  const srcFile = path.join('assets', 'ddd-ai.png');
  const destFile = path.join(distAssetsDir, 'ddd-ai.png');

  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log('  ✓ ddd-ai.png');
  }

  console.log('Assets copied to dist/');
}

const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node12',
  sourcemap: !isProduction,
  minify: isProduction,
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  copyAssets();
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
  copyAssets();
  console.log('Build complete.');
}
