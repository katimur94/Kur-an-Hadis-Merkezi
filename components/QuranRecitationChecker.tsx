import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { getSurahList, getPageDetail, getSurahDetailForPageJump } from '../services/api';
import { surahPageRanges } from '../services/quranData';
import type { SurahSummary, CombinedAyah, WordAnalysisResult, PageAnalysis } from '../types';
import Spinner from './Spinner';

// --- TYPE DEFINITIONS ---
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
declare var SpeechRecognition: { prototype: SpeechRecognition; new(): SpeechRecognition; };
declare var webkitSpeechRecognition: { prototype: SpeechRecognition; new(): SpeechRecognition; };
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof webkitSpeechRecognition;
  }
}

interface LiveWordStatus {
    status: 'correct' | 'error';
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

const TOTAL_PAGES = 604;
const ARABIC_NUMERALS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const toArabicNumeral = (n: number) => n.toString().split('').map(digit => ARABIC_NUMERALS[parseInt(digit)]).join('');
const getPageWords = (pageData: CombinedAyah[]): string[] => pageData.flatMap(ayah => ayah.arabicText.split(' ').filter(Boolean));

const normalizeText = (text: string): string => text.replace(/[\u064B-\u0652]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
const levenshtein = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) { matrix[0][i] = i; }
  for (let j = 0; j <= b.length; j += 1) { matrix[j][0] = j; }
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
    }
  }
  return matrix[b.length][a.length];
};
const isSimilar = (a: string, b: string, threshold = 0.5): boolean => {
    const longerLength = Math.max(a.length, b.length);
    if (longerLength === 0) return true;
    const distance = levenshtein(a, b);
    return (distance / longerLength) < threshold;
};

