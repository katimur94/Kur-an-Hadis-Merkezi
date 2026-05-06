import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'path'; // 👈 KORREKT: 'path' wird jetzt als Modul importiert.

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = env.VITE_API_KEY || env.GEMINI_API_KEY || env.API_KEY || '';
    return {
        plugins: [tailwindcss()],
        define: {
            'process.env.API_KEY': JSON.stringify(apiKey),
            'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
        // 👇 WICHTIGE LÖSUNG FÜR DEN ROLLUP-FEHLER
        build: {
            rollupOptions: {
                external: ['pako']
            }
        }
    };
});
