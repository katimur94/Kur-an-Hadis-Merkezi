import React, { useState, useEffect, useRef } from 'react';
import * as pako from 'pako';
import QuranReader from './components/QuranReader';
import HadithSearch from './components/HadithSearch';
import QuranRecitationChecker from './components/QuranRecitationChecker';
import FiqhChat from './components/FiqhChat';
import RisaleSearch from './components/RisaleSearch';
import NamazVakitleri from './components/NamazVakitleri';
import DuaSearch from './components/DuaSearch';
import PeygamberlerTarihi from './components/PeygamberlerTarihi'; // Import the new component
import { LugatContextProvider } from './components/Lugat';
import { getAyahDetails } from './services/api';
import { GoogleGenAI, Type } from "@google/genai";
import Spinner from './components/Spinner';


type View = 'home' | 'quran' | 'hadith' | 'recitation' | 'fiqh' | 'risale' | 'namaz' | 'dua' | 'peygamberler';

// --- Speech Recognition Types (for cross-browser compatibility) ---
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

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.375 0-9.375 0" /></svg>);
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.95-4.243-1.591 1.591M5.25 12H3m4.243-4.95L6.343 6.343M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>);
const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25c0 5.385 4.365 9.75 9.75 9.75 2.733 0 5.24-.992 7.152-2.644Z" /></svg>);
const FullscreenEnterIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" /></svg>);
const FullscreenExitIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25" /></svg>);
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-12 0v1.5m6 7.5a6 6 0 0 0 3-5.625M12 12.75a6 6 0 0 1-3-5.625" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12a4.5 4.5 0 0 1 9 0v1.5a4.5 4.5 0 0 1-9 0V12Z" /></svg>);
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>);
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" /></svg>);

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [isInfoModalOpen, setInfoModalOpen] = useState(false);
    const [isBackupModalOpen, setBackupModalOpen] = useState(false);
    const [backupTab, setBackupTab] = useState<'create' | 'restore'>('create');
    const [backupCode, setBackupCode] = useState('');
    const [restoreCode, setRestoreCode] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(!!document.fullscreenElement);
    const [theme, setTheme] = useState(() => {
        if (localStorage.getItem('theme') === 'dark') return 'dark';
        if (localStorage.getItem('theme') === 'light') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    // Recite Ayah state
    const [isReciteModalOpen, setReciteModalOpen] = useState(false);
    const [reciteState, setReciteState] = useState<'idle' | 'recording' | 'processing' | 'result' | 'error'>('idle');
    const [recitedTranscript, setRecitedTranscript] = useState('');
    const [identifiedAyah, setIdentifiedAyah] = useState<{ surahName: string; surahNumber: number; ayahNumberInSurah: number; page: number; arabicText: string; overallAyahNumber: number } | null>(null);
    const [reciteError, setReciteError] = useState<string | null>(null);
    const [initialQuranPage, setInitialQuranPage] = useState<number | null>(null);
    const [highlightAyah, setHighlightAyah] = useState<number | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const ai = useRef(new GoogleGenAI({ apiKey: process.env.API_KEY as string }));


    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const navigateTo = (view: View) => {
        setCurrentView(view);
    };

     const handleUrlImport = async () => {
        const hash = window.location.hash;
        if (!hash.startsWith('#/?')) return;

        try {
            const params = new URLSearchParams(hash.substring(3));
            const module = params.get('module');
            const data = params.get('data');
            const type = params.get('type');
            const url = params.get('url');
            const version = params.get('v');

            if (!module) return;

            let importedDataString: string | null = null;
            
            if (version === '2' && data) { // New compressed format
                const binaryString = atob(decodeURIComponent(data));
                const compressed = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    compressed[i] = binaryString.charCodeAt(i);
                }
                importedDataString = pako.inflate(compressed, { to: 'string' });
            } else if (type === 'jsonblob' && url) { // Old JSONBlob format
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Paylaşılan veri kaynağı (${url}) getirilemedi.`);
                }
                const jsonData = await response.json();
                importedDataString = JSON.stringify(jsonData);
            } else if (data) { // Legacy base64 format
                importedDataString = decodeURIComponent(escape(atob(data)));
            }

            if (module && importedDataString) {
                const validModules: View[] = ['hadith', 'fiqh', 'risale', 'namaz', 'dua'];
                
                if (validModules.includes(module as View)) {
                    sessionStorage.setItem(`importedDataFor_${module}`, importedDataString);
                    navigateTo(module as View);
                    showNotification('Paylaşılan içerik başarıyla yüklendi!', 'success');
                } else {
                    throw new Error('Geçersiz modül');
                }
            }
        } catch (error) {
            console.error("Paylaşım linki işlenemedi:", error);
            showNotification('Paylaşım linki geçersiz veya bozuk.', 'error');
        } finally {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    };

    useEffect(() => {
        handleUrlImport();
    }, []);

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };
    
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                showNotification(`Tam ekran modu etkinleştirilemedi: ${err.message}`, 'error');
            });
        } else {
            document.exitFullscreen();
        }
    };

    const goHome = () => {
        setCurrentView('home');
    };

    const handleCreateBackup = () => {
        try {
            const backupData: Record<string, any> = {};
            const keysToBackup = [
                'hadithSearchHistory',
                'fiqhChatHistory',
                'risaleSearchHistory',
                'duaSearchHistory',
                'recitationProgressV2',
                'quranViewMode',
                'quranLastPage',
                'quranReader',
                'quranFontSize',
                'quranFontFamily',
                'recitationLastPage',
                'recitationFontSize',
                'recitationFontFamily',
                'namazVakitleriHistory', // Add prayer times history to backup
                'namazVakitleriLocation', // Add last prayer time location to backup
            ];

            keysToBackup.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        backupData[key] = JSON.parse(item);
                    } catch (e) {
                        backupData[key] = item; // Store as is if not JSON
                    }
                }
            });

            const jsonString = JSON.stringify(backupData);
            const encodedString = btoa(unescape(encodeURIComponent(jsonString)));
            setBackupCode(encodedString);
            showNotification('Yedek kodu başarıyla oluşturuldu!', 'success');
        } catch (error) {
            console.error("Backup creation failed:", error);
            showNotification('Yedek oluşturulurken bir hata oluştu.', 'error');
        }
    };

    const handleRestoreBackup = () => {
        if (!restoreCode.trim()) {
            showNotification('Lütfen geri yüklenecek kodu girin.', 'error');
            return;
        }

        const confirmed = window.confirm(
            "UYARI: Bu işlem, bu cihazdaki mevcut tüm geçmişinizi ve ilerlemenizi geri yüklenen verilerle DEĞİŞTİRECEKTİR. Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?"
        );

        if (confirmed) {
            try {
                const decodedString = decodeURIComponent(escape(atob(restoreCode)));
                const backupData = JSON.parse(decodedString);

                Object.keys(backupData).forEach(key => {
                    const value = backupData[key];
                    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
                });

                showNotification('Veriler başarıyla geri yüklendi! Değişikliklerin etkili olması için sayfa yenilenecek.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (error) {
                console.error("Restore failed:", error);
                showNotification('Geri yükleme başarısız oldu. Kod geçersiz veya bozuk olabilir.', 'error');
            }
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(backupCode).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
     // --- Ayah Recitation Identification Logic ---
    const identifyAyah = async (transcript: string) => {
        setReciteState('processing');
        setReciteError(null);
        try {
            const prompt = `Sen bir Kur'an uzmanısın. Sana Kur'an'dan bir ayetin Arapça okunuşunun dökümünü vereceğim. Görevin, bu ayetin hangi sureye ait olduğunu, sure numarasını ve sure içindeki ayet numarasını tespit etmektir. Cevabını SADECE şu JSON formatında ver: {"surahName": "Al-Fatihah", "surahNumber": 1, "ayahNumberInSurah": 1}`;

            const response = await ai.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `${prompt}\n\nAyet dökümü: "${transcript}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            surahName: { type: Type.STRING },
                            surahNumber: { type: Type.INTEGER },
                            ayahNumberInSurah: { type: Type.INTEGER },
                        },
                        required: ["surahName", "surahNumber", "ayahNumberInSurah"]
                    }
                }
            });

            const result = JSON.parse(response.text);
            const details = await getAyahDetails(result.surahNumber, result.ayahNumberInSurah);

            setIdentifiedAyah({
                ...result,
                page: details.page,
                arabicText: details.arabicText,
                overallAyahNumber: details.number
            });
            setReciteState('result');

        } catch (err) {
            console.error("Ayah identification failed:", err);
            setReciteError("Ayet tespit edilemedi. Lütfen daha net bir şekilde tekrar okuyun veya daha uzun bir bölüm okumayı deneyin.");
            setReciteState('error');
        }
    };

    const handleReciteButtonClick = () => {
        if (reciteState === 'recording') {
            recognitionRef.current?.stop(); // This will trigger the 'onend' event
        } else {
            const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognitionAPI) {
                setReciteError("Tarayıcınız ses tanımayı desteklemiyor.");
                setReciteState('error');
                return;
            }
            
            recognitionRef.current = new SpeechRecognitionAPI();
            recognitionRef.current.lang = 'ar-SA';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setRecitedTranscript(transcript);
                identifyAyah(transcript);
            };
            
            recognitionRef.current.onstart = () => {
                setReciteState('recording');
                setReciteError(null);
                setIdentifiedAyah(null);
            };

            recognitionRef.current.onend = () => {
                // FIX: Use functional setState to get the latest state and avoid stale closure issues
                // that cause TypeScript control flow analysis errors.
                setReciteState(currentReciteState => {
                    if (currentReciteState === 'recording') { // Stopped manually before result
                        return 'processing';
                    }
                    return currentReciteState;
                });
            };
            
            recognitionRef.current.onerror = (event) => {
                 setReciteError(`Mikrofon hatası: ${event.error}. Lütfen tarayıcı izinlerini kontrol edin.`);
                 setReciteState('error');
            };

            recognitionRef.current.start();
        }
    };

    const handleNavigateToAyah = () => {
        if (identifiedAyah) {
            setInitialQuranPage(identifiedAyah.page);
            setHighlightAyah(identifiedAyah.overallAyahNumber);
            navigateTo('quran');
            closeReciteModal();
        }
    };

    const closeReciteModal = () => {
        recognitionRef.current?.stop();
        setReciteModalOpen(false);
        // Reset state for next time
        setTimeout(() => {
            setReciteState('idle');
            setIdentifiedAyah(null);
            setReciteError(null);
            setRecitedTranscript('');
        }, 300); // delay to allow modal to close gracefully
    };

    let content;

    if (currentView === 'quran') {
        content = <QuranReader onGoHome={goHome} initialPage={initialQuranPage} highlightAyahNumber={highlightAyah} />;
    } else if (currentView === 'hadith') {
        content = <HadithSearch onGoHome={goHome} />;
    } else if (currentView === 'recitation') {
        content = <QuranRecitationChecker onGoHome={goHome} />;
    } else if (currentView === 'fiqh') {
        content = <FiqhChat onGoHome={goHome} />;
    } else if (currentView === 'risale') {
        content = <RisaleSearch onGoHome={goHome} />;
    } else if (currentView === 'namaz') {
        content = <NamazVakitleri onGoHome={goHome} />;
    } else if (currentView === 'dua') {
        content = <DuaSearch onGoHome={goHome} />;
    } else if (currentView === 'peygamberler') {
        content = <PeygamberlerTarihi onGoHome={goHome} />;
    } else {
        content = (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-gray-800 dark:text-gray-200">
                 {notification && (
                    <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-[100] animate-fade-in ${notification.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>
                        {notification.message}
                    </div>
                )}
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-2">Dijital Medrese</h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400">Yapay Zeka Destekli Kişisel İlim Rehberiniz</p>
                </header>
                <main className="w-full max-w-6xl flex flex-col items-center">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                        <button onClick={() => navigateTo('quran')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Kur'an-ı Kerim Okuyucu</h2>
                            <p className="text-gray-600 dark:text-gray-300">Kur'an'ı Kerim'i farklı kârilerle okuyun, dinleyin ve mealini inceleyin.</p>
                        </button>
                        <button onClick={() => navigateTo('hadith')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Yapay Zeka ile Hadis Ara</h2>
                            <p className="text-gray-600 dark:text-gray-300">İlgilendiğiniz konulardaki hadisleri yapay zeka yardımıyla bulun ve fıkhi analizlerini inceleyin.</p>
                        </button>
                        <button onClick={() => navigateTo('recitation')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Kıraat Asistanı (Tecvid)</h2>
                            <p className="text-gray-600 dark:text-gray-300">Ayetleri okuyun ve yapay zeka ile telaffuz ve tecvid hatalarınızı tespit edin.</p>
                        </button>
                        <button onClick={() => navigateTo('fiqh')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Fıkıh Soru & Cevap</h2>
                            <p className="text-gray-600 dark:text-gray-300">Fıkhi sorularınıza dört mezhebe göre kaynaklarıyla birlikte, yapay zeka destekli cevaplar alın.</p>
                        </button>
                         <button onClick={() => navigateTo('risale')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Risale-i Nur'da Ara</h2>
                            <p className="text-gray-600 dark:text-gray-300">Sorularınıza Risale-i Nur külliyatından yapay zeka destekli, kaynaklı cevaplar bulun.</p>
                        </button>
                         <button onClick={() => navigateTo('namaz')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Namaz Vakitleri</h2>
                            <p className="text-gray-600 dark:text-gray-300">Bulunduğunuz konuma göre günlük namaz vakitlerini ve kalan süreyi öğrenin.</p>
                        </button>
                        <button onClick={() => navigateTo('dua')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Dua & Zikir Arama</h2>
                            <p className="text-gray-600 dark:text-gray-300">Sünnet'ten duaları ve zikirleri anlamları, okunuşları ve kaynaklarıyla bulun.</p>
                        </button>
                        <button onClick={() => navigateTo('peygamberler')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Peygamberler Tarihi</h2>
                            <p className="text-gray-600 dark:text-gray-300">Peygamberlerin hayatını, önemli olayları ve zaman çizelgesini interaktif olarak keşfedin.</p>
                        </button>
                    </div>
                     <div className="mt-8 flex w-full flex-col items-center space-y-4 px-4 md:flex-row md:justify-center md:space-x-8 md:space-y-0">
                        {/* Icons Row on top for mobile */}
                        <div className="flex space-x-4 md:order-2">
                            <button onClick={toggleTheme} title="Temayı Değiştir" className="p-3 bg-transparent text-gray-600 dark:text-gray-400 font-semibold rounded-full border-2 border-gray-400 dark:border-gray-500 hover:bg-gray-400 hover:text-white dark:hover:bg-gray-500 dark:hover:text-gray-900 transition-colors duration-300">
                                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                            </button>
                            <button onClick={() => setReciteModalOpen(true)} title="Ayet Bul" className="p-3 bg-transparent text-gray-600 dark:text-gray-400 font-semibold rounded-full border-2 border-gray-400 dark:border-gray-500 hover:bg-gray-400 hover:text-white dark:hover:bg-gray-500 dark:hover:text-gray-900 transition-colors duration-300">
                            <MicIcon className="w-6 h-6" />
                        </button>
                            <button onClick={toggleFullScreen} title={isFullScreen ? "Tam Ekrandan Çık" : "Tam Ekran"} className="p-3 bg-transparent text-gray-600 dark:text-gray-400 font-semibold rounded-full border-2 border-gray-400 dark:border-gray-500 hover:bg-gray-400 hover:text-white dark:hover:bg-gray-500 dark:hover:text-gray-900 transition-colors duration-300">
                            {isFullScreen ? <FullscreenExitIcon className="w-6 h-6" /> : <FullscreenEnterIcon className="w-6 h-6" />}
                        </button>
                        </div>
                        
                        {/* Text Buttons Container */}
                        <div className="flex w-full max-w-sm flex-col items-stretch space-y-4 md:order-1 md:w-auto md:flex-row md:space-y-0 md:space-x-4">
                            <button onClick={() => setInfoModalOpen(true)} className="px-6 py-3 bg-transparent text-teal-600 dark:text-teal-400 font-semibold rounded-lg border-2 border-teal-600 dark:border-teal-400 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-400 dark:hover:text-gray-900 transition-colors duration-300">
                                Uygulamayı Tanı
                            </button>
                            <button onClick={() => setBackupModalOpen(true)} className="px-6 py-3 bg-transparent text-amber-600 dark:text-amber-400 font-semibold rounded-lg border-2 border-amber-600 dark:border-amber-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-400 dark:hover:text-gray-900 transition-colors duration-300">
                                Yedekle & Geri Yükle
                            </button>
                        </div>
                    </div>
                </main>
                <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                   <p>&copy; 2025 - Timur Kalaycı. Hayır dualarınızı beklerim. Rabbim bu Site vesilesiyle ilminizi artırsın.</p>
                </footer>

                {isBackupModalOpen && (
                     <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setBackupModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl">
                                <h2 className="text-2xl font-bold">Veri Yönetimi</h2>
                                <button onClick={() => setBackupModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <CloseIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex border-b dark:border-gray-700">
                                <button onClick={() => setBackupTab('create')} className={`flex-1 p-3 font-medium ${backupTab === 'create' ? 'border-b-2 border-teal-500 text-teal-600' : ''}`}>Yedek Oluştur</button>
                                <button onClick={() => setBackupTab('restore')} className={`flex-1 p-3 font-medium ${backupTab === 'restore' ? 'border-b-2 border-amber-500 text-amber-600' : ''}`}>Yedekten Geri Yükle</button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                {backupTab === 'create' ? (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Tüm Uygulama Verilerinizi Yedekleyin</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Bu işlem, tüm arama geçmişlerinizi, namaz vakti geçmişinizi ve Kur'an okuma ilerlemenizi/ayarlarınızı tek bir koda dönüştürür. Bu kodu güvenli bir yere kaydedin ve başka bir cihaza verilerinizi aktarmak için kullanın.</p>
                                        <button onClick={handleCreateBackup} className="w-full px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                                            Yedekleme Kodu Oluştur
                                        </button>
                                        {backupCode && (
                                            <div className="mt-4 space-y-2">
                                                <textarea readOnly value={backupCode} className="w-full h-40 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-xs" />
                                                <button onClick={handleCopyCode} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                                                    {isCopied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                                                    <span>{isCopied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                         <h3 className="text-lg font-semibold">Yedekten Verilerinizi Geri Yükleyin</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Daha önce oluşturduğunuz yedekleme kodunu aşağıya yapıştırarak tüm verilerinizi bu cihaza aktarabilirsiniz. <strong className="text-red-500">Bu işlem, bu cihazdaki mevcut verilerin üzerine yazılacaktır.</strong></p>
                                        <textarea
                                            value={restoreCode}
                                            onChange={(e) => setRestoreCode(e.target.value)}
                                            placeholder="Yedekleme kodunu buraya yapıştırın..."
                                            className="w-full h-40 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <button onClick={handleRestoreBackup} className="w-full px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors">
                                            Verileri Geri Yükle
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                )}
                
                {isInfoModalOpen && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setInfoModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl">
                                <h2 className="text-2xl font-bold">Dijital Medrese Kullanım Rehberi</h2>
                                <button onClick={() => setInfoModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon className="w-6 h-6" /></button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
                                <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-3">Yeni Özellikler</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-start">
                                            <MicIcon className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1 mr-3" />
                                            <div>
                                                <strong>Sesle Ayet Bulma:</strong> Anasayfadaki <MicIcon className="w-5 h-5 inline-block mx-1" /> ikonuna tıklayarak Kur'an'dan bir ayet okuyun. Yapay zeka, okuduğunuz ayeti anında tespit eder ve sizi Kur'an Okuyucu'da doğrudan o ayete götürmeyi teklif eder.
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <FullscreenEnterIcon className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1 mr-3" />
                                            <div>
                                                <strong>Tam Ekran Modu:</strong> Anasayfadaki <FullscreenEnterIcon className="w-5 h-5 inline-block mx-1" /> ikonu ile uygulamayı tüm ekranı kaplayacak şekilde kullanarak daha odaklanmış bir deneyim yaşayabilirsiniz.
                                            </div>
                                        </li>
                                    </ul>
                                </section>
                                <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-3">Yapay Zeka Destekli Araştırma Modülleri</h3>
                                    <ul className="list-disc list-inside space-y-3">
                                        <li><strong>Dua & Zikir Arama:</strong> Bir konu (örn: "vesvese için zikir") veya durum (örn: "tuvalete girerken") hakkında Sünnet'ten duaları ve zikirleri aratın. Yapay zeka, duanın Arapça aslını, Latin harfleriyle okunuşunu, Türkçe anlamını, ne zaman okunacağını ve kaynak hadis/ayetini size sunar.</li>
                                        <li><strong>Hadis Araştırma:</strong> Bir konu (örn: "sadakanın fazileti") hakkında hadisleri kaynaklarıyla aratın. <strong className="text-amber-600 dark:text-amber-400">Önemli:</strong> Listelenen bir hadise tıkladığınızda, yapay zeka o hadis özelinde dört büyük mezhep imamının fıkhi yorumlarını ve hükümlerini kaynaklarıyla birlikte size sunar.</li>
                                        <li><strong>Fıkıh Soru & Cevap:</strong> Fıkhi bir soru sorun (örn: "Seferi namazı nasıl kılınır?"). Yapay zeka, sorunuza dört mezhebin görüşlerini, delilleri olan ayet ve hadisleri, ve her bilginin kaynağını içeren yapılandırılmış, detaylı bir cevap oluşturur. <strong className="text-amber-600 dark:text-amber-400">Yeni:</strong> "İslam'ın şartları" veya "Namazın şartları" gibi temel konuları sorduğunuzda, cevaplar her bir maddeyi ayrı ayrı inceleyebileceğiniz, tıklanarak açılan interaktif bir liste formatında sunulur.</li>
                                        <li><strong>Risale-i Nur'da Ara:</strong> Merak ettiğiniz bir konuyu (örn: "Şükür hakikati") sorun. Yapay zeka, Risale-i Nur Külliyatı'ndan konunun özetini, ilgili bahisleri ve temel prensipleri (düsturlar, esaslar) kaynaklarıyla birlikte derleyerek sunar.</li>
                                    </ul>
                                </section>
                                 <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-3">Peygamberler Tarihi</h3>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>İnteraktif Zaman Çizelgesi:</strong> Peygamber seçin ve hayatındaki önemli bir döneme gitmek için zaman çizelgesini kullanın.</li>
                                        <li><strong>Yapay Zeka ile Bilgi Üretimi:</strong> Seçtiğiniz peygamber ve yıl için önemli bir olayı, Kur'an, Hadis ve Siyer kaynaklarından delilleriyle birlikte öğrenin.</li>
                                        <li><strong>Detaylı Şecere:</strong> Peygamberlerin soy ağacını, atalarını ve çocuklarını inceleyerek peygamberlik zincirini takip edin.</li>
                                        <li><strong>Görsel Paylaşım:</strong> Öğrendiğiniz olayları, kaynaklarıyla birlikte estetik bir sunum kartı olarak indirin ve sosyal medyada paylaşın.</li>
                                    </ul>
                                </section>
                                 <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-3">Namaz Vakitleri</h3>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Otomatik Konum Tespiti:</strong> Uygulama ilk açıldığında, tarayıcınızdan konum izni isteyecektir. İzin verdiğiniz takdirde, bulunduğunuz yere en uygun namaz vakitleri otomatik olarak yüklenir.</li>
                                        <li><strong>Manuel Arama:</strong> İzin vermediyseniz veya farklı bir konum aramak isterseniz, "Şehir" ve "Ülke" bilgilerini girerek istediğiniz yerin vakitlerini arayabilirsiniz.</li>
                                        <li><strong>Geri Sayım & Tarih:</strong> Bir sonraki namaz vaktine kalan süreyi canlı olarak gösterir ve Miladi, Rumi, Hicri takvimlere göre güncel tarihi belirtir.</li>
                                        <li><strong>Geçmiş ve Paylaşım:</strong> Yaptığınız aramalar, `Geçmiş` paneline otomatik olarak kaydedilir. Buradan önceki bir konumu tek tıkla tekrar yükleyebilir, silebilir veya `Paylaş` ikonuyla kısa bir paylaşım linki oluşturabilirsiniz. Bu linki bir arkadaşınıza gönderdiğinizde, linke tıklayan kişi doğrudan o konumun namaz vakitlerini görür.</li>
                                    </ul>
                                </section>
                                <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-3">Kur'an-ı Kerim Okuyucu</h3>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>İki Farklı Görünüm:</strong> "Kur'an Görünümü" (geleneksel Mushaf düzeni) ve "Meal Görünümü" (her ayetin altında meali) arasında geçiş yapabilirsiniz.</li>
                                        <li><strong>Gelişmiş Sesli Dinleme:</strong> Cüz, Sure, Sayfa veya tek bir Ayet bazında dinleme yapabilirsiniz. Cüz veya Sure dinlerken, o an okunan ayet metin üzerinde canlı olarak vurgulanır ve okuma bir sonraki sayfaya geçtiğinde sayfa otomatik olarak değişir.</li>
                                        <li><strong>Kişiselleştirme:</strong> `Ayarlar` menüsünden dilediğiniz kâriyi seçebilir, Arapça metnin yazı tipini ve boyutunu göz zevkinize göre ayarlayabilirsiniz.</li>
                                    </ul>
                                </section>
                                <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-3">Kıraat Asistanı (Tecvid & Telaffuz)</h3>
                                     <p className="mb-2">Yapay zeka ile Kur'an okumanızı analiz ederek tecvid ve telaffuz hatalarınızı tespit etmenize yardımcı olur.</p>
                                    <ol className="list-decimal list-inside space-y-2 pl-2">
                                        <li><strong>Sayfayı Seçin:</strong> Sol menüden okumak istediğiniz sure ve sayfayı seçin.</li>
                                        <li><strong>Kaydı Başlatın:</strong> Ekranın altındaki büyük `Mikrofon` ikonuna basın. Tarayıcınız mikrofon erişim izni isteyebilir.</li>
                                        <li><strong>Okuyun:</strong> Sayfayı sesli olarak okumaya başlayın. Doğru telaffuz ettiğiniz kelimeler anlık olarak mavi ile vurgulanacaktır.</li>
                                        <li><strong>Kaydı Durdurun:</strong> Okumanız bittiğinde, kırmızıya dönen `Durdur` ikonuna tekrar basın.</li>
                                        <li><strong>Analiz Edin:</strong> Üst menüdeki `Analiz Et` (hedef ikonu) butonuna basın. Yapay zeka, kaydınızı orijinal metinle karşılaştıracaktır.</li>
                                        <li><strong>Sonuçları İnceleyin:</strong> Analiz tamamlandığında, tespit edilen hatalar kırmızı ile vurgulanır. Hatalı bir kelimeye tıkladığınızda, hatanın ne olduğunu, nasıl düzeltileceğini ve ilgili tecvid kuralını açıklayan bir pencere açılır.</li>
                                        <li><strong>İlerleme Takibi:</strong> Kenar çubuğunda, her sayfanın yanında ilerleme durumunuzu (○ Başlanmadı, ▶ Devam Ediyor, ✔ Tamamlandı) görebilirsiniz.</li>
                                    </ol>
                                </section>
                                <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-3">Ortak Özellikler</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start">
                                            <ShareIcon className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1 mr-3" />
                                            <div>
                                                <strong>Geçmiş ve Paylaşım:</strong> Tüm araştırma modüllerinde `Geçmiş` paneli bulunur. Önceki aramalarınızı yeniden adlandırabilir, silebilir veya <ShareIcon className="w-5 h-5 inline-block mx-1" /> ikonuyla kısa bir paylaşım linki oluşturabilirsiniz. Bu linki bir arkadaşınıza gönderdiğinizde, linke tıklayan kişi doğrudan sizin gördüğünüz cevabı kendi ekranında görür ve bu arama kendi geçmişine de eklenir.
                                            </div>
                                        </li>
                                         <li className="flex items-start">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>
                                             <div>
                                                <strong>Yedekle & Geri Yükle:</strong> Anasayfadaki bu özellik ile tüm uygulama verilerinizi (geçmişler, ayarlar, kıraat ilerlemesi) tek bir koda dönüştürüp yedekleyebilirsiniz. Bu kodu kullanarak verilerinizi başka bir cihaza kolayca aktarabilirsiniz. <strong className="text-red-500">Uyarı:</strong> Geri yükleme, mevcut verilerin üzerine yazar.
                                             </div>
                                        </li>
                                        <li className="flex items-start">
                                            <BookOpenIcon className="w-6 h-6 text-teal-500 flex-shrink-0 mt-1 mr-3" />
                                            <div>
                                                <strong>Lügat (Sözlük) Aracı:</strong> Ekranın bir köşesinde sürekli duran <span className="inline-block align-middle w-6 h-6 bg-teal-600 text-white rounded-full p-1 mx-1"><BookOpenIcon className="w-full h-full" /></span> ikonlu bir baloncuk göreceksiniz. Bu balonu basılı tutarak ekranın istediğiniz yerine sürükleyebilir ve balona tıklayarak açılan pencereye anlamını merak ettiğiniz kelimeyi yazıp aratabilirsiniz. <strong className="text-amber-600 dark:text-amber-400">Yeni:</strong> Lügat'ta aradığınız kelimeler artık otomatik olarak kaydedilir. Uygulamanın diğer bölümlerinde (Meal, Hadis, Fıkıh, Risale metinleri) bu kelimelere denk geldiğinizde, kelimelerin altı noktalı bir çizgiyle işaretlenir. Farenizi bu kelimenin üzerine getirdiğinizde, lügat anlamı anında küçük bir pencerede belirir, böylece okuma akışınız bozulmaz.
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <div className="flex-shrink-0 mt-1 mr-3">
                                                <div className="inline-flex items-center space-x-1 p-1 rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <SunIcon className="w-5 h-5 text-yellow-500" />
                                                    <MoonIcon className="w-5 h-5 text-blue-400" />
                                                </div>
                                            </div>
                                            <div>
                                                <strong>Tema Seçimi:</strong> Anasayfadaki Ay/Güneş <div className="inline-flex items-center space-x-1 mx-1"><SunIcon className="w-5 h-5 text-yellow-500" /><span>/</span><MoonIcon className="w-5 h-5 text-blue-400" /></div> ikonuyla açık ve koyu tema arasında geçiş yapabilirsiniz.
                                            </div>
                                        </li>
                                    </ul>
                                </section>
                            </div>
                        </div>
                    </div>
                )}
                 {isReciteModalOpen && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={closeReciteModal}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg min-h-[350px] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                                <h2 className="text-xl font-bold">Sesle Ayet Bul</h2>
                                <button onClick={closeReciteModal} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon/></button>
                            </div>
                            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                                {reciteState === 'idle' && (
                                    <>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">Bulmak istediğiniz ayeti okumak için aşağıdaki mikrofona tıklayın.</p>
                                        <button onClick={handleReciteButtonClick} className="w-20 h-20 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-teal-700 transition-colors">
                                            <MicIcon className="w-10 h-10" />
                                        </button>
                                    </>
                                )}
                                {reciteState === 'recording' && (
                                     <>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">Dinleniyor... Bitince tekrar basın.</p>
                                        <button onClick={handleReciteButtonClick} className="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors animate-pulse">
                                            <div className="w-8 h-8 bg-white rounded-md"></div>
                                        </button>
                                    </>
                                )}
                                {reciteState === 'processing' && (
                                    <>
                                        <Spinner />
                                        <p className="text-gray-600 dark:text-gray-400 mt-4">Ayet tespit ediliyor...</p>
                                    </>
                                )}
                                {reciteState === 'result' && identifiedAyah && (
                                    <div className="w-full">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tespit Edilen Ayet:</p>
                                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6">
                                            <p dir="rtl" className="font-amiri text-2xl mb-2">{identifiedAyah.arabicText}</p>
                                            <p className="font-semibold">{identifiedAyah.surahName} Suresi, {identifiedAyah.ayahNumberInSurah}. Ayet</p>
                                        </div>
                                        <div className="flex justify-center space-x-4">
                                            <button onClick={closeReciteModal} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500">İptal</button>
                                            <button onClick={handleNavigateToAyah} className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700">Ayet'e Git</button>
                                        </div>
                                    </div>
                                )}
                                 {reciteState === 'error' && (
                                    <div className="w-full">
                                        <p className="text-red-500 mb-6">{reciteError}</p>
                                        <button onClick={() => setReciteState('idle')} className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700">Tekrar Dene</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <LugatContextProvider>
            {content}
        </LugatContextProvider>
    );
};

// FIX: Add default export for the App component.
export default App;
