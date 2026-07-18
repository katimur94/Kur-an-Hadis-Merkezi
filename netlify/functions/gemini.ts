// Serverseitiger Gemini-Proxy: Der API-Key lebt ausschließlich in
// process.env.GEMINI_API_KEY und landet nie im Client-Bundle.
// Aufruf vom Client: POST /.netlify/functions/gemini
//   { model, contents, config }  → { text }
//   { action: "resolveModel" }   → { model }
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

// Netlify Functions akzeptieren ~6 MB Payload; etwas Puffer für Header/JSON-Overhead lassen.
const MAX_BODY_BYTES = 5.5 * 1024 * 1024;

const jsonResponse = (status: number, data: unknown, extraHeaders: Record<string, string> = {}): Response =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...extraHeaders },
    });

// CORS auf die eigene Origin beschränken. Same-Origin-Requests des SPA-Bundles
// laufen ohnehin gegen denselben Host; alles andere wird abgewiesen.
const getAllowedOrigin = (req: Request): string | null => {
    const origin = req.headers.get('origin');
    if (!origin) return null; // kein Origin-Header (same-origin GET/POST, curl) → kein CORS nötig
    let originHost: string;
    try { originHost = new URL(origin).host; } catch { return null; }
    const requestHost = req.headers.get('host');
    if (requestHost && originHost === requestHost) return origin;
    const configured = [process.env.ALLOWED_ORIGIN, process.env.URL, process.env.DEPLOY_PRIME_URL]
        .filter((v): v is string => !!v);
    for (const entry of configured) {
        try { if (new URL(entry).host === originHost) return origin; } catch { /* ignore */ }
    }
    return null;
};

export default async (req: Request): Promise<Response> => {
    const origin = req.headers.get('origin');
    const allowedOrigin = getAllowedOrigin(req);
    const corsHeaders: Record<string, string> = allowedOrigin
        ? {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Vary': 'Origin',
        }
        : {};

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: allowedOrigin || !origin ? 204 : 403, headers: corsHeaders });
    }
    if (req.method !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' }, corsHeaders);
    }
    if (origin && !allowedOrigin) {
        return jsonResponse(403, { error: 'Forbidden origin' }, corsHeaders);
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        return jsonResponse(500, { error: 'GEMINI_API_KEY sunucuda yapılandırılmamış.' }, corsHeaders);
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_BODY_BYTES) {
        return jsonResponse(413, {
            error: 'İstek çok büyük: ses kaydı sunucu limitini (yaklaşık 6 MB) aşıyor. Lütfen daha kısa bir kayıtla tekrar deneyin.',
        }, corsHeaders);
    }

    let body: any;
    try { body = JSON.parse(rawBody); } catch {
        return jsonResponse(400, { error: 'Invalid JSON body' }, corsHeaders);
    }

    const ai = new GoogleGenAI({ apiKey });

    if (body?.action === 'resolveModel') {
        try {
            const available = new Set<string>();
            const pager: any = await (ai.models as any).list();
            for await (const entry of pager) {
                const name = (entry?.name ?? entry?.model ?? '') as string;
                if (name) available.add(name.replace(/^models\//, ''));
            }
            const model = MODEL_CANDIDATES.find(c => available.has(c)) ?? FALLBACK_MODEL;
            return jsonResponse(200, { model }, corsHeaders);
        } catch (err) {
            console.warn('[gemini fn] models.list failed, falling back to', FALLBACK_MODEL, err);
            return jsonResponse(200, { model: FALLBACK_MODEL }, corsHeaders);
        }
    }

    const { model, contents, config } = body ?? {};
    if (typeof model !== 'string' || !model || contents === undefined || contents === null) {
        return jsonResponse(400, { error: '"model" ve "contents" alanları zorunludur.' }, corsHeaders);
    }

    try {
        const response = await ai.models.generateContent({ model, contents, config });
        return jsonResponse(200, { text: response.text ?? '' }, corsHeaders);
    } catch (err: any) {
        console.error('[gemini fn] generateContent failed', err);
        const message = typeof err?.message === 'string' ? err.message : 'Gemini isteği başarısız oldu.';
        return jsonResponse(502, { error: message }, corsHeaders);
    }
};
