import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    ],
    server: {
        proxy: {
            '/api': {
                target: 'https://api.allezgoo.com',
                changeOrigin: true,
                secure: false,
            },
            '/carousel': {
                target: 'https://api.allezgoo.com',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