const QuranRecitationChecker: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    const [surahList, setSurahList] = useState<SurahSummary[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(() => parseInt(localStorage.getItem('recitationLastPage') || '1'));
    const [pageData, setPageData] = useState<CombinedAyah[]>([]);
    const [pageWords, setPageWords] = useState<string[]>([]);
    
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [correctionPopup, setCorrectionPopup] = useState<CorrectionPopupData | null>(null);
    const [expandedSurah, setExpandedSurah] = useState<number | null>(null);

    const [recitationStatus, setRecitationStatus] = useState<RecitationStatus>('idle');
    const [liveTranscript, setLiveTranscript] = useState('');
    const [sessionWordStatuses, setSessionWordStatuses] = useState<WordStatusCollection>({});
    const [liveWordStatuses, setLiveWordStatuses] = useState<Record<number, LiveWordStatus>>({});
    const [analysisResults, setAnalysisResults] = useState<PageAnalysis>([]);

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

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const wordRefs = useRef<Record<number, HTMLSpanElement | null>>({});
    const ai = useRef(new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string }));
    const userStoppedRecording = useRef(false);

    const handleReset = useCallback(() => {
        setError(null);
        setLiveTranscript('');
        setLiveWordStatuses({});
        setAnalysisResults([]);
        setCorrectionPopup(null);
        setRecitationStatus('idle');
        localStorage.removeItem(`recitationAnalysis_p${currentPage}`);
        setSessionWordStatuses({});
        localStorage.removeItem(`recitationWords_p${currentPage}`);
        setPageProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[currentPage];
            return newProgress;
        });
    }, [currentPage]);

    useEffect(() => {
        getSurahList().then(setSurahList).catch(() => setError("Sure listesi yüklenemedi."));
    }, []);

    useEffect(() => {
        setIsLoadingPage(true);
        setError(null);
        setLiveTranscript('');
        setLiveWordStatuses({});
        setAnalysisResults([]);
        setCorrectionPopup(null);
        setRecitationStatus('idle');
        setSessionWordStatuses({});
        
        try {
            const savedAnalysis = localStorage.getItem(`recitationAnalysis_p${currentPage}`);
            const savedWords = localStorage.getItem(`recitationWords_p${currentPage}`);
            
            if(savedAnalysis) {
                setAnalysisResults(JSON.parse(savedAnalysis));
                setRecitationStatus('analyzed');
            }
            if(savedWords) {
                setSessionWordStatuses(JSON.parse(savedWords));
            }
        } catch(e) { console.error("Failed to load saved state:", e); }

        getPageDetail(currentPage, 'ar.alafasy')
            .then(data => {
                setPageData(data);
                setPageWords(getPageWords(data));
            })
            .catch(() => setError(`Sayfa ${currentPage} yüklenemedi.`))
            .finally(() => setIsLoadingPage(false));
        localStorage.setItem('recitationLastPage', String(currentPage));
    }, [currentPage]);

    useEffect(() => {
        if (recitationStatus !== 'recording' || !pageWords.length) return;

        const findFirstUnreadIndex = (): number => {
            for (let i = 0; i < pageWords.length; i++) {
                if (!sessionWordStatuses[i]) {
                    return i;
                }
            }
            return pageWords.length;
        };

        const spokenWords = liveTranscript.split(' ').filter(Boolean);
        const newStatuses: Record<number, LiveWordStatus> = {};
        let pageWordIdx = findFirstUnreadIndex();
        
        for (const spokenWord of spokenWords) {
            if (pageWordIdx >= pageWords.length) break;
            const searchWindow = 5;
            let foundMatch = false;
            for (let i = 0; i < searchWindow && (pageWordIdx + i) < pageWords.length; i++) {
                const potentialTargetWord = pageWords[pageWordIdx + i];
                if (isSimilar(normalizeText(spokenWord), normalizeText(potentialTargetWord))) {
                    for (let j = 0; j < i; j++) {
                        if (!sessionWordStatuses[pageWordIdx + j]) newStatuses[pageWordIdx + j] = { status: 'error' };
                    }
                    if (!sessionWordStatuses[pageWordIdx + i]) newStatuses[pageWordIdx + i] = { status: 'correct' };
                    pageWordIdx += i + 1;
                    foundMatch = true;
                    break;
                }
            }
        }
        setLiveWordStatuses(newStatuses);
    }, [liveTranscript, recitationStatus, pageWords, sessionWordStatuses]);

    const handleReciteClick = () => {
        if (recitationStatus === 'recording') {
            userStoppedRecording.current = true;
            recognitionRef.current?.stop();
        } else {
            userStoppedRecording.current = false;
            
            setLiveTranscript('');
            setLiveWordStatuses({});
            setAnalysisResults([]);
            localStorage.removeItem(`recitationAnalysis_p${currentPage}`);
            
            setRecitationStatus('recording');
            setPageProgress(prev => ({
                ...prev,
                [currentPage]: prev[currentPage] === 'completed' ? 'completed' : 'in_progress'
            }));
    
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognitionAPI) {
                setError("Tarayıcınız konuşma tanımayı desteklemiyor.");
                return;
            }
    
            recognitionRef.current = new SpeechRecognitionAPI();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'ar-SA';
    
            recognitionRef.current.onresult = (event) => {
                let fullTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i];
                    fullTranscript += result[0].transcript;
                }
                setLiveTranscript(fullTranscript);
            };
    
            recognitionRef.current.onstart = () => setRecitationStatus('recording');
    
            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error:", event.error, event.message);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    userStoppedRecording.current = true; 
                    setError("Mikrofon-Zugriff verweigert. Bitte überprüfe die Berechtigungen für Chrome in den Handy-Einstellungen.");
                    setRecitationStatus('idle');
                }
            };
    
            recognitionRef.current.onend = () => {
                if (userStoppedRecording.current === false) {
                    console.log("Recognition ended unexpectedly, attempting to restart...");
                    recognitionRef.current?.start();
                } else {
                    setRecitationStatus('recorded');
                    setLiveWordStatuses(prevLive => {
                        const newCorrectWords: WordStatusCollection = { ...sessionWordStatuses };
                        let madeChanges = false;
                        for (const index in prevLive) {
                            if (prevLive[index].status === 'correct') {
                                newCorrectWords[Number(index)] = 'correct';
                                madeChanges = true;
                            }
                        }
                        if (madeChanges) {
                            setSessionWordStatuses(newCorrectWords);
                            localStorage.setItem(`recitationWords_p${currentPage}`, JSON.stringify(newCorrectWords));
                            const lastWordIndex = pageWords.length - 1;
                            if (lastWordIndex >= 0 && newCorrectWords[lastWordIndex]) {
                                setPageProgress(prevProg => ({ ...prevProg, [currentPage]: 'completed' }));
                            }
                        }
                        return prevLive;
                    });
                }
            };

            recognitionRef.current.start();
        }
    };
    
    const handleAnalyze = async () => {
        const fullRecitedText = pageWords.filter((_, idx) => sessionWordStatuses[idx]).join(' ');
        if (!fullRecitedText.trim() || !pageWords.length) {
            setError("Analiz edilecek bir okuma bulunamadı.");
            return;
        }
        setRecitationStatus('analyzing');
        setError(null);
        setCorrectionPopup(null);

        const prompt = `Sen bir Tecvid ve Kur'an kıraat uzmanısın. Kullanıcının okuduğu bir sayfanın dökümünü ve orijinal metnini vereceğim. Görevin, bu ikisini karşılaştırıp sadece önemli telaffuz ve tecvid hatalarını tespit etmektir. Küçük aksan farklılıklarını göz ardı et. Sadece belirgin harf hatalarını veya uygulanmamış tecvid kurallarını (med, idgam, ihfa, izhar, kalkale vb.) listele.
        
        Orijinal Sayfa Metni: "${pageWords.join(' ')}"
        Kullanıcının Okuma Dökümü: "${fullRecitedText}"
        
        Bulduğun her hata için, aşağıdaki bilgileri içeren bir JSON nesnesi oluştur ve bu nesneleri bir dizi içinde döndür. Hata yoksa boş bir dizi döndür.`;

        try {
            const response = await ai.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
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
            const results: PageAnalysis = JSON.parse(response.text);
            setAnalysisResults(results);
            localStorage.setItem(`recitationAnalysis_p${currentPage}`, JSON.stringify(results));
            setRecitationStatus('analyzed');

        } catch (err) {
            console.error("AI analysis error:", err);
            setError("Hata analizi sırasında bir sorun oluştu. Lütfen tekrar deneyin.");
            setRecitationStatus('recorded');
        }
    };

    const jumpToPage = (page: number) => {
        if (page >= 1 && page <= TOTAL_PAGES) {
            recognitionRef.current?.stop();
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
    const combinedWordStatuses = { ...sessionWordStatuses, ...Object.fromEntries(Object.entries(liveWordStatuses).filter(([,v]) => v.status === 'correct').map(([k]) => [k, 'correct'])) };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
             <aside className={`absolute lg:relative z-20 flex flex-col h-full bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{width: '300px'}}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Sureler</h2>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon/></button>
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
                                                <button onClick={() => jumpToPage(page)} className="w-full flex items-center justify-center p-2 text-xs rounded-md border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <PageProgressIndicator status={pageProgress[page]} />
                        _BOS_                     <span className="ml-1.5">{page}</span>
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
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><MenuIcon/></button>
                        <button onClick={handleReset} title="Sıfırla" className="p-2 text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md"><ResetIcon className="w-5 h-5"/></button>
                        <button onClick={handleAnalyze} title="Analiz Et" className="p-2 text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md disabled:opacity-50" disabled={recitationStatus !== 'recorded' && recitationStatus !== 'analyzed'}><AnalyzeIcon className="w-5 h-5"/></button>
                    </div>
                     <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                         {getStatusMessage()}
                    </div>
                    <button onClick={onGoHome} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><HomeIcon/></button>
                </header>

                <main className="flex-1 overflow-y-auto">
                    {isLoadingPage ? <Spinner /> : error ? <p className="m-auto text-center text-red-500">{error}</p> : 
                    <div className="p-4 md:p-8 flex items-center justify-center">
                        <div className="w-full max-w-4xl bg-[#FDFCF8] dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 shadow-lg rounded-lg p-6 border-4 border-double border-amber-400 dark:border-amber-600">
                           <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4 px-2">
                               <span>Cüz {pageData[0]?.juz}</span>
                               <span>{pageData[0]?.surah.name}</span>
                           </div>
                           <div dir="rtl" className="text-center font-amiri" style={{ fontSize: '24px', lineHeight: 2.5 }}>
                                {pageData.map(ayah => (
                                    <div key={ayah.number} className="inline-block">
                                        {ayah.arabicText.split(' ').filter(Boolean).map((word) => {
                                            wordCounter++;
                                            const currentWordIndex = wordCounter;
                                            const liveStatus = liveWordStatuses[currentWordIndex]?.status;
                                            const isAnalyzedError = recitationStatus === 'analyzed' && analyzedErrorIndices.has(currentWordIndex);
                                            const isCorrect = !!combinedWordStatuses[currentWordIndex];
                                            
                                            let className = 'transition-all duration-300 rounded-md px-1';
                                            if (isAnalyzedError) {
                                                className += ' bg-red-200 dark:bg-red-800/50 text-red-700 dark:text-red-300 cursor-pointer';
                                            } else if (isCorrect) {
                                                className += ' text-blue-600 dark:text-blue-400';
                                            } else if (recitationStatus === 'recording' && liveStatus === 'error') {
                                                className += ' text-red-500 underline decoration-wavy decoration-red-500';
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
                                ))}
                           </div>
                           <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">{currentPage}</div>
                        </div>
                    </div>
                    }
                </main>

                <footer className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-inner p-2 flex justify-between items-center">
                    <button onClick={() => jumpToPage(currentPage - 1)} disabled={currentPage === 1 || recitationStatus === 'recording'} className="px-4 py-2 rounded-md disabled:opacity-50 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5"/> <span>Önceki</span></button>
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20">
                         <button onClick={handleReciteClick} disabled={isLoadingPage || recitationStatus === 'analyzing'} className={`flex items-center justify-center w-20 h-20 rounded-full text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed ${recitationStatus === 'recording' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400 shadow-lg animate-pulse' : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-400 shadow-lg'}`} aria-label={recitationStatus === 'recording' ? 'Stop Reciting' : 'Start Reciting'}>
                            {recitationStatus === 'recording' ? <StopCircleIcon className="w-8 h-8"/> : <MicIcon className="w-8 h-8"/>}
                        </button>
                    </div>
                    <button onClick={() => jumpToPage(currentPage + 1)} disabled={currentPage === TOTAL_PAGES || recitationStatus === 'recording'} className="px-4 py-2 rounded-md disabled:opacity-50 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"><span>Sonraki</span> <ChevronRightIcon className="w-5 h-5"/></button>
                </footer>
             </div>
            
            {correctionPopup && <CorrectionPopup data={correctionPopup} onClose={() => setCorrectionPopup(null)} />}
        </div>
    );
};

// --- Sub-components ---
const CorrectionPopup: React.FC<{ data: CorrectionPopupData; onClose: () => void; }> = ({ data, onClose }) => {
    const popupStyle: React.CSSProperties = {
      position: 'absolute',
      top: `${data.rect.bottom + window.scrollY + 12}px`,
      left: `${data.rect.left + window.scrollX + data.rect.width / 2}px`,
      transform: 'translateX(-50%)',
      zIndex: 50,
    };
    return (
      <div style={popupStyle} className="w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border border-gray-200 dark:border-gray-700 animate-scale-in" onClick={e => e.stopPropagation()}>
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white dark:border-b-gray-800" style={{filter: 'drop-shadow(0 -1px 1px rgb(0 0 0 / 0.05))'}}></div>
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
