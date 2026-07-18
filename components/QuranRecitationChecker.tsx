import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Type } from "@google/genai";
import { getGeminiClient, getGeminiModel } from '../services/geminiClient';
import { getSurahList, getPageDetail, getSurahDetailForPageJump } from '../services/api';
import { surahPageRanges } from '../services/quranData';
import { createRecitationMatcher, normalizeText, isWordMatch, type RecitationMatcher, type MatchStatus } from '../services/recitationMatcher';
import { useRecitationRecognition, type RecognitionStopReason } from '../hooks/useRecitationRecognition';
import type { SurahSummary, CombinedAyah, WordAnalysisResult, PageAnalysis } from '../types';
import Spinner from './Spinner';

interface LiveWordStatus {
    status: MatchStatus;
}
type WordStatusCollection = Record<number, 'correct'>;

interface CorrectionPopupData {
    analysis: WordAnalysisResult;
    rect: DOMRect;
}

type RecitationStatus = 'idle' | 'recording' | 'recorded' | 'analyzing' | 'analyzed';
type PageStatus = 'in_progress' | 'completed';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-12 0v1.5m6 7.5a6 6 0 0 0 3-5.625M12 12.75a6 6 0 0 1-3-5.625" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12a4.5 4.5 0 0 1 9 0v1.5a4.5 4.5 0 0 1-9 0V12Z" /></svg>);
const StopCircleIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563A.562.562 0 0 1 9 14.437V9.564Z" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const ResetIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 0 0-3.375-3.375H8.25a3.375 3.375 0 0 0-3.375 3.375v2.25" /></svg>);
const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);
const AnalyzeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>);
const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296-2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>);

const TOTAL_PAGES = 604;
const ARABIC_NUMERALS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const toArabicNumeral = (n: number) => n.toString().split('').map(digit => ARABIC_NUMERALS[parseInt(digit)]).join('');
const getPageWords = (pageData: CombinedAyah[]): string[] => pageData.flatMap(ayah => ayah.arabicText.split(' ').filter(Boolean));
const FONT_LIST = [
    { name: 'Mushaf (Amiri Quran)', value: "'Amiri Quran', serif" },
    { name: 'S. Hamdullah Mushaf', value: "'Katibeh', cursive" },
    { name: 'Elif 1 (Almarai)', value: "'Almarai', sans-serif" },
    { name: 'Elif 2 (Rakkas)', value: "'Rakkas', cursive" },
    { name: 'KFGQPC Hafs (Amiri)', value: "'Amiri', serif" },
    { name: 'Scheherazade', value: "'Scheherazade New', serif" },
    { name: 'Me Quran (Noto Naskh)', value: "'Noto Naskh Arabic', serif" },
    { name: 'PDMS Saleem (Lateef)', value: "'Lateef', cursive" },
    { name: 'Muhammadi (Reem Kufi)', value: "'Reem Kufi', sans-serif" },
    { name: 'Markazi Text', value: "'Markazi Text', serif" },
    { name: 'Cairo', value: "'Cairo', sans-serif" },
    { name: 'Tajawal', value: "'Tajawal', sans-serif" },
];

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Ses dosyası okunamadı.'));
    reader.readAsDataURL(blob);
});

/** Nur Ergebnisse übernehmen, deren wordIndex plausibel ist; sonst per Wortsuche remappen oder verwerfen. */
const validateAnalysisResults = (results: unknown, words: string[]): PageAnalysis => {
    if (!Array.isArray(results)) return [];
    const valid: PageAnalysis = [];
    for (const r of results as WordAnalysisResult[]) {
        if (!r || typeof r !== 'object') continue;
        const idx = typeof r.wordIndex === 'number' && Number.isInteger(r.wordIndex) ? r.wordIndex : -1;
        const inRange = idx >= 0 && idx < words.length;
        const normWord = normalizeText(String(r.word ?? ''));
        if (inRange && normWord && (normalizeText(words[idx]) === normWord || isWordMatch(String(r.word), words[idx]))) {
            valid.push({ ...r, wordIndex: idx });
            continue;
        }
        if (normWord) {
            const remapped = words.findIndex(w => normalizeText(w) === normWord);
            if (remapped >= 0) {
                valid.push({ ...r, wordIndex: remapped });
                continue;
            }
        } else if (inRange) {
            valid.push({ ...r, wordIndex: idx, word: words[idx] });
        }
    }
    return valid;
};

