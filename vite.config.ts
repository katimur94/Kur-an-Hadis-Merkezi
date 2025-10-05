import { defineConfig, loadEnv } from 'vite';
import * as path from 'path'; // 👈 KORREKT: 'path' wird jetzt als Modul importiert.

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
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
