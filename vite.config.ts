import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [
        react()
    ],
    server: {
        proxy: {
            logLevel: 'debug',
            '/api': {
                target: 'http://localhost:31337',
                changeOrigin: true,
                secure: false
            }
        }
    }
})