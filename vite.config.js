import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages serves the site from https://dssematimba.github.io/journal-app/,
  // so the build (and `vite preview` of it) needs that prefix. The dev server stays at /.
  base: command === 'build' || isPreview ? '/journal-app/' : '/',
  server: { open: true },
}))
