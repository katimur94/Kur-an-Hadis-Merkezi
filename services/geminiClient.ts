import { GoogleGenAI } from "@google/genai";

const MODEL_CANDIDATES: readonly string[] = [
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
];

const FALLBACK_MODEL = MODEL_CANDIDATES[1];
const CACHE_KEY = 'dijitalmedrese:gemini-model';
const CACHE_TS_KEY = 'dijitalmedrese:gemini-model-resolved-at';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const GEMINI_MODEL = FALLBACK_MODEL;

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

const readCachedModel = (): string | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        const at = Number(localStorage.getItem(CACHE_TS_KEY) ?? '0');
        if (cached && Date.now() - at < CACHE_TTL_MS) return cached;
    } catch { /* localStorage unavailable (SSR / privacy mode) */ }
    return null;
};

const writeCachedModel = (model: string): void => {
    try {
        localStorage.setItem(CACHE_KEY, model);
        localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
    } catch { /* ignore */ }
};

let resolvedModel: string | null = null;
let resolvingPromise: Promise<string> | null = null;

export const getGeminiModel = async (): Promise<string> => {
    if (resolvedModel) return resolvedModel;

    const cached = readCachedModel();
    if (cached) {
        resolvedModel = cached;
        return cached;
    }

    if (resolvingPromise) return resolvingPromise;

    const client = getGeminiClient();
    if (!client) return FALLBACK_MODEL;

    resolvingPromise = (async () => {
        try {
            const available = new Set<string>();
            const pager: any = await (client.models as any).list();
            // The SDK Pager is async-iterable.
            for await (const entry of pager) {
                const raw = (entry?.name ?? entry?.model ?? '') as string;
                if (raw) available.add(raw.replace(/^models\//, ''));
            }
            const pick = MODEL_CANDIDATES.find(c => available.has(c)) ?? FALLBACK_MODEL;
            resolvedModel = pick;
            writeCachedModel(pick);
            return pick;
        } catch (err) {
            console.warn('[geminiClient] models.list failed, falling back to', FALLBACK_MODEL, err);
            resolvedModel = FALLBACK_MODEL;
            return FALLBACK_MODEL;
        } finally {
            resolvingPromise = null;
        }
    })();

    return resolvingPromise;
};

export const resetGeminiModelCache = (): void => {
    resolvedModel = null;
    try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TS_KEY);
    } catch { /* ignore */ }
};
