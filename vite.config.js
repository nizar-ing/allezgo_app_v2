import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const vitePrerender = require('vite-plugin-prerender')
const { PuppeteerRenderer } = require('vite-plugin-prerender')

const apiTarget = process.env.API_TARGET ?? 'https://api.allezgoo.com'

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    plugins: [
        react({
            babel: {
                plugins: [['babel-plugin-react-compiler']],
            },
        }),
        tailwindcss(),
        vitePrerender({
            staticDir: path.join(__dirname, 'dist'),
            routes: ['/', '/voyages-organises', '/omra', '/e-visa'],
            renderer: new PuppeteerRenderer({ renderAfterTime: 2000 }),
        }),
    ],
    server: {
        proxy: {
            '/api': { target: apiTarget, changeOrigin: true, secure: false },
            '/carousel': { target: apiTarget, changeOrigin: true, secure: false },
            '/uploads': { target: apiTarget, changeOrigin: true, secure: false },
        }
    }
})
