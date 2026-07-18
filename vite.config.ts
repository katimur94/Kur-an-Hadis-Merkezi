import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'path';

// Der Gemini-API-Key wird NICHT mehr ins Bundle gebaked — alle KI-Aufrufe
// laufen über die Netlify Function unter netlify/functions/gemini.ts.
export default defineConfig({
    plugins: [tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        }
    },
});
