import { createRequire } from 'module';
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { defineConfig } from 'rollup';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// Check for debug flag from environment
const isDebug =
  process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Debug plugin: replaces __DEBUG__ at build time
const debugPlugin = () => ({
  name: 'debug-plugin',
  renderChunk(code) {
    return code.replace(/__DEBUG__/g, isDebug.toString());
  },
});

// Base configuration shared across all builds
const baseConfig = {
  input: 'src/index.ts',
  external: [], // No external dependencies to keep SDK self-contained
};

// Plugins configuration
const getPlugins = (format, minify = false) => {
  const plugins = [
    typescript({
      tsconfig: './tsconfig.json',
      clean: true,
      declaration: format === 'cjs',
    }),
    nodeResolve({
      preferBuiltins: false,
      browser: true,
      extensions: ['.js', '.ts'],
    }),
    commonjs(),
    debugPlugin(),
  ];

  if (minify && isProduction) {
    plugins.push(
      terser({
        compress: {
          drop_console: false,
          drop_debugger: !isDebug,
          pure_funcs: isDebug
            ? []
            : ['console.log', 'console.debug', 'console.info'],
        },
        format: {
          comments: false,
        },
        mangle: {
          properties: {
            regex: /^_/,
          },
        },
      })
    );
  }

  plugins.push(filesize());

  return plugins;
};

export default defineConfig([
  // ESM build for modern bundlers (minified in production)
  {
    ...baseConfig,
    output: {
      file: 'dist/iframe-sdk-core.esm.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true,
      banner: `/* iframe-sdk-core v${pkg.version} ESM - ${isDebug ? 'DEBUG' : 'PRODUCTION'} */`,
    },
    plugins: getPlugins('esm', true),
  },

  // CJS build for Node.js (minified in production)
  {
    ...baseConfig,
    output: {
      file: 'dist/iframe-sdk-core.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      inlineDynamicImports: true,
      banner: `/* iframe-sdk-core v${pkg.version} CJS - ${isDebug ? 'DEBUG' : 'PRODUCTION'} */`,
    },
    plugins: getPlugins('cjs', true),
  },
]);
