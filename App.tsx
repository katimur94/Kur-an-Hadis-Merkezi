
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
import PeygamberlerTarihi from './components/PeygamberlerTarihi';
import Zikirmatik from './components/Zikirmatik';
import IlmiArastirma from './components/IlmiArastirma';
import { LugatContextProvider } from './components/Lugat';
import { getAyahDetails } from './services/api';
import { Type } from "@google/genai";
import { getGeminiClient, getGeminiModel } from './services/geminiClient';
import Spinner from './components/Spinner';
import MoodAyahModal from './components/MoodAyahModal';
import { GlobalNotesModal } from './components/GlobalNotesModal';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import type { HadithResult, SourceInfo } from './types';


type View = 'home' | 'quran' | 'hadith' | 'recitation' | 'fiqh' | 'risale' | 'namaz' | 'dua' | 'peygamberler' | 'zikirmatik' | 'ilmiArastirma';

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

interface DailyInspiration {
    ayet: AyetInspiration;
    hadis: HadisInspiration;
}

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
const GlobeAltIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c.24 0 .468.02.69.058M12 3a9.004 9.004 0 0 1 8.716 6.747M12 3a9.004 9.004 0 0 0-8.716-6.747M12 3c-.24 0-.468.02-.69.058m18 9c0 5.14-4.2 9.29-9.428 9.29-5.228 0-9.428-4.15-9.428-9.29s4.2-9.29 9.428-9.29C17.8 2.71 22 6.86 22 12Z" /></svg>);
const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" /></svg>);
const QrCodeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" /></svg>);
const ArrowDownTrayIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>);
const ArrowUpTrayIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>);


