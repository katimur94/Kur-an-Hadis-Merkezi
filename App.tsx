// FIX: Corrected the import statement for React and its hooks.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pako from 'pako';
import axios from 'axios';
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
// FIX: Added 'Type' to the import from "@google/genai" to be used in the response schema.
import { GoogleGenAI, Type } from "@google/genai";
import Spinner from './components/Spinner';
import type { HadithResult, SourceInfo } from './types';


type View = 'home' | 'quran' | 'hadith' | 'recitation' | 'fiqh' | 'risale' | 'namaz' | 'dua' | 'peygamberler';

// --- Dashboard Types ---
interface PrayerData {
    times: { [key: string]: string };
    nextPrayerName: string;
    timeRemaining: string;
}

interface AyetInspiration {
    type: 'Ayet';
    arabicText: string;
    text: string;
    source: string;
    surahNumber: number;
    ayahInSurah: number;
}
interface HadisInspiration {
    type: 'Hadis';
    arabicText: string;
    text: string; // This is the turkishText for display
    source: string;
    narrator: string;
    sourceDetails: SourceInfo;
}
type Inspiration = AyetInspiration | HadisInspiration;

interface ContinueItem {
    key: string;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    action: () => void;
}

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

// --- ICONS ---
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.375 0-9.375 0" /></svg>);
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.95-4.243-1.591 1.591M5.25 12H3m4.243-4.95L6.343 6.343M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>);
const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25c0 5.385 4.365 9.75 9.75 9.75 2.733 0 5.24-.992 7.152-2.644Z" /></svg>);
const FullscreenEnterIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" /></svg>);
const FullscreenExitIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25" /></svg>);
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-12 0v1.5m6 7.5a6 6 0 0 0 3-5.625M12 12.75a6 6 0 0 1-3-5.625" /><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12a4.5 4.5 0 0 1 9 0v1.5a4.5 4.5 0 0 1-9 0V12Z" /></svg>);
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>);
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" /></svg>);
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>);
const ChatBubbleLeftRightIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a.75.75 0 0 1-1.06 0l-3.72-3.72A2.25 2.25 0 0 1 9 16.5v-4.286c0-.97.616-1.813 1.5-2.097m6.75 0a2.25 2.25 0 0 0-2.25-2.25H9a2.25 2.25 0 0 0-2.25 2.25m6.75 0c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72 3.72a.75.75 0 0 1-1.06 0l-3.72-3.72A2.25 2.25 0 0 1 9 16.5v-4.286c0-.97.616-1.813 1.5-2.097" /></svg>);
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);
const HandRaisedIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.832.168-1.757 1.757M12 21.75v-2.25m-5.832.168 1.757-1.757M4.168 12H6.42m12.16 0h2.252m-5.832 5.832 1.757 1.757M6.168 6.168 4.41 4.41m1.757 1.757 1.757 1.757M12 6.75v2.25m-1.757 3.433 1.757-1.757" /></svg>);
const GlobeAltIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c.24 0 .468.02.69.058M12 3a9.004 9.004 0 0 1 8.716 6.747M12 3a9.004 9.004 0 0 0-8.716 6.747M12 3c-.24 0-.468.02-.69.058m18 9c0 5.14-4.2 9.29-9.428 9.29-5.228 0-9.428-4.15-9.428-9.29s4.2-9.29 9.428-9.29C17.8 2.71 22 6.86 22 12Z" /></svg>);


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
    const ai = useRef(new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string }));

    // --- Dashboard State ---
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [prayerLocation, setPrayerLocation] = useState<string | null>(null);
    const [isPrayerLoading, setIsPrayerLoading] = useState(true);
    const [prayerMessage, setPrayerMessage] = useState<string | null>(null);
    const [inspiration, setInspiration] = useState<Inspiration | null>(null);
    const [isInspirationLoading, setIsInspirationLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const [continueItems, setContinueItems] = useState<ContinueItem[]>([]);
    const prayerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


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

    // --- Dashboard Data Fetching ---
    const fetchPrayerTimes = useCallback(async (lat: number, lon: number) => {
        try {
            const geoResponse = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=tr`);
            const address = geoResponse.data.address;
            const city = address.city || address.town || address.village || address.state;
            const country = address.country;
            setPrayerLocation(`${city}, ${country}`);

            const timesResponse = await axios.get(`https://api.aladhan.com/v1/timings`, { params: { latitude: lat, longitude: lon, method: 3 } });
            if (timesResponse.data.code === 200) {
                const times = timesResponse.data.data.timings;
                
                const prayerNameMapping: { [key: string]: string } = { Fajr: 'Sabah', Dhuhr: 'Öğle', Asr: 'İkindi', Maghrib: 'Akşam', Isha: 'Yatsı' };
                
                const allPrayerEvents = Object.entries(times)
                    .filter(([name]) => prayerNameMapping[name])
                    .map(([name, time]) => {
                        const [h, m] = (time as string).split(':').map(Number);
                        const prayerDate = new Date();
                        prayerDate.setHours(h, m, 0, 0);
                        return { name, date: prayerDate, displayName: prayerNameMapping[name] };
                    });

                const [fajrH, fajrM] = (times.Fajr as string).split(':').map(Number);
                const fajrTomorrow = new Date();
                fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
                fajrTomorrow.setHours(fajrH, fajrM, 0, 0);
                allPrayerEvents.push({ name: 'Fajr', date: fajrTomorrow, displayName: 'Sabah' });
                
                allPrayerEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

                const calculateCountdown = () => {
                    const now = new Date();
                    const nextPrayer = allPrayerEvents.find(p => p.date > now);
                    
                    const passedPrayers = allPrayerEvents.filter(p => p.date <= now);
                    const lastPassedPrayer = passedPrayers.length > 0 ? passedPrayers[passedPrayers.length - 1] : null;

                    let message: string | null = null;
                    
                    if (lastPassedPrayer) {
                        const diffSinceMs = now.getTime() - lastPassedPrayer.date.getTime();
                        const diffSinceMins = diffSinceMs / 60000;
                        if (diffSinceMins < 60) {
                             message = `Vakit girdi. Peygamberimiz (s.a.v.) bize namazı vaktinde kılmayı tavsiye ediyor.`;
                        }
                    }

                    if (nextPrayer) {
                        const diffMs = nextPrayer.date.getTime() - now.getTime();
                        const diffMins = diffMs / 60000;
                        if (diffMins < 30) {
                            message = `Vakit yaklaşıyor, hazırlansan iyi olur.`;
                        }
                        
                        const hours = Math.floor(diffMs / 3600000);
                        const minutes = Math.floor((diffMs % 3600000) / 60000);
                        const seconds = Math.floor((diffMs % 60000) / 1000);

                        setPrayerData({
                            times,
                            nextPrayerName: nextPrayer.displayName,
                            timeRemaining: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                        });
                    }
                     setPrayerMessage(message);
                };
                
                calculateCountdown();
                if (prayerIntervalRef.current) clearInterval(prayerIntervalRef.current);
                prayerIntervalRef.current = setInterval(calculateCountdown, 1000);
            }
        } catch (e) {
            console.error("Prayer times fetch error:", e);
        } finally {
            setIsPrayerLoading(false);
        }
    }, []);

    const fetchInspiration = useCallback(async () => {
        try {
            const cached = sessionStorage.getItem('dailyInspiration');
            const today = new Date().toDateString();
            if (cached) {
                const { date, data } = JSON.parse(cached);
                if (date === today) {
                    setInspiration(data);
                    setIsInspirationLoading(false);
                    return;
                }
            }
            const prompt = `Bana Türkçe, ilham verici bir Kur'an ayeti VEYA sahih bir Hadis-i Şerif ver. Cevabın SADECE JSON formatında olmalı ve başka hiçbir metin içermemeli.

- Eğer Ayet seçersen, format şu olmalı:
{"type": "Ayet", "arabicText": "...", "text": "...", "source": "Bakara, 255", "surahNumber": 2, "ayahInSurah": 255}

- Eğer Hadis seçersen, format şu olmalı:
{"type": "Hadis", "arabicText": "...", "text": "...", "source": "Buhari, İman, 1", "narrator": "...", "sourceDetails": { "book": "Sahih-i Buhari", "chapter": "İman", "hadithNumber": "1" }}

'text' alanı her zaman Türkçe anlamı içermelidir.`;
            
            const response = await ai.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            let jsonString = response.text;
            const match = jsonString.match(/```(json)?\s*([\s\S]*?)\s*```/);
            if (match && match[2]) {
                jsonString = match[2];
            }
            jsonString = jsonString.trim();

            const data = JSON.parse(jsonString);
            setInspiration(data);
            sessionStorage.setItem('dailyInspiration', JSON.stringify({ date: today, data }));
        } catch (e) {
            console.error("Inspiration fetch error:", e);
             setInspiration({
                type: 'Ayet',
                arabicText: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ',
                text: 'Allah, O’ndan başka ilah yoktur; diridir, her şeyin varlığı O’na bağlı ve dayalıdır.',
                source: 'Bakara, 255',
                surahNumber: 2,
                ayahInSurah: 255
            });
        } finally {
            setIsInspirationLoading(false);
        }
    }, []);

    const handleInspirationClick = async () => {
        if (!inspiration || isNavigating) return;

        setIsNavigating(true);

        try {
            if (inspiration.type === 'Ayet') {
                const details = await getAyahDetails(inspiration.surahNumber, inspiration.ayahInSurah);
                setInitialQuranPage(details.page);
                setHighlightAyah(details.number);
                navigateTo('quran');
            } else if (inspiration.type === 'Hadis') {
                const hadithResult: HadithResult = {
                    arabicText: inspiration.arabicText,
                    turkishText: inspiration.text, // The main 'text' field is used as turkishText
                    narrator: inspiration.narrator,
                    source: inspiration.sourceDetails
                };

                const historyItem = {
                    id: `daily-${new Date().toISOString().split('T')[0]}`,
                    question: `Günün Hadisi: ${inspiration.source}`,
                    customTitle: `Günün Hadisi: ${inspiration.source}`,
                    responses: [{
                        hadiths: [hadithResult],
                        hasMore: false,
                    }]
                };

                sessionStorage.setItem('importedDataFor_hadith', JSON.stringify(historyItem));
                navigateTo('hadith');
            }
        } catch (err) {
            console.error("Navigation from inspiration card failed:", err);
            showNotification('İlgili içeriğe gidilemedi.', 'error');
            setIsNavigating(false);
        }
        // NOTE: No need to set isNavigating to false on success, as the component will unmount.
    };

    const loadContinueItems = useCallback(() => {
        const items: ContinueItem[] = [];
        const quranPage = localStorage.getItem('quranLastPage');
        if (quranPage) {
            items.push({
                key: 'quran', label: 'Kur\'an Okumaya Devam Et', sublabel: `Sayfa ${quranPage}`, icon: <BookOpenIcon className="w-5 h-5"/>,
                action: () => { setInitialQuranPage(parseInt(quranPage)); navigateTo('quran'); }
            });
        }
        const recitationPage = localStorage.getItem('recitationLastPage');
        if (recitationPage) {
            items.push({
                key: 'recitation', label: 'Kıraat Alıştırması', sublabel: `Sayfa ${recitationPage}`, icon: <MicIcon className="w-5 h-5"/>,
                action: () => { navigateTo('recitation'); }
            });
        }
        try {
            const fiqhHistory = JSON.parse(localStorage.getItem('fiqhChatHistory') || '[]');
            if (fiqhHistory.length > 0) {
                const lastItem = fiqhHistory[0];
                items.push({
                    key: 'fiqh', label: 'Son Fıkıh Sorusu', sublabel: lastItem.customTitle || lastItem.question, icon: <ChatBubbleLeftRightIcon className="w-5 h-5"/>,
                    action: () => {
                        sessionStorage.setItem('importedDataFor_fiqh', JSON.stringify(lastItem));
                        navigateTo('fiqh');
                    }
                });
            }
        } catch (e) {}

        setContinueItems(items.slice(0, 3));
    }, []);


    useEffect(() => {
        handleUrlImport();

        // Load dashboard data only when on home view
        if(currentView === 'home') {
            setIsPrayerLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => fetchPrayerTimes(position.coords.latitude, position.coords.longitude),
                () => { // On error, use last known location or default
                    const savedLocation = localStorage.getItem('namazVakitleriLocation');
                    if(savedLocation){
                        const loc = JSON.parse(savedLocation);
                        // A bit of a hack to get coords again
                        axios.get(`https://nominatim.openstreetmap.org/search?q=${loc.city},${loc.country}&format=json&limit=1`).then(res => {
                           if(res.data && res.data.length > 0) {
                               fetchPrayerTimes(res.data[0].lat, res.data[0].lon);
                           } else {
                               fetchPrayerTimes(41.0082, 28.9784); // Istanbul default
                           }
                        }).catch(() => fetchPrayerTimes(41.0082, 28.9784));
                    } else {
                        fetchPrayerTimes(41.0082, 28.9784); // Istanbul default
                        setPrayerLocation("İstanbul, Türkiye (Varsayılan)");
                    }
                }
            );

            fetchInspiration();
            loadContinueItems();
        }

        return () => {
             if (prayerIntervalRef.current) clearInterval(prayerIntervalRef.current);
        }
    }, [currentView, fetchInspiration, fetchPrayerTimes, loadContinueItems]);


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
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                {notification && ( <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-[100] animate-fade-in ${notification.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>{notification.message}</div> )}
                
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                    <header className="text-center">
                        <h1 className="text-5xl font-bold mb-2">Dijital Medrese</h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400">Yapay Zeka Destekli Kişisel İlim Rehberiniz</p>
                    </header>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Main Content Area */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Prayer Times Widget */}
                            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
                                {isPrayerLoading ? <div className="h-24 flex items-center justify-center"><Spinner/></div> : prayerData ? (
                                    <div className="text-center">
                                        <p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 capitalize">{prayerLocation || 'Konum Yükleniyor...'}</p>
                                        <p className="text-5xl font-bold text-teal-600 dark:text-teal-400 my-1">{prayerData.nextPrayerName}</p>
                                        <p className="text-6xl font-mono font-bold tracking-tight">{prayerData.timeRemaining}</p>
                                        {prayerMessage && (
                                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 animate-pulse">{prayerMessage}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500">Namaz vakitleri yüklenemedi.</div>
                                )}
                            </div>

                            {/* Daily Inspiration Widget */}
                             <button 
                                onClick={handleInspirationClick} 
                                disabled={isInspirationLoading || isNavigating}
                                className="w-full text-left p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1 min-h-[150px] relative disabled:opacity-70 disabled:cursor-wait"
                            >
                                <h2 className="text-lg font-bold text-teal-600 dark:text-teal-400 mb-2">Günün Ayeti / Hadisi</h2>
                                {isInspirationLoading ? <div className="flex items-center justify-center pt-4"><Spinner/></div> : inspiration ? (
                                    <div>
                                        {inspiration.arabicText && (
                                            <p dir="rtl" className="font-amiri text-2xl text-right mb-3 text-gray-800 dark:text-gray-200">{inspiration.arabicText}</p>
                                        )}
                                        <blockquote className="italic text-gray-600 dark:text-gray-300">"{inspiration.text}"</blockquote>
                                        <p className="text-right text-sm font-semibold text-gray-500 dark:text-gray-400 mt-2">- {inspiration.source}</p>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 pt-4">İçerik yüklenemedi.</div>
                                )}
                                {isNavigating && <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-2xl"><Spinner/></div>}
                            </button>
                        </div>

                        {/* Side Area with Continue and Main Modules */}
                        <div className="lg:col-span-2 space-y-6">
                             {continueItems.length > 0 && (
                                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                                    <h2 className="text-lg font-bold text-teal-600 dark:text-teal-400 mb-3">Kaldığın Yerden Devam Et</h2>
                                    <div className="space-y-3">
                                        {continueItems.map(item => (
                                            <button key={item.key} onClick={item.action} className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                                                <div className="flex items-center space-x-3">
                                                    <div className="text-teal-500">{item.icon}</div>
                                                    <div>
                                                        <p className="font-semibold text-left">{item.label}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 text-left truncate max-w-xs">{item.sublabel}</p>
                                                    </div>
                                                </div>
                                                <ChevronRightIcon className="w-5 h-5 text-gray-400"/>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                             <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => navigateTo('quran')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <BookOpenIcon className="w-8 h-8 text-teal-500 mb-2"/>
                                    <p className="font-bold">Kur'an Oku</p>
                                </button>
                                <button onClick={() => navigateTo('recitation')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <MicIcon className="w-8 h-8 text-teal-500 mb-2"/>
                                    <p className="font-bold">Kıraat Asistanı</p>
                                </button>
                                <button onClick={() => navigateTo('hadith')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <SparklesIcon className="w-8 h-8 text-teal-500 mb-2"/>
                                    <p className="font-bold">Hadis Ara</p>
                                </button>
                                <button onClick={() => navigateTo('fiqh')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-teal-500 mb-2"/>
                                    <p className="font-bold">Fıkıh Sor</p>
                                </button>
                             </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-4 text-center">Diğer Araçlar</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button onClick={() => navigateTo('dua')} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center space-x-3 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                <HandRaisedIcon className="w-6 h-6 text-teal-500"/>
                                <span className="font-semibold">Dua & Zikir</span>
                            </button>
                            <button onClick={() => navigateTo('peygamberler')} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center space-x-3 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                <GlobeAltIcon className="w-6 h-6 text-teal-500"/>
                                <span className="font-semibold">Peygamberler</span>
                            </button>
                             <button onClick={() => navigateTo('risale')} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center space-x-3 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                <BookOpenIcon className="w-6 h-6 text-teal-500"/>
                                <span className="font-semibold">Risale-i Nur</span>
                            </button>
                             <button onClick={() => navigateTo('namaz')} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center space-x-3 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                <ClockIcon className="w-6 h-6 text-teal-500"/>
                                <span className="font-semibold">Namaz Vakitleri</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 flex w-full flex-col items-center space-y-4 px-4 md:flex-row md:justify-center md:space-x-8 md:space-y-0">
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
                        
                        <div className="flex w-full max-w-sm flex-col items-stretch space-y-4 md:order-1 md:w-auto md:flex-row md:space-y-0 md:space-x-4">
                            <button onClick={() => setInfoModalOpen(true)} className="px-6 py-3 bg-transparent text-teal-600 dark:text-teal-400 font-semibold rounded-lg border-2 border-teal-600 dark:border-teal-400 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-400 dark:hover:text-gray-900 transition-colors duration-300">
                                Uygulamayı Tanı
                            </button>
                            <button onClick={() => setBackupModalOpen(true)} className="px-6 py-3 bg-transparent text-amber-600 dark:text-amber-400 font-semibold rounded-lg border-2 border-amber-600 dark:border-amber-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-400 dark:hover:text-gray-900 transition-colors duration-300">
                                Yedekle & Geri Yükle
                            </button>
                        </div>
                    </div>
                
                    <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                       <p>&copy; 2025 - Timur Kalaycı. Hayır dualarınızı beklerim. Rabbim bu Site vesilesiyle ilminizi artırsın.</p>
                    </footer>
                </div>

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
