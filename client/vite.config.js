import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        proxy: {
            '/api': {
                target: process.env.VITE_API_TARGET || 'http://localhost:5001',
                changeOrigin: true,
                secure: false,
            },
            '/uploads': {
                target: process.env.VITE_API_TARGET || 'http://localhost:5001',
                changeOrigin: true,
                secure: false,
            },
        },
    },
})
