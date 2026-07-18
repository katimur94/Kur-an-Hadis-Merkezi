// Gemini-Zugriff läuft ausschließlich über die Netlify Function
// /.netlify/functions/gemini — der API-Key liegt nur serverseitig
// (process.env.GEMINI_API_KEY) und ist nicht mehr im Client-Bundle.

const PROXY_ENDPOINT = '/.netlify/functions/gemini';

const FALLBACK_MODEL = 'gemini-3.1-flash-lite-preview';
const CACHE_KEY = 'dijitalmedrese:gemini-model';
const CACHE_TS_KEY = 'dijitalmedrese:gemini-model-resolved-at';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const GEMINI_MODEL = FALLBACK_MODEL;

export interface GenerateContentRequest {
    model: string;
    contents: unknown;
    config?: unknown;
}

export interface GenerateContentProxyResponse {
    text: string;
}

/** Ruft die Gemini-API über den serverseitigen Netlify-Proxy auf. */
export const generateViaProxy = async (request: GenerateContentRequest): Promise<GenerateContentProxyResponse> => {
    let res: Response;
    try {
        res = await fetch(PROXY_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
    } catch (err) {
        throw new Error('Yapay zekâ servisine ulaşılamadı. İnternet bağlantınızı kontrol edin.');
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        throw new Error((data && typeof data.error === 'string' && data.error) || `Gemini proxy hatası (HTTP ${res.status})`);
    }
    return { text: typeof data?.text === 'string' ? data.text : '' };
};

// Gleiche Aufruf-Form wie der bisherige GoogleGenAI-Client
// (ai.models.generateContent(...) → { text }), damit alle Aufrufstellen
// (FiqhChat, IlmiArastirma, MoodAyahModal, …) unverändert funktionieren.
export interface GeminiProxyClient {
    models: {
        generateContent: (request: GenerateContentRequest) => Promise<GenerateContentProxyResponse>;
    };
}

const proxyClient: GeminiProxyClient = {
    models: {
        generateContent: generateViaProxy,
    },
};

export const getGeminiClient = (): GeminiProxyClient => proxyClient;

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

    resolvingPromise = (async () => {
        try {
            const res = await fetch(PROXY_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'resolveModel' }),
            });
            const data = await res.json().catch(() => null);
            const pick = res.ok && typeof data?.model === 'string' && data.model ? data.model : FALLBACK_MODEL;
            resolvedModel = pick;
            writeCachedModel(pick);
            return pick;
        } catch (err) {
            console.warn('[geminiClient] resolveModel failed, falling back to', FALLBACK_MODEL, err);
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
