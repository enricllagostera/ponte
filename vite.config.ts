import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const file = fileURLToPath(new URL('package.json', import.meta.url))
const json = readFileSync(file, 'utf8')
const pkg = JSON.parse(json)

console.log(pkg.version)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()]
})