const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [isInfoModalOpen, setInfoModalOpen] = useState(false);
    const [isBackupModalOpen, setBackupModalOpen] = useState(false);
    const [backupTab, setBackupTab] = useState<'create' | 'restore'>('create');
    const [backupCode, setBackupCode] = useState('');
    const [restoreCode, setRestoreCode] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isScanningQR, setIsScanningQR] = useState(false);
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
    const [isMoodModalOpen, setMoodModalOpen] = useState(false);
    const [isNotesModalOpen, setNotesModalOpen] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const ai = useRef(getGeminiClient());

    // --- Dashboard State ---
    const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
    const [prayerLocation, setPrayerLocation] = useState<string | null>(null);
    const [isPrayerLoading, setIsPrayerLoading] = useState(true);
    const [prayerMessage, setPrayerMessage] = useState<string | null>(null);
    const [inspiration, setInspiration] = useState<DailyInspiration | null>(null);
    const [isInspirationLoading, setIsInspirationLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const [continueItems, setContinueItems] = useState<ContinueItem[]>([]);
    const prayerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        if (isScanningQR) {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );
            scanner.render(
                (decodedText) => {
                    setRestoreCode(decodedText);
                    setIsScanningQR(false);
                    scanner.clear().catch(console.error);
                    showNotification("QR Kod başarıyla okundu! Geri Yükle butonuna basabilirsiniz.", "success");
                },
                (error) => {
                    // ignore frequent internal errors during scanning
                }
            );

            return () => {
                scanner.clear().catch(console.error);
            };
        }
    }, [isScanningQR]);

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
                const validModules: View[] = ['hadith', 'fiqh', 'risale', 'namaz', 'dua', 'ilmiArastirma'];

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
            const geoResponse = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=tr`);
            const city = geoResponse.data.city || geoResponse.data.locality || geoResponse.data.principalSubdivision;
            const country = geoResponse.data.countryName;
            setPrayerLocation(`${city}, ${country}`);

            const timesResponse = await axios.get(`https://api.aladhan.com/v1/timings`, { params: { latitude: lat, longitude: lon, method: 13 } });
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

    const fetchNewInspiration = useCallback(async () => {
        setIsInspirationLoading(true);
        try {
            if (!ai.current) {
                throw new Error("Google Gemini API anahtarı yapılandırılmamış (VITE_API_KEY).");
            }
            const today = new Date().toDateString();
            const prompt = `Bugünün ilhamı için, önce belirli bir konuda (örneğin sabır, şükür, namaz, sadaka gibi) bir Kur'an ayeti seç. Bugünün tarihi ${new Date().toLocaleDateString('tr-TR')}, bu yüzden dünden farklı bir konu seçmeye çalış. Ardından, SEÇTİĞİN BU AYETTEKİ KONUYU DOĞRUDAN AÇIKLAYAN, DETAYLANDIRAN VEYA UYGULAMASINI GÖSTEREN sahih bir Hadis-i Şerif bul. Ayet ve hadis arasındaki bağlantı çok güçlü ve net olmalı. Bu ikisini tek bir JSON objesi olarak, başka hiçbir açıklama yapmadan döndür. ÖNEMLİ: Döndürülen JSON içindeki 'text' alanları (hem ayet hem de hadis için) MUTLAKA Türkçe olmalıdır. JSON objesi 'ayet' ve 'hadis' anahtarlarını içermelidir. Ayetin 'source' alanına Sure adını ve ayet numarasını yaz (örn: 'Bakara Suresi, 255. Ayet'). Hadisin 'sourceDetails' objesine ana koleksiyon (book), bölüm (chapter), hadis numarası (hadithNumber) ve MÜMKÜNSE cilt (volume) ile sayfa numarası (pageNumber) bilgilerini ekle. JSON'un şu yapıda olduğundan emin ol: { "ayet": { "type": "Ayet", "arabicText": "...", "text": "...", "source": "...", "surahNumber": 2, "ayahInSurah": 255 }, "hadis": { "type": "Hadis", "arabicText": "...", "text": "...", "source": "...", "narrator": "...", "sourceDetails": { "book": "...", "chapter": "...", "hadithNumber": "..." } } }`;

            const response = await ai.current.models.generateContent({
                model: await getGeminiModel(),
                contents: prompt,
                config: {
                    temperature: 0.7,
                }
            });

            // Clean the response text to ensure it's valid JSON
            let jsonString = response.text.trim();
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("AI did not return a valid JSON object.");
            }
            jsonString = jsonMatch[0];

            const data: DailyInspiration = JSON.parse(jsonString);

            // Extra validation to ensure data is complete before setting state
            if (!data || !data.ayet || !data.hadis || !data.ayet.arabicText || !data.hadis.text || !data.hadis.sourceDetails) {
                throw new Error("Incomplete data received from AI.");
            }

            setInspiration(data);
            localStorage.setItem('dailyInspiration', JSON.stringify({ date: today, data }));

        } catch (e) {
            console.error("Inspiration fetch error:", e);
            setInspiration({
                ayet: {
                    type: 'Ayet',
                    arabicText: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ',
                    text: 'Allah, O’ndan başka ilah yoktur; diridir, her şeyin varlığı O’na bağlı ve dayalıdır.',
                    source: 'Bakara Suresi, 255. Ayet',
                    surahNumber: 2,
                    ayahInSurah: 255
                },
                hadis: {
                    type: 'Hadis',
                    arabicText: "مَنْ قَرَأَ آيَةَ الْكُرْسِيِّ دُبُرَ كُلِّ صَلَاةٍ مَكْتُوبَةٍ لَمْ يَمْنَعْهُ مِنْ دُخُولِ الْجَنَّةِ إِلَّا أَنْ يَمُوتَ",
                    text: "Her kim farz namazın peşinden Ayete’l-Kürsi’yi okursa, onunla cennete girmesi arasında ölümden başka bir engel yoktur.",
                    source: "Nesai, es-Sünenü’l-Kübra",
                    narrator: "Ebu Ümame (r.a.)",
                    sourceDetails: {
                        book: "Nesai, es-Sünenü’l-Kübra",
                        chapter: "Amelü’l-yevm ve’l-leyle",
                        hadithNumber: "9848"
                    }
                }
            });
        } finally {
            setIsInspirationLoading(false);
        }
    }, []);

    const handleAyetClick = async () => {
        if (!inspiration || isNavigating) return;
        setIsNavigating(true);
        try {
            const details = await getAyahDetails(inspiration.ayet.surahNumber, inspiration.ayet.ayahInSurah);
            setInitialQuranPage(details.page);
            setHighlightAyah(details.number);
            navigateTo('quran');
        } catch (err) {
            console.error("Navigation from inspiration ayet failed:", err);
            showNotification('İlgili ayete gidilemedi.', 'error');
            setIsNavigating(false);
        }
    };

    const handleHadisClick = async () => {
        if (!inspiration || isNavigating) return;
        setIsNavigating(true);
        try {
            const hadithResult: HadithResult = {
                arabicText: inspiration.hadis.arabicText,
                turkishText: inspiration.hadis.text,
                narrator: inspiration.hadis.narrator,
                source: inspiration.hadis.sourceDetails
            };

            const historyItem = {
                id: `daily-${new Date().toISOString().split('T')[0]}`,
                question: `Günün Hadisi: ${inspiration.hadis.source}`,
                customTitle: `Günün Hadisi: ${inspiration.hadis.source}`,
                responses: [{ hadiths: [hadithResult], hasMore: false }]
            };

            sessionStorage.setItem('importedDataFor_hadith', JSON.stringify(historyItem));
            navigateTo('hadith');
        } catch (err) {
            console.error("Navigation from inspiration hadis failed:", err);
            showNotification('İlgili hadise gidilemedi.', 'error');
            setIsNavigating(false);
        }
    };


    const loadContinueItems = useCallback(() => {
        const items: ContinueItem[] = [];

        // Helper for history-based modules
        const addHistoryItem = (key: 'hadith' | 'fiqh' | 'risale' | 'dua' | 'ilmiArastirma', label: string, icon: React.ReactNode) => {
            try {
                const historyKey = key === 'fiqh' ? 'fiqhChatHistory' : `${key}History`;
                const historyJSON = localStorage.getItem(historyKey);
                if (!historyJSON) return;

                const history = JSON.parse(historyJSON);
                if (history.length > 0) {
                    const lastItem = history[0];
                    items.push({
                        key,
                        label,
                        sublabel: lastItem.customTitle || lastItem.question,
                        icon,
                        action: () => {
                            sessionStorage.setItem(`importedDataFor_${key}`, JSON.stringify(lastItem));
                            navigateTo(key as View);
                        }
                    });
                }
            } catch (e) {
                console.error(`Error loading continue item for ${key}:`, e);
            }
        };

        // 1. Quran Reader
        const quranPage = localStorage.getItem('quranLastPage');
        if (quranPage) {
            items.push({
                key: 'quran',
                label: 'Kur\'an Okumaya Devam Et',
                sublabel: `Sayfa ${quranPage}`,
                icon: <BookOpenIcon className="w-5 h-5" />,
                action: () => { setInitialQuranPage(parseInt(quranPage)); navigateTo('quran'); }
            });
        }

        // 2. Ilmi Arastirma
        addHistoryItem('ilmiArastirma', 'Son Kapsamlı Araştırma', <SearchIcon className="w-5 h-5" />);

        // 3. Recitation Checker
        const recitationPage = localStorage.getItem('recitationLastPage');
        if (recitationPage) {
            items.push({
                key: 'recitation',
                label: 'Kıraat Alıştırması',
                sublabel: `Sayfa ${recitationPage}`,
                icon: <MicIcon className="w-5 h-5" />,
                action: () => { navigateTo('recitation'); }
            });
        }

        // 4. Zikirmatik
        try {
            const zikirStateJSON = localStorage.getItem('zikirmatikState');
            if (zikirStateJSON) {
                const zikirState = JSON.parse(zikirStateJSON);
                const currentDhikr = zikirState.dhikrList[zikirState.currentDhikrIndex];
                if (currentDhikr) {
                    items.push({
                        key: 'zikirmatik',
                        label: 'Zikre Devam Et',
                        sublabel: `${currentDhikr.text.split(' ')[0]} (${currentDhikr.count})`,
                        icon: <PlusCircleIcon className="w-5 h-5" />,
                        action: () => navigateTo('zikirmatik')
                    });
                }
            }
        } catch (e) { console.error('Error loading continue item for zikirmatik:', e); }

        // 5. Hadith Search
        addHistoryItem('hadith', 'Son Hadis Araması', <SparklesIcon className="w-5 h-5" />);

        // 6. Fiqh Chat
        addHistoryItem('fiqh', 'Son Fıkıh Sorusu', <ChatBubbleLeftRightIcon className="w-5 h-5" />);

        // 7. Dua & Zikir Search
        addHistoryItem('dua', 'Son Dua Araması', <HandRaisedIcon className="w-5 h-5" />);

        // 8. Peygamberler Tarihi
        try {
            const prophetJSON = localStorage.getItem('peygamberlerLastProphet');
            if (prophetJSON) {
                const lastProphet = JSON.parse(prophetJSON);
                items.push({
                    key: 'peygamberler',
                    label: 'Peygamberler Tarihine Devam Et',
                    sublabel: lastProphet.name,
                    icon: <GlobeAltIcon className="w-5 h-5" />,
                    action: () => navigateTo('peygamberler')
                });
            }
        } catch (e) { console.error('Error loading continue item for peygamberler:', e); }

        // 9. Risale Search
        addHistoryItem('risale', 'Son Risale Araması', <BookOpenIcon className="w-5 h-5" />);


        setContinueItems(items);
    }, []);


    useEffect(() => {
        handleUrlImport();

        if (currentView === 'home') {
            // Reset states related to navigation from the dashboard to prevent issues on return.
            setIsNavigating(false);

            setIsPrayerLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => fetchPrayerTimes(position.coords.latitude, position.coords.longitude),
                () => {
                    const savedLocation = localStorage.getItem('namazVakitleriLocation');
                    if (savedLocation) {
                        const loc = JSON.parse(savedLocation);
                        axios.get(`https://nominatim.openstreetmap.org/search?q=${loc.city},${loc.country}&format=json&limit=1`).then(res => {
                            if (res.data && res.data.length > 0) {
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

            const loadInspiration = () => {
                const cached = localStorage.getItem('dailyInspiration');
                const today = new Date().toDateString();
                if (cached) {
                    try {
                        const { date, data } = JSON.parse(cached);
                        // Add validation for cached data
                        if (date === today && data.ayet && data.hadis && data.ayet.arabicText && data.hadis.text) {
                            setInspiration(data);
                            setIsInspirationLoading(false); // Ensure it's off
                            return;
                        }
                    } catch (e) {
                        console.error("Failed to parse inspiration cache:", e);
                    }
                }
                // If cache is invalid or missing
                setIsInspirationLoading(true);
                fetchNewInspiration();
            };

            loadInspiration();
            loadContinueItems();
        }

        return () => {
            if (prayerIntervalRef.current) clearInterval(prayerIntervalRef.current);
        }
    }, [currentView, fetchNewInspiration, fetchPrayerTimes, loadContinueItems]);


    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    useEffect(() => {
        const handleNavigateToQuran = (e: any) => {
            const { page, ayahNumber } = e.detail;
            setInitialQuranPage(page);
            setHighlightAyah(ayahNumber);
            setCurrentView('quran');
        };
        window.addEventListener('navigateToQuran', handleNavigateToQuran);
        return () => window.removeEventListener('navigateToQuran', handleNavigateToQuran);
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
        setIsNavigating(false);
        setInitialQuranPage(null);
        setHighlightAyah(null);
    };

    const handleGoToAyahFromMood = async (page: number, ayahNumber: number) => {
        setMoodModalOpen(false);
        setInitialQuranPage(page);
        setHighlightAyah(ayahNumber);
        navigateTo('quran');
    };

    const handleCreateBackup = () => {
        try {
            const backupData: Record<string, any> = {};
            const keysToBackup = [
                'hadithSearchHistory',
                'fiqhChatHistory',
                'risaleSearchHistory',
                'duaSearchHistory',
                'ilmiArastirmaHistory',
                'zikirmatikState', // Add zikirmatik to backup
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
                'dijitalMedreseNotes',
                'quranBookmarks',
                'peygamberlerLastProphet',
                'peygamberlerHistory',
                'dailyInspiration',
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
            const compressed = pako.deflate(jsonString);

            let binaryString = '';
            for (let i = 0; i < compressed.length; i++) {
                binaryString += String.fromCharCode(compressed[i]);
            }

            const encodedString = btoa(binaryString);
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
                let decodedString = '';
                try {
                    const decodedData = atob(restoreCode);
                    const uintArray = new Uint8Array(decodedData.length);
                    for (let i = 0; i < decodedData.length; i++) {
                        uintArray[i] = decodedData.charCodeAt(i);
                    }
                    decodedString = pako.inflate(uintArray, { to: 'string' });
                } catch (e) {
                    // Fallback to old unsecured backup method
                    decodedString = decodeURIComponent(escape(atob(restoreCode)));
                }

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

    const handleDownloadBackupFile = () => {
        if (!backupCode) return;
        const blob = new Blob([backupCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kur-an-hadis-yedek-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleUploadBackupFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content === 'string') {
                setRestoreCode(content);
                showNotification("Yedek dosyası başarıyla okundu!", "success");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset
    };

    // --- Ayah Recitation Identification Logic ---
    const identifyAyah = async (transcript: string) => {
        setReciteState('processing');
        setReciteError(null);
        try {
            if (!ai.current) {
                setReciteError("Google Gemini API anahtarı yapılandırılmamış (VITE_API_KEY).");
                setReciteState('error');
                return;
            }
            const prompt = `Sen bir Kur'an uzmanısın. Sana Kur'an'dan bir ayetin Arapça okunuşunun dökümünü vereceğim. Görevin, bu ayetin hangi sureye ait olduğunu, sure numarasını ve sure içindeki ayet numarasını tespit etmektir. Cevabını SADECE şu JSON formatında ver: {"surahName": "Al-Fatihah", "surahNumber": 1, "ayahNumberInSurah": 1}`;

            const response = await ai.current.models.generateContent({
                model: await getGeminiModel(),
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

    const otherTools = [
        { key: 'peygamberler', view: 'peygamberler' as View, label: 'Peygamberler', icon: <GlobeAltIcon className="w-6 h-6 text-teal-500" />, mobileOnly: false },
        { key: 'namaz', view: 'namaz' as View, label: 'Namaz Vakitleri', icon: <ClockIcon className="w-6 h-6 text-teal-500" />, mobileOnly: false },
        { key: 'zikirmatik', view: 'zikirmatik' as View, label: 'Zikirmatik', icon: <PlusCircleIcon className="w-6 h-6 text-teal-500" />, mobileOnly: false },
    ];

    const availableTools = otherTools.filter(tool => !tool.mobileOnly || isMobile);

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
    } else if (currentView === 'zikirmatik') {
        content = <Zikirmatik onGoHome={goHome} />;
    } else if (currentView === 'ilmiArastirma') {
        content = <IlmiArastirma onGoHome={goHome} />;
    } else {
        content = (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                {notification && (<div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-[100] animate-fade-in ${notification.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>{notification.message}</div>)}

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
                                {isPrayerLoading ? <div className="h-24 flex items-center justify-center"><Spinner /></div> : prayerData ? (
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
                            <div
                                className="w-full text-left p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg min-h-[150px] relative"
                            >
                                {isInspirationLoading ? <div className="flex items-center justify-center pt-4"><Spinner /></div> : inspiration ? (
                                    <div>
                                        <div onClick={handleAyetClick} className="cursor-pointer group">
                                            <h2 className="text-lg font-bold text-teal-600 dark:text-teal-400 mb-2 group-hover:text-teal-500">Günün Ayeti</h2>
                                            <p dir="rtl" className="font-amiri text-2xl text-right mb-3 text-gray-800 dark:text-gray-200">{inspiration.ayet.arabicText}</p>
                                            <blockquote className="italic text-gray-600 dark:text-gray-300">"{inspiration.ayet.text}"</blockquote>
                                            <p className="text-right text-sm font-semibold text-gray-500 dark:text-gray-400 mt-2">- {inspiration.ayet.source}</p>
                                        </div>

                                        <hr className="my-4 border-gray-200 dark:border-gray-700" />

                                        <div onClick={handleHadisClick} className="cursor-pointer group">
                                            <h2 className="text-lg font-bold text-teal-600 dark:text-teal-400 mb-2 group-hover:text-teal-500">İlgili Hadis-i Şerif</h2>
                                            {inspiration.hadis.arabicText && (
                                                <p dir="rtl" className="font-amiri text-xl text-right mb-3 text-gray-800 dark:text-gray-200">{inspiration.hadis.arabicText}</p>
                                            )}
                                            <blockquote className="italic text-gray-600 dark:text-gray-300">"{inspiration.hadis.text}"</blockquote>
                                            <p className="text-right text-sm font-semibold text-gray-500 dark:text-gray-400 mt-2">
                                                - {[
                                                    inspiration.hadis.sourceDetails.book,
                                                    inspiration.hadis.sourceDetails.chapter,
                                                    inspiration.hadis.sourceDetails.volume ? `Cilt: ${inspiration.hadis.sourceDetails.volume}` : null,
                                                    inspiration.hadis.sourceDetails.hadithNumber ? `No: ${inspiration.hadis.sourceDetails.hadithNumber}` : null,
                                                    inspiration.hadis.sourceDetails.pageNumber ? `Sayfa: ${inspiration.hadis.sourceDetails.pageNumber}` : null,
                                                ].filter(Boolean).join(', ')}
                                            </p>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 pt-4">İçerik yüklenemedi.</div>
                                )}
                                {isNavigating && <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-2xl"><Spinner /></div>}
                            </div>
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
                                                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setMoodModalOpen(true)} className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all col-span-2 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <SparklesIcon className="w-8 h-8 mb-2 z-10 drop-shadow-md" />
                                    <p className="font-bold text-lg z-10 drop-shadow-md">Ruh Halime Göre Ayet</p>
                                    <p className="text-xs text-amber-100 z-10 font-medium">Bana nasıl hissettiğini söyle</p>
                                </button>
                                <button onClick={() => navigateTo('ilmiArastirma')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <SearchIcon className="w-8 h-8 text-teal-500 mb-2" />
                                    <p className="font-bold">Kapsamlı Arama</p>
                                </button>
                                <button onClick={() => navigateTo('quran')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <BookOpenIcon className="w-8 h-8 text-teal-500 mb-2" />
                                    <p className="font-bold">Kur'an Oku</p>
                                </button>
                                <button onClick={() => navigateTo('recitation')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <MicIcon className="w-8 h-8 text-teal-500 mb-2" />
                                    <p className="font-bold">Kıraat Asistanı</p>
                                </button>
                                <button onClick={() => navigateTo('hadith')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <SparklesIcon className="w-8 h-8 text-teal-500 mb-2" />
                                    <p className="font-bold">Hadis Ara</p>
                                </button>
                                <button onClick={() => navigateTo('fiqh')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-teal-500 mb-2" />
                                    <p className="font-bold">Fıkıh Sor</p>
                                </button>
                                <button onClick={() => navigateTo('risale')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <BookOpenIcon className="w-8 h-8 text-teal-500 mb-2" />
                                    <p className="font-bold">Risale-i Nur</p>
                                </button>
                                <button onClick={() => navigateTo('dua')} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <HandRaisedIcon className="w-8 h-8 text-teal-500 mb-2" />
                                    <p className="font-bold">Dua & Zikir</p>
                                </button>
                                <button onClick={() => setNotesModalOpen(true)} className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center hover:shadow-xl hover:-translate-y-1 transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-amber-500 mb-2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                    </svg>
                                    <p className="font-bold">Notlarım</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-4 text-center">Diğer Araçlar</h3>
                        <div className={`grid grid-cols-2 ${availableTools.length % 3 === 0 && availableTools.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
                            {availableTools.map(tool => (
                                <button
                                    key={tool.key}
                                    onClick={() => navigateTo(tool.view)}
                                    className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex items-center justify-center space-x-3 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                >
                                    {tool.icon}
                                    <span className="font-semibold">{tool.label}</span>
                                </button>
                            ))}
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
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Bu işlem, tüm arama geçmişlerinizi, Notlarınızı, Ku'ran yer imlerinizi ve ayarlarınızı sıkıştırıp tek bir koda dönüştürür. Yeni cihaza QR kodla veya dosyayla aktarabilirsiniz.</p>
                                        <button onClick={handleCreateBackup} className="w-full px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                                            Yedekleme Kodu Oluştur
                                        </button>
                                        {backupCode && (
                                            <div className="mt-4 space-y-4">
                                                {backupCode.length < 2900 ? (
                                                    <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                                        <p className="text-sm font-semibold text-gray-700 mb-2">Diğer Cihazdan Okut (QR Kod)</p>
                                                        <QRCodeCanvas value={backupCode} size={200} />
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs rounded-lg border border-amber-200 dark:border-amber-800">
                                                        Veri boyutunuz çok büyük olduğu için QR kod desteklenmiyor. Lütfen Dosya Oluştur (veya Kodu Kopyala) yöntemini kullanın.
                                                    </div>
                                                )}

                                                <textarea readOnly value={backupCode} className="w-full h-24 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-xs resize-none" />

                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={handleCopyCode} className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors text-sm">
                                                        {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                                        <span>{isCopied ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
                                                    </button>
                                                    <button onClick={handleDownloadBackupFile} className="flex items-center justify-center space-x-2 px-3 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors text-sm">
                                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                                        <span>Dosya Olarak İndir</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Yedekten Verilerinizi Geri Yükleyin</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Daha önce oluşturduğunuz yedekleme kodunu aşağıya yapıştırabilir, yedek txt dosyasını yükleyebilir veya diğer cihazdaki QR kodu okutabilirsiniz. <strong className="text-red-500">Bu işlem, bu cihazdaki mevcut verilerin üzerine yazar.</strong></p>

                                        {!isScanningQR ? (
                                            <div className="grid grid-cols-2 gap-2 mb-4">
                                                <button onClick={() => setIsScanningQR(true)} className="flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                                    <QrCodeIcon className="w-5 h-5" />
                                                    <span>Kamera ile QR Oku</span>
                                                </button>
                                                <label className="flex items-center justify-center space-x-2 p-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors text-sm cursor-pointer">
                                                    <ArrowUpTrayIcon className="w-5 h-5" />
                                                    <span>Dosyadan Yükle</span>
                                                    <input type="file" accept=".txt" onChange={handleUploadBackupFile} className="hidden" />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg mb-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-semibold">QR Kod Okunuyor...</span>
                                                    <button onClick={() => setIsScanningQR(false)} className="text-red-500 text-xs font-bold px-3 py-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 transition-colors rounded">İptal</button>
                                                </div>
                                                <div id="qr-reader" className="w-full overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600"></div>
                                            </div>
                                        )}

                                        <textarea
                                            value={restoreCode}
                                            onChange={(e) => setRestoreCode(e.target.value)}
                                            placeholder="Yedekleme kodunu buraya yapıştırın veya yollardan birini seçin..."
                                            className="w-full h-32 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-xs resize-y focus:ring-2 focus:ring-amber-500 outline-none"
                                        />
                                        <button onClick={handleRestoreBackup} className="w-full px-4 py-3 bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:bg-amber-700 transition-colors">
                                            Tüm Verileri Geri Yükle
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isInfoModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-[100dvh] animate-fade-in" onClick={() => setInfoModalOpen(false)}>
                        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700/50 animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800/50 bg-gray-50 dark:bg-[#0f172a] sticky top-0 z-10">
                                <h2 className="text-2xl font-black bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent">Dijital Medrese Rehberi</h2>
                                <button onClick={() => setInfoModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                                    <CloseIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-10 scroll-smooth">

                                {/* Yeni Çıkan Yenilikler (Highlight) */}
                                <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500/10 to-amber-500/10 p-6 border border-teal-500/20 dark:border-teal-500/10">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                        <GlobeAltIcon className="w-48 h-48 -mt-10 -mr-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-teal-700 dark:text-teal-400 mb-5 flex items-center relative z-10">
                                        <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-md uppercase font-black mr-3 shadow-md animate-pulse">YENİ</span>
                                        Neler Eklendi?
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex items-center mb-3">
                                                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400 mr-3"><BookOpenIcon className="w-5 h-5" /></div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-100">Global Not Defteri</h4>
                                                </div>
                                                {/* Simulation */}
                                                <div className="h-24 bg-gray-50 dark:bg-[#0f172a] rounded-lg p-3 mb-4 relative overflow-hidden flex flex-col justify-center border border-gray-200 dark:border-gray-700 text-xs shadow-inner">
                                                    <div className="text-gray-400 dark:text-gray-500 mb-1 italic">...fıkıh okurken önemli bir yer...</div>
                                                    <span className="text-gray-800 dark:text-gray-200 font-medium inline-block w-max animate-highlight relative px-1 rounded cursor-text">
                                                        "Dikkat edilecek en önemli husus şudur."
                                                        <div className="absolute -top-7 left-1/2 bg-teal-600 text-white px-2 py-1.5 rounded-md text-[10px] whitespace-nowrap animate-tooltip shadow-lg font-bold flex items-center z-10">
                                                            <PlusCircleIcon className="w-3 h-3 mr-1" /> Nota Ekle
                                                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-teal-600 rotate-45"></div>
                                                        </div>
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-auto">Gördüğünüz her faydalı metni seçip anında panelinize atın. Üst menüden <strong className="text-teal-600 dark:text-teal-400">Notlarım</strong> kısmından erişin.</p>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex items-center mb-3">
                                                    <div className="p-2 bg-teal-100 dark:bg-teal-900/40 rounded-lg text-teal-600 dark:text-teal-400 mr-3"><QrCodeIcon className="w-5 h-5" /></div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-100">QR Kod ile Yedekleme</h4>
                                                </div>
                                                {/* Simulation */}
                                                <div className="h-24 bg-gray-50 dark:bg-[#0f172a] rounded-lg p-3 mb-4 relative overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner">
                                                    <div className="w-14 h-14 bg-white border-4 border-gray-800 rounded relative overflow-hidden p-1 shadow-md">
                                                        <div className="w-full h-full bg-gray-800 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #1f2937 2px, #1f2937 4px)' }}></div>
                                                        <div className="absolute left-0 right-0 h-[2px] bg-green-500 shadow-[0_0_8px_2px_#22c55e] animate-laser"></div>
                                                    </div>
                                                    <div className="ml-5 flex flex-col items-start justify-center w-24">
                                                        <div className="font-mono text-[9px] text-teal-600 dark:text-teal-400 font-bold tracking-widest mb-1.5 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 animate-pulse"></span>AKTARIYOR</div>
                                                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <div className="h-full bg-teal-500 animate-[highlightText_2.5s_infinite_ease-in-out]" style={{ backgroundSize: '100% 100%' }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-auto">Verileriniz anında sıkıştırılır. Yeni telefon kameranızı tutup ekrana okutun, her şey saniyeler içinde aktarılsın.</p>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex items-center mb-3">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400 mr-3"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-100">Cevapları Resim Yap</h4>
                                                </div>
                                                {/* Simulation */}
                                                <div className="h-24 bg-gray-50 dark:bg-[#0f172a] rounded-lg p-3 mb-4 relative overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-700 space-x-6 shadow-inner">
                                                    <div className="w-12 h-16 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded flex flex-col shadow-sm transform rotate-[-5deg] z-10">
                                                        <div className="h-2 bg-blue-500 rounded-t w-full"></div>
                                                        <div className="p-1.5 space-y-1.5 mt-1">
                                                            <div className="h-1 bg-gray-200 dark:bg-gray-500 rounded w-3/4"></div>
                                                            <div className="h-1 bg-gray-200 dark:bg-gray-500 rounded w-full"></div>
                                                            <div className="h-1 bg-gray-200 dark:bg-gray-500 rounded w-5/6"></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center relative">
                                                        <ArrowUpTrayIcon className="w-6 h-6 text-blue-500 animate-download-bounce mb-1 rotate-180 drop-shadow-md relative z-10" />
                                                        <div className="absolute top-1/2 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full animate-ping opacity-20"></div>
                                                        <div className="w-12 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-md flex items-center justify-center text-[9px] font-black tracking-wider shadow border border-blue-400/50 relative z-10">PNG</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-auto">Yapay zekanın verdiği uzun cevaplardan güzel tasarımlı bir <strong className="text-blue-600 dark:text-blue-400">resim kartı</strong> üreterek galerinize indirin.</p>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800/80 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-md transition-shadow">
                                            <div>
                                                <div className="flex items-center mb-3">
                                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400 mr-3"><MicIcon className="w-5 h-5" /></div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-100">Sesle Ayet Bulma</h4>
                                                </div>
                                                {/* Simulation */}
                                                <div className="h-24 bg-gray-50 dark:bg-[#0f172a] rounded-lg p-3 mb-4 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner overflow-hidden">
                                                    <div className="relative flex items-center justify-center w-14 h-14">
                                                        <div className="absolute inset-0 bg-purple-400/50 rounded-full animate-sonar"></div>
                                                        <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-full flex items-center justify-center text-white shadow-lg">
                                                            <MicIcon className="w-5 h-5" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-5 flex flex-col">
                                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 font-semibold tracking-wider uppercase">Dinleniyor...</span>
                                                        <div className="flex space-x-1 items-end h-5">
                                                            <div className="w-1.5 h-full bg-fuchsia-400 animate-pulse rounded-full" style={{ animationDelay: '0ms' }}></div>
                                                            <div className="w-1.5 h-3/5 bg-purple-500 animate-pulse rounded-full" style={{ animationDelay: '150ms' }}></div>
                                                            <div className="w-1.5 h-4/5 bg-indigo-400 animate-pulse rounded-full" style={{ animationDelay: '300ms' }}></div>
                                                            <div className="w-1.5 h-2/5 bg-fuchsia-600 animate-pulse rounded-full" style={{ animationDelay: '450ms' }}></div>
                                                            <div className="w-1.5 h-full bg-purple-400 animate-pulse rounded-full" style={{ animationDelay: '600ms' }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-auto">Ezberinizde olan ama yerini unuttuğunuz ayeti mikrofona okuyun. Sistem ayeti anında bulur ve Kur'an okuyucuda ilgili sayfaya atlar.</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Modüller Grid */}
                                <section>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-b pb-2 dark:border-gray-700">Modüller ve İmkânlar</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                        <div className="flex space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
                                            <div className="text-teal-500 mt-1"><SearchIcon className="w-7 h-7" /></div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-1">Dua & Hadis & Fıkıh</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">Sünnetten duaları, hadisleri ve fıkhi soruları aratın. Yapay zeka, <strong className="text-amber-600 dark:text-amber-500">4 büyük mezhep imamının</strong> hükümlerini, Kur'an ve Sünnet delilleriyle karşınıza getirsin.</p>
                                                <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded text-xs text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800">
                                                    <strong className="font-bold text-teal-900 dark:text-teal-100 uppercase text-[10px]">YENİ! İnteraktif Liste:</strong> "İslam'ın şartları nelerdir?" gibi madde madde fıkhi konularda artık tıklanabilir açılır-kapanır özel <strong className="font-bold">Akordeon Listeler</strong> oluşturulur, okuması harika!
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                                            <div className="text-amber-500 mt-1"><MicIcon className="w-7 h-7" /></div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-1">Kıraat Asistanı</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Kur'an okuyuşunuzu mikrofona kaydedin. Sistem <strong className="text-teal-600 dark:text-teal-500">tecvid ve telaffuz hatalarınızı</strong> kırmızıyla işaretlesin, hatanın ne olduğunu üzerine basarak görün.</p>
                                            </div>
                                        </div>

                                        <div className="flex space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                            <div className="text-blue-500 mt-1"><BookOpenIcon className="w-7 h-7" /></div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-1">Gelişmiş Kur'an Okuyucu</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">Geleneksel Mushaf veya satır altı Meal görünümüyle okuyun. Cüz, Sure veya sayfa bazlı <strong className="text-amber-600 dark:text-amber-500">sesli dinleyin</strong>, kelimeler okundukça renklenerek takip etmenizi sağlasın.</p>
                                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded text-xs text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                                                    <strong className="font-bold text-blue-900 dark:text-blue-100 uppercase text-[10px]">YENİ! Tam Ekran:</strong> Ana menüdeki "Tam Ekran" butonuna basıp uygulamayı kitaba dönüştürerek odaklanın.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex space-x-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors flex-col">
                                            <div className="flex space-x-4">
                                                <div className="text-purple-500 mt-1"><ClockIcon className="w-7 h-7" /></div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-1">Namaz Vakitleri & Zikir</h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Konumunuza göre vakitleri canlı izleyin. Kendi zikir listenizi oluşturup sayaçlarıyla akıllı Zikirmatik'te virdinize devam edin.</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex space-x-4">
                                                <div className="text-emerald-500 mt-1"><GlobeAltIcon className="w-7 h-7" /></div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-1">Peygamberler & Risale</h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Peygamberler tarihinde yüzyıllık <strong className="text-emerald-600 dark:text-emerald-500">akıllı zaman çizelgesiyle</strong> gezin veya Risale-i Nur Okyanusuna dalın!</p>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </section>

                                {/* İpuçları */}
                                <section>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 border-b pb-2 dark:border-gray-700">Hızlı İpuçları</h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                            <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded-lg mr-3 shadow-sm"><ShareIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" /></div>
                                            <span className="leading-relaxed"><strong>Geçmiş (History) Linkleri:</strong> Yaptığınız karmaşık aramaları ve cevapları tek bir "Link" haline getirip arkdaşınıza atın. Bastığında direkt cevabı görür.</span>
                                        </li>
                                        <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                            <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded-lg mr-3 shadow-sm"><BookOpenIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" /></div>
                                            <span className="leading-relaxed"><strong>Sihirli Lügat:</strong> Ekrandaki yüzen Lügat ikonunda aradığınız kelimeler <span className="border-b-2 border-dotted border-gray-400">altı çizili</span> olarak tüm uygulamada işaretlenir, üzerine geldiğinizde anında manasını hatırlatır.</span>
                                        </li>
                                        <li className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                            <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded-lg mr-3 shadow-sm"><FullscreenEnterIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" /></div>
                                            <span className="leading-relaxed"><strong>Metin Seçimi:</strong> Okuduğunuz herhangi bir metnin (Hadis, Fıkıh vs.) önemli bir yerini farenizle (veya parmağınızla) seçin. Çıkan menüden tek tıkla "Notlarım" köşesine kaydedin.</span>
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
                                <button onClick={closeReciteModal} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
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

                <MoodAyahModal isOpen={isMoodModalOpen} setIsOpen={setMoodModalOpen} onGoToAyah={handleGoToAyahFromMood} />
                <GlobalNotesModal isOpen={isNotesModalOpen} onClose={() => setNotesModalOpen(false)} />
            </div>
        );
    }

    return (
        <LugatContextProvider>
            {content}
        </LugatContextProvider>
    );
};

export default App;
