import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from './package.json';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/forgediagram/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      optimizeDeps: {
        include: ['mermaid', 'cytoscape'],
      },
      build: {
        commonjsOptions: {
          include: [/node_modules/],
          transformMixedEsModules: true,
        },
        rollupOptions: {
          onwarn(warning, warn) {
            if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
            warn(warning);
          },
        },
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        '__APP_VERSION__': JSON.stringify(packageJson.version),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'cytoscape/dist/cytoscape.umd.js': path.resolve(__dirname, 'node_modules/cytoscape/dist/cytoscape.esm.mjs'),
          'cytoscape/dist/cytoscape.esm.min.js': path.resolve(__dirname, 'node_modules/cytoscape/dist/cytoscape.esm.min.mjs'),
        }
      }
    };
});
