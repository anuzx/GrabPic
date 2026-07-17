import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const plugins: PluginOption[] = [react(), tailwindcss()];

if (process.env.REPL_ID !== undefined) {
  const runtimeErrorOverlay = (await import('@replit/vite-plugin-runtime-error-modal')).default;
  plugins.push(runtimeErrorOverlay());

  if (process.env.NODE_ENV !== 'production') {
    const { cartographer } = await import('@replit/vite-plugin-cartographer');
    plugins.push(cartographer({ root: path.resolve(__dirname) }));
    const { devBanner } = await import('@replit/vite-plugin-dev-banner');
    plugins.push(devBanner());
  }
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