const QuranRecitationChecker: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    // Data & Navigation State
    const [surahList, setSurahList] = useState<SurahSummary[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(() => parseInt(localStorage.getItem('recitationLastPage') || '1'));
    const [pageData, setPageData] = useState<CombinedAyah[]>([]);
    const [pageWords, setPageWords] = useState<string[]>([]);

    // UI State
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const [correctionPopup, setCorrectionPopup] = useState<CorrectionPopupData | null>(null);
    const [expandedSurah, setExpandedSurah] = useState<number | null>(null);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [fontSize, setFontSize] = useState<number>(() => parseInt(localStorage.getItem('recitationFontSize') || '24'));
    const [fontFamily, setFontFamily] = useState<string>(() => localStorage.getItem('recitationFontFamily') || FONT_LIST[0].value);

    // Recitation State
    const [recitationStatus, setRecitationStatus] = useState<RecitationStatus>('idle');
    const [sessionWordStatuses, setSessionWordStatuses] = useState<WordStatusCollection>({});
    const [liveWordStatuses, setLiveWordStatuses] = useState<Record<number, LiveWordStatus>>({});
    const [analysisResults, setAnalysisResults] = useState<PageAnalysis>([]);

    // Progress Tracking State
    const [pageProgress, setPageProgress] = useState<Record<number, PageStatus>>(() => {
        try {
            const item = window.localStorage.getItem('recitationProgressV2');
            return item ? JSON.parse(item) : {};
        } catch (error) { return {}; }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem('recitationProgressV2', JSON.stringify(pageProgress));
        } catch (error) { console.error("Failed to save progress", error); }
    }, [pageProgress]);

    // Refs
    const wordRefs = useRef<Record<number, HTMLSpanElement | null>>({});
    const ai = useRef(getGeminiClient());
    const matcherRef = useRef<RecitationMatcher | null>(null);
    // Per useEffect synchron gehaltene Refs, damit die Finalisierung beim Stop
    // keine veralteten Closure-Werte liest.
    const sessionWordStatusesRef = useRef<WordStatusCollection>({});
    const liveWordStatusesRef = useRef<Record<number, LiveWordStatus>>({});
    useEffect(() => { sessionWordStatusesRef.current = sessionWordStatuses; }, [sessionWordStatuses]);

    // Finalisierung: Live-Status in den Session-Status übernehmen und persistieren.
    const handleRecognitionStop = (reason: RecognitionStopReason) => {
        const merged: WordStatusCollection = { ...sessionWordStatusesRef.current };
        let madeChanges = false;
        for (const [idxStr, value] of Object.entries(liveWordStatusesRef.current)) {
            const idx = Number(idxStr);
            if ((value as LiveWordStatus).status === 'correct' && !merged[idx]) {
                merged[idx] = 'correct';
                madeChanges = true;
            }
        }
        if (madeChanges) {
            setSessionWordStatuses(merged);
            sessionWordStatusesRef.current = merged;
            try {
                localStorage.setItem(`recitationWords_p${currentPage}`, JSON.stringify(merged));
            } catch (e) { console.error('Failed to save words', e); }

            const lastWordIndex = pageWords.length - 1;
            if (lastWordIndex >= 0 && merged[lastWordIndex]) {
                setPageProgress(prevProg => ({ ...prevProg, [currentPage]: 'completed' }));
            }
        }
        setRecitationStatus(reason === 'error' ? 'idle' : 'recorded');
    };

    const {
        transcript: liveTranscript,
        finalTranscript,
        interimTranscript,
        isRecording,
        error: recognitionError,
        start: startRecognition,
        stop: stopRecognition,
        getAudio,
        clearAudio,
    } = useRecitationRecognition({ lang: 'ar-SA', onStop: handleRecognitionStop });

    useEffect(() => {
        if (recognitionError) setError(recognitionError);
    }, [recognitionError]);

    // --- Effects ---
    const handleReset = useCallback(() => {
        stopRecognition();
        clearAudio();
        matcherRef.current = null;
        setError(null);
        setLiveWordStatuses({});
        liveWordStatusesRef.current = {};
        setAnalysisResults([]);
        setCorrectionPopup(null);
        setRecitationStatus('idle');
        localStorage.removeItem(`recitationAnalysis_p${currentPage}`);
        setSessionWordStatuses({});
        sessionWordStatusesRef.current = {};
        localStorage.removeItem(`recitationWords_p${currentPage}`);
        setPageProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[currentPage];
            return newProgress;
        });
    }, [currentPage, stopRecognition, clearAudio]);

    useEffect(() => {
        getSurahList().then(setSurahList).catch(() => setError("Sure listesi yüklenemedi."));
    }, []);

    // Aufräumen: verwaiste Analyse-/Wort-Keys von Seiten löschen, die laut Progress
    // weder 'in_progress' noch 'completed' sind.
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem('recitationProgressV2');
            const progress: Record<string, PageStatus> = raw ? JSON.parse(raw) : {};
            const staleKeys: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
                const key = window.localStorage.key(i);
                const match = key?.match(/^recitation(?:Analysis|Words)_p(\d+)$/);
                if (match && !progress[match[1]]) staleKeys.push(key!);
            }
            staleKeys.forEach(k => window.localStorage.removeItem(k));
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        setIsLoadingPage(true);
        setError(null);

        // Transiente UI-Zustände der vorherigen Seite zurücksetzen, ohne die
        // persistierten Daten der neuen Seite aus localStorage zu löschen.
        matcherRef.current = null;
        clearAudio();
        setLiveWordStatuses({});
        liveWordStatusesRef.current = {};
        setAnalysisResults([]);
        setCorrectionPopup(null);
        setRecitationStatus('idle');
        setSessionWordStatuses({});
        sessionWordStatusesRef.current = {};

        try {
            const savedAnalysis = localStorage.getItem(`recitationAnalysis_p${currentPage}`);
            const savedWords = localStorage.getItem(`recitationWords_p${currentPage}`);

            if (savedAnalysis) {
                setAnalysisResults(JSON.parse(savedAnalysis));
                setRecitationStatus('analyzed');
            }
            if (savedWords) {
                const parsed = JSON.parse(savedWords);
                setSessionWordStatuses(parsed);
                sessionWordStatusesRef.current = parsed;
            }
        } catch (e) { console.error("Failed to load saved state:", e); }

        getPageDetail(currentPage, 'quran-uthmani')
            .then(data => {
                setPageData(data);
                setPageWords(getPageWords(data));
            })
            .catch(() => setError(`Sayfa ${currentPage} yüklenemedi.`))
            .finally(() => setIsLoadingPage(false));
        localStorage.setItem('recitationLastPage', String(currentPage));
    }, [currentPage, clearAudio]);

    // Save settings
    useEffect(() => {
        localStorage.setItem('recitationFontSize', fontSize.toString());
        localStorage.setItem('recitationFontFamily', fontFamily);
    }, [fontSize, fontFamily]);

    // Live tracking: inkrementeller Matcher statt Komplett-Rescan bei jedem Interim-Result.
    useEffect(() => {
        if (recitationStatus !== 'recording' || !matcherRef.current) return;
        const statuses = matcherRef.current.update(finalTranscript, interimTranscript);
        const mapped: Record<number, LiveWordStatus> = {};
        for (const [idx, status] of Object.entries(statuses)) {
            mapped[Number(idx)] = { status: status as MatchStatus };
        }
        liveWordStatusesRef.current = mapped;
        setLiveWordStatuses(mapped);
    }, [finalTranscript, interimTranscript, recitationStatus]);

    // Live Auto-Scroll Effect
    useEffect(() => {
        if (recitationStatus === 'recording' && pageWords.length > 0) {
            let unreadIdx = 0;
            while (unreadIdx < pageWords.length && (sessionWordStatuses[unreadIdx] || liveWordStatuses[unreadIdx]?.status === 'correct')) {
                unreadIdx++;
            }
            // Add a small delay so DOM updates before scrolling
            const scrollTimeout = setTimeout(() => {
                if (wordRefs.current[unreadIdx]) {
                    wordRefs.current[unreadIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return () => clearTimeout(scrollTimeout);
        }
    }, [liveWordStatuses, recitationStatus, pageWords.length, sessionWordStatuses]);

    // --- Recitation & Navigation ---
    const handleReciteClick = () => {
        if (recitationStatus === 'recording') {
            stopRecognition();
            return;
        }

        setError(null);
        setLiveWordStatuses({});
        liveWordStatusesRef.current = {};
        setAnalysisResults([]); // Clear old analysis on new recording
        localStorage.removeItem(`recitationAnalysis_p${currentPage}`);
        setCorrectionPopup(null);

        matcherRef.current = createRecitationMatcher(pageWords, sessionWordStatusesRef.current);
        if (!startRecognition()) {
            matcherRef.current = null;
            setRecitationStatus('idle');
            return;
        }
        setRecitationStatus('recording');
        setPageProgress(prev => ({ ...prev, [currentPage]: prev[currentPage] === 'completed' ? 'completed' : 'in_progress' }));
    };

    const handleAnalyze = async () => {
        const audio = getAudio();
        const transcriptText = liveTranscript.trim();
        if (!pageWords.length || (!audio && !transcriptText)) {
            setError("Analiz edilecek bir okuma bulunamadı.");
            return;
        }
        setRecitationStatus('analyzing');
        setError(null);
        setCorrectionPopup(null);

        if (!ai.current) {
            setError("Google Gemini API Anahtarı bulunamadı (Sistem Hatası). Lütfen yöneticinize başvurun.");
            setRecitationStatus('recorded');
            return;
        }

        const numberedWordList = pageWords.map((w, i) => `${i}: ${w}`).join('\n');
        const transcriptContext = transcriptText
            ? `\n\nASR ham transkripti (otomatik konuşma tanıma çıktısı, hatalı olabilir — sadece yardımcı bağlam olarak kullan):\n"${transcriptText}"`
            : '';

        try {
            let contents: unknown;
            if (audio) {
                // Netlify-Functions-Payload-Limit (~6 MB) nicht sprengen.
                if (audio.blob.size > 4_500_000) {
                    throw new Error('AUDIO_TOO_LARGE');
                }
                const base64 = await blobToBase64(audio.blob);
                const prompt = `Sen bir Tecvid ve Kur'an kıraat uzmanısın. Ekteki ses kaydında kullanıcı, aşağıda kelime kelime numaralandırılmış Mushaf sayfasını okuyor.

Sayfanın kelime listesi (sıfır tabanlı kelime indeksi):
${numberedWordList}${transcriptContext}

Görevin: Ses kaydını dinle ve metinle karşılaştır. Şunları tespit et:
(a) yanlış telaffuz edilen kelimeler veya harfler,
(b) atlanan veya eklenen kelimeler,
(c) net tecvid ihlalleri (med süreleri, idgam, ihfa, izhar, kalkale vb.).

Aksan farklılıklarını ve kayıt kalitesini göz ardı et. SADECE emin olduğun, belirgin hataları bildir — şüphede kalırsan bildirme. "wordIndex" alanı mutlaka yukarıdaki listedeki indeksle eşleşmeli. Bulduğun her hata için bir JSON nesnesi oluştur ve bu nesneleri bir dizi içinde döndür. Hata yoksa boş bir dizi döndür.`;
                contents = {
                    parts: [
                        { inlineData: { mimeType: audio.mimeType.split(';')[0], data: base64 } },
                        { text: prompt },
                    ],
                };
            } else {
                // Fallback ohne Audio: nur Wort-Auslassungen/-Vertauschungen sind bewertbar.
                contents = `Sen bir Kur'an kıraat uzmanısın. Elimizde ses kaydı YOK; yalnızca otomatik konuşma tanıma (ASR) transkripti var. Transkriptte hareke ve tecvid bilgisi bulunmadığı için SADECE kelime düzeyindeki farkları değerlendir: atlanan, eklenen veya değiştirilen kelimeler. Med, idgam, ihfa, izhar, kalkale gibi tecvid inceliklerini DEĞERLENDİRME ve bu tür hatalar bildirme.

Sayfanın kelime listesi (sıfır tabanlı kelime indeksi):
${numberedWordList}

Kullanıcının ASR transkripti (hatalı olabilir):
"${transcriptText}"

ASR hatalarını (benzer sesli kelimeler, birleşik yazımlar) hata olarak sayma. SADECE emin olduğun, belirgin farkları bildir — şüphede kalırsan bildirme. "wordIndex" alanı mutlaka yukarıdaki listedeki indeksle eşleşmeli. Bulduğun her fark için bir JSON nesnesi oluştur ve bu nesneleri bir dizi içinde döndür. Fark yoksa boş bir dizi döndür.`;
            }

            const response = await ai.current.models.generateContent({
                model: await getGeminiModel(),
                contents,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                wordIndex: { type: Type.INTEGER, description: "Hatalı kelimenin orijinal metindeki sıfır tabanlı indeksi." },
                                word: { type: Type.STRING, description: "Hatanın yapıldığı orijinal kelime." },
                                errorType: { type: Type.STRING, description: "Hatanın türü, kısa bir başlık (ör. 'Tecvid Hatası: İdgam')." },
                                explanation: { type: Type.STRING, description: "Hatanın ne olduğu ve nasıl düzeltileceğinin sade, anlaşılır bir açıklaması." },
                                ruleInfo: { type: Type.STRING, description: "İlgili tecvid kuralının ne olduğu hakkında kısa bilgi." },
                            }
                        }
                    }
                }
            });
            const results = validateAnalysisResults(JSON.parse(response.text), pageWords);
            setAnalysisResults(results);
            localStorage.setItem(`recitationAnalysis_p${currentPage}`, JSON.stringify(results));
            setRecitationStatus('analyzed');

        } catch (err) {
            console.error("AI analysis error:", err);
            if (err instanceof Error && err.message === 'AUDIO_TOO_LARGE') {
                setError("Ses kaydı çok büyük. Lütfen daha kısa bölümler halinde okuyup analiz edin.");
            } else {
                setError("Hata analizi sırasında bir sorun oluştu. Lütfen tekrar deneyin.");
            }
            setRecitationStatus('recorded');
        }
    };

    const jumpToPage = (page: number) => {
        if (page >= 1 && page <= TOTAL_PAGES && page !== currentPage) {
            // Zombie-Recording-Fix: Intent beenden und Aufnahme sauber finalisieren,
            // bevor die Seite wechselt — sonst startet onend die Erkennung erneut.
            if (isRecording) stopRecognition();
            setCurrentPage(page);
        }
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    const jumpToSurahStart = async (surahNumber: number) => {
        try {
            const { page } = await getSurahDetailForPageJump(surahNumber);
            jumpToPage(page);
        } catch (err) { setError('Sureye atlanamadı.'); }
    };

    const handleWordClick = (wordIndex: number, target: HTMLElement) => {
        const analysis = analysisResults.find(r => r.wordIndex === wordIndex);
        if (!analysis) return;

        if (correctionPopup?.analysis.wordIndex === wordIndex) {
            setCorrectionPopup(null);
            return;
        }

        const rect = target.getBoundingClientRect();
        setCorrectionPopup({ analysis, rect });
    };

    const getStatusMessage = () => {
        switch (recitationStatus) {
            case 'recording': return "Dinleniyor... Bitince tekrar basın.";
            case 'recorded': return "Okuma tamamlandı. Analiz etmek için butona basın.";
            case 'analyzing': return "Analiz ediliyor...";
            case 'analyzed': return `Analiz tamamlandı. ${analysisResults.length} hata bulundu.`;
            default: return "Okumaya başlamak için mikrofona basın.";
        }
    };

    // --- Render ---
    let wordCounter = -1;
    const analyzedErrorIndices = new Set(analysisResults.map(r => r.wordIndex));
    const combinedWordStatuses = { ...sessionWordStatuses, ...Object.fromEntries(Object.entries(liveWordStatuses).filter(([, v]) => (v as LiveWordStatus).status === 'correct').map(([k]) => [k, 'correct'])) };

    const pageContentElements: React.ReactNode[] = [];
    pageData.forEach((ayah, index) => {
        if (index > 0 && ayah.surah.number !== pageData[index - 1].surah.number) {
            pageContentElements.push(
                <div key={`surah-header-${ayah.surah.number}`} className="w-full my-6 text-center">
                    <h2 className="text-4xl font-amiri font-bold text-amber-500 dark:text-amber-400" style={{ fontFamily: FONT_LIST[0].value }}>{ayah.surah.name}</h2>
                </div>
            );
        }
        pageContentElements.push(
            <div key={ayah.number} className="inline-block">
                {ayah.arabicText.split(' ').filter(Boolean).map((word) => {
                    wordCounter++;
                    const currentWordIndex = wordCounter;
                    const liveStatus = liveWordStatuses[currentWordIndex]?.status;
                    const isAnalyzedError = recitationStatus === 'analyzed' && analyzedErrorIndices.has(currentWordIndex);
                    const isCorrect = !!combinedWordStatuses[currentWordIndex];

                    let className = 'transition-all duration-300 rounded-md px-1 touch-manipulation';
                    if (isAnalyzedError) {
                        className += ' bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-300 cursor-pointer';
                    } else if (isCorrect) {
                        className += ' text-blue-600 dark:text-blue-400';
                    } else if (liveStatus === 'skipped') {
                        // Ausgelassene Wörter: dezent markieren, nicht rot — sie bleiben "unread".
                        className += ' text-amber-600 dark:text-amber-400 underline decoration-dashed decoration-amber-500';
                    }

                    return (
                        <span
                            key={currentWordIndex}
                            ref={(el) => { wordRefs.current[currentWordIndex] = el; }}
                            onClick={(e) => { if (isAnalyzedError) handleWordClick(currentWordIndex, e.currentTarget); }}
                            className={className}
                        >
                            {word}{' '}
                        </span>
                    );
                })}
                <span className="text-sm font-sans text-amber-600 dark:text-amber-400 mx-1">۝{toArabicNumeral(ayah.numberInSurah)}</span>
            </div>
        );
    });

    return (
        <div className="flex h-dvh bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/40 z-10 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>
            )}
            <aside className={`absolute lg:relative z-20 flex flex-col h-full bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '300px' }}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Sureler</h2>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
                </div>
                <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                    {surahList.map(s => (
                        <li key={s.number}>
                            <button onClick={() => setExpandedSurah(expandedSurah === s.number ? null : s.number)} className="w-full text-left flex justify-between items-center p-2.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                                <div className="flex items-center">
                                    <SurahProgressIndicator surahNumber={s.number} pageProgress={pageProgress} />
                                    <span className="ml-2">{s.number}. {s.englishName}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="mr-4">{s.name}</span>
                                    <ChevronRightIcon className={`w-4 h-4 transition-transform ${expandedSurah === s.number ? 'rotate-90' : ''}`} />
                                </div>
                            </button>
                            {expandedSurah === s.number && (
                                <div className="pl-4 pr-2 py-1 border-l-2 border-gray-200 dark:border-gray-600 ml-3">
                                    <ul className="grid grid-cols-4 gap-2">
                                        {Array.from({ length: surahPageRanges[s.number].end - surahPageRanges[s.number].start + 1 }, (_, i) => surahPageRanges[s.number].start + i).map(page => (
                                            <li key={page}>
                                                <button onClick={() => jumpToPage(page)} disabled={recitationStatus === 'recording'} className="w-full flex items-center justify-center p-2 text-xs rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                                    <PageProgressIndicator status={pageProgress[page]} />
                                                    <span className="ml-1.5">{page}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md p-2 flex justify-between items-center z-10">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><MenuIcon /></button>
                        <button onClick={handleReset} title="Sıfırla" className="p-2 text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md"><ResetIcon className="w-5 h-5" /></button>
                        <button onClick={handleAnalyze} title="Analiz Et" className="p-2 text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md disabled:opacity-50" disabled={recitationStatus !== 'recorded' && recitationStatus !== 'analyzed'}><AnalyzeIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        {getStatusMessage()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><SettingsIcon /></button>
                        <button onClick={onGoHome} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><HomeIcon /></button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {isLoadingPage ? <Spinner /> : error ? <p className="m-auto text-center text-red-500">{error}</p> :
                        <div className="p-4 md:p-8 pb-36 flex items-center justify-center">
                            <div className="w-full max-w-4xl bg-[#FDFCF8] dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 shadow-lg rounded-lg p-6 border-4 border-double border-amber-400 dark:border-amber-600">
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4 px-2">
                                    <span>Cüz {pageData[0]?.juz}</span>
                                    <span>{pageData[0]?.surah.name}</span>
                                </div>
                                <div dir="rtl" className="text-center" style={{ fontFamily: fontFamily, fontSize: `${fontSize}px`, lineHeight: 2.5 }}>
                                    {pageContentElements}
                                </div>
                                <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">{currentPage}</div>
                            </div>
                        </div>
                    }
                </main>

                <footer className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-inner p-2 pb-[env(safe-area-inset-bottom)] flex justify-between items-center">
                    <button onClick={() => jumpToPage(currentPage - 1)} disabled={currentPage === 1 || recitationStatus === 'recording'} className="px-4 py-2 rounded-md disabled:opacity-50 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5" /> <span>Önceki</span></button>
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20">
                        <button onClick={handleReciteClick} disabled={isLoadingPage || recitationStatus === 'analyzing'} className={`flex items-center justify-center w-20 h-20 rounded-full text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed ${recitationStatus === 'recording' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400 shadow-lg animate-pulse' : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-400 shadow-lg'}`} aria-label={recitationStatus === 'recording' ? 'Stop Reciting' : 'Start Reciting'}>
                            {recitationStatus === 'recording' ? <StopCircleIcon className="w-8 h-8" /> : <MicIcon className="w-8 h-8" />}
                        </button>
                    </div>
                    <button onClick={() => jumpToPage(currentPage + 1)} disabled={currentPage === TOTAL_PAGES || recitationStatus === 'recording'} className="px-4 py-2 rounded-md disabled:opacity-50 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"><span>Sonraki</span> <ChevronRightIcon className="w-5 h-5" /></button>
                </footer>
            </div>

            {correctionPopup && <CorrectionPopup data={correctionPopup} onClose={() => setCorrectionPopup(null)} />}

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center" onClick={() => setSettingsOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Ayarlar</h3>
                            <button onClick={() => setSettingsOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yazı Tipi (Arapça)</label>
                                <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500">
                                    {FONT_LIST.map(font => <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yazı Tipi Boyutu</label>
                                <div className="flex items-center space-x-4">
                                    <input type="range" min="16" max="48" step="2" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full" />
                                    <span className="font-bold">{fontSize}px</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-components ---
const CorrectionPopup: React.FC<{ data: CorrectionPopupData; onClose: () => void; }> = ({ data, onClose }) => {
    // Bei Scroll (auch im inneren main-Container) oder Resize schließen —
    // die fixe Position würde sonst nicht mehr zum Wort passen.
    useEffect(() => {
        window.addEventListener('scroll', onClose, true);
        window.addEventListener('resize', onClose);
        return () => {
            window.removeEventListener('scroll', onClose, true);
            window.removeEventListener('resize', onClose);
        };
    }, [onClose]);

    const viewportWidth = window.innerWidth;
    const margin = 16;
    const popupWidth = Math.min(320, viewportWidth - 2 * margin);
    const half = popupWidth / 2;
    const centerX = Math.min(Math.max(data.rect.left + data.rect.width / 2, margin + half), viewportWidth - margin - half);

    const popupStyle: React.CSSProperties = {
        position: 'fixed',
        top: `${data.rect.bottom + 12}px`,
        left: `${centerX}px`,
        transform: 'translateX(-50%)',
        width: `${popupWidth}px`,
        zIndex: 50,
    };
    return (
        <div style={popupStyle} className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border border-gray-200 dark:border-gray-700 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">Hata Detayı</h4>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close popup"><CloseIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
                <div className="pb-2">
                    <h5 className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Hatalı Kelime</h5>
                    <p dir="rtl" className="font-amiri text-2xl text-right p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100">{data.analysis.word}</p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <h5 className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Hata Türü</h5>
                    <p className="text-gray-800 dark:text-gray-200 font-semibold">{data.analysis.errorType || "Belirtilmemiş"}</p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <h5 className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Açıklama</h5>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{data.analysis.explanation || "Detaylı açıklama bulunamadı."}</p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <h5 className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tecvid Kuralı</h5>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{data.analysis.ruleInfo || "İlgili kural bilgisi bulunamadı."}</p>
                </div>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white dark:border-b-gray-800" style={{ filter: 'drop-shadow(0 -1px 1px rgb(0 0 0 / 0.05))' }}></div>
        </div>
    );
};

const PageProgressIndicator: React.FC<{ status?: PageStatus }> = ({ status }) => {
    if (status === 'completed') {
        return <span title="Tamamlandı" className="w-2.5 h-2.5 text-teal-500">✔</span>;
    }
    if (status === 'in_progress') {
        return <span title="Devam Ediyor" className="w-2.5 h-2.5 text-yellow-500">▶</span>;
    }
    return <span title="Başlanmadı" className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500">○</span>;
};


const SurahProgressIndicator: React.FC<{ surahNumber: number; pageProgress: Record<number, PageStatus> }> = ({ surahNumber, pageProgress }) => {
    const range = surahPageRanges[surahNumber];
    if (!range) return null;

    const totalPages = range.end - range.start + 1;
    let completedCount = 0;
    let hasInProgress = false;

    for (let i = range.start; i <= range.end; i++) {
        const status = pageProgress[i];
        if (status === 'completed') {
            completedCount++;
        } else if (status === 'in_progress') {
            hasInProgress = true;
        }
    }

    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (completedCount === totalPages) {
        status = 'completed';
    } else if (completedCount > 0 || hasInProgress) {
        status = 'in_progress';
    }

    if (status === 'completed') {
        return <span title="Tamamlandı" className="w-3 h-3 bg-teal-500 rounded-full"></span>;
    }
    if (status === 'in_progress') {
        return <span title="Devam Ediyor" className="w-3 h-3 bg-yellow-500 rounded-full"></span>;
    }
    return <span title="Başlanmadı" className="w-3 h-3 border-2 border-gray-400 dark:border-gray-600 rounded-full"></span>;
};

export default QuranRecitationChecker;
