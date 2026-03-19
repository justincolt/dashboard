import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const commitCount = execSync('git rev-list --count HEAD').toString().trim()

export default defineConfig({
  plugins: [react()],
  base: '/dashboard/',
  build: {
    outDir: 'docs',
  },
  define: {
    __GIT_VERSION__: JSON.stringify(commitCount),
  },
})
