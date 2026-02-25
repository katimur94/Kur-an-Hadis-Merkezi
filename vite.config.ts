import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'path';

export default defineConfig({
    plugins: [tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        }
    }
});
