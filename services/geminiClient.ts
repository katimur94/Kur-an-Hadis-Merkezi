import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = 'gemini-3.1-flash-lite';

export const getGeminiApiKey = (): string => {
    const viteKey = import.meta.env?.VITE_API_KEY;
    if (typeof viteKey === 'string' && viteKey.length > 0) {
        return viteKey;
    }

    try {
        // @ts-ignore — `process.env.*` is statically replaced by Vite's `define` at build time.
        const procApi = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
        if (typeof procApi === 'string' && procApi.length > 0) return procApi;
    } catch { /* process is not defined in the browser bundle */ }

    try {
        // @ts-ignore — see above
        const procGemini = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
        if (typeof procGemini === 'string' && procGemini.length > 0) return procGemini;
    } catch { /* idem */ }

    return '';
};

export const hasGeminiApiKey = (): boolean => getGeminiApiKey().length > 0;

let cachedClient: GoogleGenAI | null = null;

export const getGeminiClient = (): GoogleGenAI | null => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) return null;
    if (!cachedClient) {
        cachedClient = new GoogleGenAI({ apiKey });
    }
    return cachedClient;
};
