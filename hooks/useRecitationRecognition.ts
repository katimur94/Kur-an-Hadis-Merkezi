import { useCallback, useEffect, useRef, useState } from 'react';

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

// Android Chrome kann SpeechRecognition und getUserMedia-Audio NICHT gleichzeitig:
// die Erkennung läuft über den Google-Systemdienst, und Android gibt das Mikrofon
// nur an einen Prozess. Hält die Seite den Stream (MediaRecorder), liefert die
// Erkennung schlicht keine Ergebnisse (https://issues.chromium.org/issues/41083534).
// Deshalb auf Android: keine parallele Audio-Aufnahme, Analyse fällt auf Text zurück.
const IS_ANDROID = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

/** Hängt ein finales Segment an; identische Suffixe werden dedupliziert (Android liefert Results teils doppelt). */
const appendFinalSegment = (accumulated: string, segment: string): string => {
    const seg = segment.trim();
    if (!seg) return accumulated;
    const prev = accumulated.trim();
    if (!prev) return seg;
    if (prev === seg || prev.endsWith(' ' + seg)) return prev;
    return prev + ' ' + seg;
};

export const useRecitationRecognition = (options: UseRecitationRecognitionOptions = {}): UseRecitationRecognitionResult => {
    const { lang = 'ar-SA', maxDurationMs = DEFAULT_MAX_DURATION_MS } = options;

    const [finalTranscript, setFinalTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSupported = !!getSpeechRecognitionConstructor();

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

    const startMediaRecorder = useCallback(async () => {
        if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!sessionActiveRef.current) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            mediaStreamRef.current = stream;
            const mime = MIME_CANDIDATES.find(m => {
                try { return MediaRecorder.isTypeSupported(m); } catch { return false; }
            });
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

    const finalizeStop = useCallback((reason: RecognitionStopReason, notify: boolean = true) => {
        if (!sessionActiveRef.current) return;
        sessionActiveRef.current = false;
        intentRef.current = false;
        if (restartTimerRef.current !== null) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
        if (maxDurationTimerRef.current !== null) { clearTimeout(maxDurationTimerRef.current); maxDurationTimerRef.current = null; }
        releaseWakeLock();
        stopMediaRecorder();
        const rec = recognitionRef.current;
        if (rec) {
            try { rec.stop(); } catch { /* ignore */ }
        }
        setIsRecording(false);
        if (notify) onStopRef.current?.(reason);
    }, [releaseWakeLock, stopMediaRecorder]);

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
            // MediaRecorder das Mikrofon hält, blockieren sich beide (v. a. Android).
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
            // Android-Zyklen (Erkennung endet nach jeder Sprechpause) nicht.
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
                    // Immer eine frische Instanz: Android startet dieselbe Instanz
                    // teils kommentarlos nicht neu (kein Fehler, keine Events).
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
        const rec = createRecognition();
        if (!rec) {
            setError('Tarayıcınız konuşma tanımayı desteklemiyor.');
            return false;
        }
        setError(null);
        finalTranscriptRef.current = '';
        setFinalTranscript('');
        setInterimTranscript('');
        audioBlobRef.current = null;
        audioChunksRef.current = [];
        restartCountRef.current = 0;
        lastRestartAtRef.current = Date.now();
        lastStartAtRef.current = Date.now();
        sessionActiveRef.current = true;
        intentRef.current = true;
        recognitionRef.current = rec;

        // Auf Android würde der parallele getUserMedia-Stream die Spracherkennung
        // blockieren (Mikrofon-Konflikt mit dem System-Erkennungsdienst) —
        // dort keine Audio-Aufnahme, die Analyse nutzt den Text-Fallback.
        if (!IS_ANDROID) {
            void startMediaRecorder();
        }
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
    }, [createRecognition, startMediaRecorder, requestWakeLock, finalizeStop, maxDurationMs]);

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
