import { useCallback, useEffect, useRef, useState } from 'react';
import { generateViaProxy, getGeminiModel } from '../services/geminiClient';

// --- Web Speech API type definitions (not part of lib.dom) ---
interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
    start: () => void;
    stop: () => void;
    abort?: () => void;
}
interface SpeechRecognitionEventLike extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionResultListLike {
    readonly length: number;
    item(index: number): SpeechRecognitionResultLike;
    [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionResultLike {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternativeLike;
    [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionAlternativeLike {
    readonly transcript: string;
    readonly confidence: number;
}
interface SpeechRecognitionErrorEventLike extends Event {
    readonly error: string;
    readonly message: string;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

// App.tsx deklariert Window.SpeechRecognition bereits global — hier deshalb nur per Cast zugreifen.
const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | undefined => {
    if (typeof window === 'undefined') return undefined;
    const w = window as any;
    return (w.SpeechRecognition || w.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;
};

export type RecognitionStopReason = 'stopped' | 'error' | 'maxDuration';

export interface RecordedAudio {
    blob: Blob;
    mimeType: string;
}

export interface UseRecitationRecognitionOptions {
    lang?: string;
    /** Maximale Aufnahmedauer in ms (Standard: 5 Minuten). */
    maxDurationMs?: number;
    /** Wird genau einmal aufgerufen, wenn die Aufnahme endgültig beendet wurde. */
    onStop?: (reason: RecognitionStopReason) => void;
}

export interface UseRecitationRecognitionResult {
    /** Finale + Interim-Segmente kombiniert. */
    transcript: string;
    finalTranscript: string;
    interimTranscript: string;
    isRecording: boolean;
    error: string | null;
    isSupported: boolean;
    /** Startet Erkennung + Audio-Aufnahme. Liefert false, wenn nicht unterstützt. */
    start: () => boolean;
    /** Beendet Intent, Erkennung, Audio-Aufnahme und Wake Lock. Idempotent. */
    stop: () => void;
    /** Aufgenommenes Audio der letzten Session (nach stop verfügbar). */
    getAudio: () => RecordedAudio | null;
    clearAudio: () => void;
}

const DEFAULT_MAX_DURATION_MS = 5 * 60 * 1000;
const RESTART_THROTTLE_MS = 300;
const MAX_CONSECUTIVE_RESTARTS = 5;
// Endet eine Recognition-Session schneller als das nach dem Start, zählt sie
// als Fehlschlag; längere Sessions (normale Android-Pausenzyklen) nicht.
const FAST_FAIL_MS = 1500;
// Echte Fehler-Codes der Web Speech API, bei denen ein Weitermachen sinnlos ist.
const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture']);
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];

// Auf Android ist die Web Speech API unbrauchbar: Chrome emuliert den Dauer-Modus,
// indem es den nativen Android-Erkenner nach jedem Ergebnis neu startet — mit
// Systemton bei jedem Start und Audio-Lücken mitten im Satz
// (https://issues.chromium.org/issues/40324711). Außerdem blockieren sich
// getUserMedia und die Erkennung gegenseitig (https://issues.chromium.org/issues/41083534).
// Deshalb läuft die Erkennung auf Android über unseren Gemini-Proxy: der
// MediaRecorder nimmt unterbrechungsfrei auf (kein Ton, keine Lücken) und kurze
// Segmente werden serverseitig transkribiert.
const IS_ANDROID = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
const USE_CLOUD_STT = IS_ANDROID;
// ~5s-Segmente ≈ 12 Anfragen/Minute — bleibt unter den Free-Tier-Limits von Flash-Lite.
const CLOUD_CHUNK_MS = 5000;
// Segmente unterhalb dieser Größe (praktisch leere Container) gar nicht erst hochladen.
const MIN_CHUNK_BYTES = 2000;

const TRANSCRIBE_PROMPT = 'Bu ses kaydında Kur\'an tilaveti (Arapça) duyuluyor. Görevin: SADECE duyduğun Arapça kelimeleri, duyduğun sırayla, HAREKESİZ olarak Arap harfleriyle yazmak. Açıklama, çeviri, noktalama veya başka hiçbir şey ekleme. Konuşma duymuyorsan tamamen boş yanıt ver.';

/** Hängt ein finales Segment an; identische Suffixe werden dedupliziert (Android liefert Results teils doppelt). */
const appendFinalSegment = (accumulated: string, segment: string): string => {
    const seg = segment.trim();
    if (!seg) return accumulated;
    const prev = accumulated.trim();
    if (!prev) return seg;
    if (prev === seg || prev.endsWith(' ' + seg)) return prev;
    return prev + ' ' + seg;
};

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Ses verisi okunamadı.'));
    reader.readAsDataURL(blob);
});

const pickSupportedMime = (): string | undefined => {
    if (typeof MediaRecorder === 'undefined') return undefined;
    return MIME_CANDIDATES.find(m => {
        try { return MediaRecorder.isTypeSupported(m); } catch { return false; }
    });
};

export const useRecitationRecognition = (options: UseRecitationRecognitionOptions = {}): UseRecitationRecognitionResult => {
    const { lang = 'ar-SA', maxDurationMs = DEFAULT_MAX_DURATION_MS } = options;

    const [finalTranscript, setFinalTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSupported = USE_CLOUD_STT
        ? typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
        : !!getSpeechRecognitionConstructor();

    const onStopRef = useRef(options.onStop);
    onStopRef.current = options.onStop;

    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const intentRef = useRef(false);
    const sessionActiveRef = useRef(false);
    const finalTranscriptRef = useRef('');
    const restartCountRef = useRef(0);
    const lastRestartAtRef = useRef(0);
    const lastStartAtRef = useRef(0);
    const restartTimerRef = useRef<number | null>(null);
    const maxDurationTimerRef = useRef<number | null>(null);
    const wakeLockRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioBlobRef = useRef<RecordedAudio | null>(null);
    const audioMimeRef = useRef('');
    // Cloud-STT (Android)
    const chunkRecorderRef = useRef<MediaRecorder | null>(null);
    const chunkStreamRef = useRef<MediaStream | null>(null);
    const chunkTimerRef = useRef<number | null>(null);
    const transcribeChainRef = useRef<Promise<void>>(Promise.resolve());
    const cloudFailStreakRef = useRef(0);

    const releaseWakeLock = useCallback(() => {
        const lock = wakeLockRef.current;
        wakeLockRef.current = null;
        if (lock) {
            try { lock.release().catch(() => { }); } catch { /* ignore */ }
        }
    }, []);

    const requestWakeLock = useCallback(async () => {
        try {
            const wakeLock = (navigator as any).wakeLock;
            if (wakeLock?.request) {
                wakeLockRef.current = await wakeLock.request('screen');
            }
        } catch { /* Wake Lock nicht verfügbar (z. B. ältere Browser, Energiesparmodus) */ }
    }, []);

    const stopMediaRecorder = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        mediaRecorderRef.current = null;
        if (recorder && recorder.state !== 'inactive') {
            try { recorder.stop(); } catch { /* ignore */ }
        } else {
            mediaStreamRef.current?.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
        }
    }, []);

    /** Durchgehende Aufnahme der ganzen Session — liefert das Audio für die Analyse. */
    const startContinuousRecorder = useCallback((stream: MediaStream) => {
        try {
            const mime = pickSupportedMime();
            const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
            audioMimeRef.current = recorder.mimeType || mime || 'audio/webm';
            audioChunksRef.current = [];
            audioBlobRef.current = null;
            recorder.ondataavailable = (e: BlobEvent) => {
                if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            recorder.onstop = () => {
                if (audioChunksRef.current.length > 0) {
                    audioBlobRef.current = {
                        blob: new Blob(audioChunksRef.current, { type: audioMimeRef.current }),
                        mimeType: audioMimeRef.current,
                    };
                }
                mediaStreamRef.current?.getTracks().forEach(t => t.stop());
                mediaStreamRef.current = null;
            };
            recorder.start(1000);
            mediaRecorderRef.current = recorder;
        } catch (e) {
            console.warn('MediaRecorder konnte nicht gestartet werden — Analyse fällt auf Text zurück.', e);
        }
    }, []);

    const startMediaRecorder = useCallback(async () => {
        if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!sessionActiveRef.current) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            mediaStreamRef.current = stream;
            startContinuousRecorder(stream);
        } catch (e) {
            console.warn('Mikrofon-Stream nicht verfügbar — Analyse fällt auf Text zurück.', e);
        }
    }, [startContinuousRecorder]);

    // --- Cloud-STT (Android): Audio-Segmente über den Gemini-Proxy transkribieren ---

    const enqueueTranscription = useCallback((blob: Blob) => {
        transcribeChainRef.current = transcribeChainRef.current.then(async () => {
            if (!sessionActiveRef.current) return;
            try {
                const base64 = await blobToBase64(blob);
                const model = await getGeminiModel();
                const { text } = await generateViaProxy({
                    model,
                    contents: {
                        parts: [
                            { inlineData: { mimeType: (blob.type || 'audio/webm').split(';')[0], data: base64 } },
                            { text: TRANSCRIBE_PROMPT },
                        ],
                    },
                    config: { temperature: 0 },
                });
                cloudFailStreakRef.current = 0;
                // Nur arabische Zeichen übernehmen — schützt vor erklärendem Text des Modells.
                const clean = (text || '').replace(/[^\u0600-\u06FF\s]/g, ' ').replace(/\s+/g, ' ').trim();
                if (clean && sessionActiveRef.current) {
                    finalTranscriptRef.current = appendFinalSegment(finalTranscriptRef.current, clean);
                    setFinalTranscript(finalTranscriptRef.current);
                }
            } catch (e) {
                cloudFailStreakRef.current += 1;
                console.warn('Transkriptions-Segment fehlgeschlagen', e);
                if (cloudFailStreakRef.current === 3) {
                    // Nicht abbrechen (Audio läuft weiter und die Analyse bleibt möglich),
                    // aber den Nutzer informieren, dass die Live-Färbung hakt.
                    setError('Canlı tanıma şu anda yanıt vermiyor (bağlantı/kota). Kayıt devam ediyor, analiz yine de yapılabilir.');
                }
            }
        });
    }, []);

    const stopCloudStt = useCallback(() => {
        if (chunkTimerRef.current !== null) { clearTimeout(chunkTimerRef.current); chunkTimerRef.current = null; }
        const recorder = chunkRecorderRef.current;
        chunkRecorderRef.current = null;
        if (recorder && recorder.state !== 'inactive') {
            try { recorder.stop(); } catch { /* ignore */ }
        }
        chunkStreamRef.current?.getTracks().forEach(t => t.stop());
        chunkStreamRef.current = null;
    }, []);

    const startCloudSegmentLoop = useCallback((stream: MediaStream) => {
        const mime = pickSupportedMime();
        const runSegment = () => {
            if (!sessionActiveRef.current) return;
            let segmentChunks: Blob[] = [];
            let recorder: MediaRecorder;
            try {
                recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
            } catch (e) {
                console.error('Segment-Recorder konnte nicht erstellt werden', e);
                return;
            }
            chunkRecorderRef.current = recorder;
            recorder.ondataavailable = (e: BlobEvent) => {
                if (e.data && e.data.size > 0) segmentChunks.push(e.data);
            };
            recorder.onstop = () => {
                const blob = new Blob(segmentChunks, { type: recorder.mimeType || mime || 'audio/webm' });
                segmentChunks = [];
                if (blob.size >= MIN_CHUNK_BYTES) enqueueTranscription(blob);
                // Nahtlos das nächste Segment starten, solange die Session läuft.
                runSegment();
            };
            try { recorder.start(); } catch (e) { console.error('Segment-Recorder start fehlgeschlagen', e); return; }
            chunkTimerRef.current = window.setTimeout(() => {
                chunkTimerRef.current = null;
                try { if (recorder.state !== 'inactive') recorder.stop(); } catch { /* ignore */ }
            }, CLOUD_CHUNK_MS);
        };
        runSegment();
    }, [enqueueTranscription]);

    const finalizeStop = useCallback((reason: RecognitionStopReason, notify: boolean = true) => {
        if (!sessionActiveRef.current) return;
        sessionActiveRef.current = false;
        intentRef.current = false;
        if (restartTimerRef.current !== null) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
        if (maxDurationTimerRef.current !== null) { clearTimeout(maxDurationTimerRef.current); maxDurationTimerRef.current = null; }
        releaseWakeLock();
        stopCloudStt();
        stopMediaRecorder();
        const rec = recognitionRef.current;
        if (rec) {
            try { rec.stop(); } catch { /* ignore */ }
        }
        setIsRecording(false);
        if (notify) onStopRef.current?.(reason);
    }, [releaseWakeLock, stopMediaRecorder, stopCloudStt]);

    const startCloudPipeline = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!sessionActiveRef.current) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            mediaStreamRef.current = stream;
            // Durchgehende Aufnahme (für die Tecvid-Analyse) + Segment-Schleife (Live-Erkennung)
            // laufen auf getrennten Streams derselben Mikrofonquelle.
            startContinuousRecorder(stream);
            const cloned = stream.clone();
            chunkStreamRef.current = cloned;
            startCloudSegmentLoop(cloned);
        } catch (e) {
            console.error('Mikrofon konnte nicht geöffnet werden', e);
            setError('Mikrofona erişilemedi. Lütfen mikrofon iznini kontrol edin.');
            finalizeStop('error');
        }
    }, [startContinuousRecorder, startCloudSegmentLoop, finalizeStop]);

    // --- Web Speech API (iOS/Desktop) ---

    const createRecognition = useCallback((): SpeechRecognitionInstance | null => {
        const API = getSpeechRecognitionConstructor();
        if (!API) return null;
        const rec = new API();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = lang;

        rec.onresult = (event) => {
            // Sobald Ergebnisse kommen, ist die Erkennung gesund → Restart-Zähler zurücksetzen.
            restartCountRef.current = 0;
            let interim = '';
            // Nur ab resultIndex iterieren: nach einem Auto-Restart beginnt event.results
            // wieder bei 0 — das bisherige Transcript lebt in finalTranscriptRef weiter.
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0]?.transcript ?? '';
                if (result.isFinal) {
                    finalTranscriptRef.current = appendFinalSegment(finalTranscriptRef.current, text);
                } else {
                    interim += text + ' ';
                }
            }
            setFinalTranscript(finalTranscriptRef.current);
            setInterimTranscript(interim.trim());
        };

        rec.onerror = (event) => {
            // Konflikt-Schutz: Meldet die Erkennung 'audio-capture', während unser
            // MediaRecorder das Mikrofon hält, blockieren sich beide.
            // Dann den Recorder freigeben und den Auto-Restart weiterversuchen lassen.
            if (event.error === 'audio-capture' && mediaRecorderRef.current) {
                console.warn('audio-capture während MediaRecorder aktiv — Audio-Aufnahme wird beendet, Erkennung läuft weiter.');
                stopMediaRecorder();
                return;
            }
            if (FATAL_ERRORS.has(event.error)) {
                setError('Mikrofon hatası: ' + event.error + '. Lütfen mikrofon iznini kontrol edin.');
                finalizeStop('error');
            }
            // 'no-speech', 'aborted', 'network' u. ä. ignorieren — onend übernimmt den Auto-Restart.
        };

        rec.onend = () => {
            if (!intentRef.current || !sessionActiveRef.current) return;
            // Nur schnell sterbende Sessions als Fehlschlag zählen — normale
            // Zyklen (Erkennung endet nach jeder Sprechpause) nicht.
            if (Date.now() - lastStartAtRef.current < FAST_FAIL_MS) {
                restartCountRef.current += 1;
            } else {
                restartCountRef.current = 0;
            }
            if (restartCountRef.current > MAX_CONSECUTIVE_RESTARTS) {
                setError('Konuşma tanıma sürekli kesiliyor. Lütfen internet bağlantınızı ve mikrofonunuzu kontrol edip tekrar deneyin.');
                finalizeStop('error');
                return;
            }
            const wait = Math.max(0, RESTART_THROTTLE_MS - (Date.now() - lastRestartAtRef.current));
            restartTimerRef.current = window.setTimeout(() => {
                restartTimerRef.current = null;
                if (!intentRef.current || !sessionActiveRef.current) return;
                lastRestartAtRef.current = Date.now();
                lastStartAtRef.current = Date.now();
                try {
                    // Immer eine frische Instanz: manche Browser starten dieselbe
                    // Instanz teils kommentarlos nicht neu (kein Fehler, keine Events).
                    const fresh = createRecognition();
                    if (!fresh) throw new Error('SpeechRecognition unavailable');
                    recognitionRef.current = fresh;
                    fresh.start();
                } catch (e) {
                    console.error('Konuşma tanıma yeniden başlatılamadı', e);
                    setError('Konuşma tanıma yeniden başlatılamadı. Lütfen tekrar deneyin.');
                    finalizeStop('error');
                }
            }, wait);
        };

        return rec;
    }, [lang, finalizeStop, stopMediaRecorder]);

    const start = useCallback((): boolean => {
        if (sessionActiveRef.current) return true;

        setError(null);
        finalTranscriptRef.current = '';
        setFinalTranscript('');
        setInterimTranscript('');
        audioBlobRef.current = null;
        audioChunksRef.current = [];
        cloudFailStreakRef.current = 0;
        restartCountRef.current = 0;
        lastRestartAtRef.current = Date.now();
        lastStartAtRef.current = Date.now();

        if (USE_CLOUD_STT) {
            if (!isSupported) {
                setError('Tarayıcınız ses kaydını desteklemiyor.');
                return false;
            }
            sessionActiveRef.current = true;
            intentRef.current = true;
            void startCloudPipeline();
            void requestWakeLock();
            maxDurationTimerRef.current = window.setTimeout(() => finalizeStop('maxDuration'), maxDurationMs);
            setIsRecording(true);
            return true;
        }

        const rec = createRecognition();
        if (!rec) {
            setError('Tarayıcınız konuşma tanımayı desteklemiyor.');
            return false;
        }
        sessionActiveRef.current = true;
        intentRef.current = true;
        recognitionRef.current = rec;

        void startMediaRecorder();
        void requestWakeLock();
        maxDurationTimerRef.current = window.setTimeout(() => finalizeStop('maxDuration'), maxDurationMs);

        try {
            rec.start();
        } catch (e) {
            console.error('Konuşma tanıma başlatılamadı', e);
            setError('Konuşma tanıma başlatılamadı. Lütfen tekrar deneyin.');
            finalizeStop('error', false);
            return false;
        }
        setIsRecording(true);
        return true;
    }, [createRecognition, startMediaRecorder, startCloudPipeline, requestWakeLock, finalizeStop, maxDurationMs, isSupported]);

    const stop = useCallback(() => {
        finalizeStop('stopped');
    }, [finalizeStop]);

    const getAudio = useCallback((): RecordedAudio | null => audioBlobRef.current, []);
    const clearAudio = useCallback(() => {
        audioBlobRef.current = null;
        audioChunksRef.current = [];
    }, []);

    // Wake Lock geht beim Wechsel in den Hintergrund verloren → beim Zurückkehren neu anfordern.
    useEffect(() => {
        if (!isRecording) return;
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible' && sessionActiveRef.current) {
                void requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, [isRecording, requestWakeLock]);

    // Cleanup beim Unmount — ohne onStop-Callback (Komponente verschwindet gerade).
    useEffect(() => {
        return () => {
            finalizeStop('stopped', false);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        transcript: (finalTranscript + ' ' + interimTranscript).trim(),
        finalTranscript,
        interimTranscript,
        isRecording,
        error,
        isSupported,
        start,
        stop,
        getAudio,
        clearAudio,
    };
};

export default useRecitationRecognition;
