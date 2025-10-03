import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getPageDetail, getSurahList, getSurahDetailForPageJump, getReciterList, getJuzVerses, getSurahVerses } from '../services/api';
import type { SurahSummary, CombinedAyah, Reciter, PlaylistItem } from '../types';
import Spinner from './Spinner';
import { useLugat } from './Lugat';
import { useLongPress } from '../hooks/useLongPress';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" /></svg>);
const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" /></svg>);
const StopIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M5.334 2.25a2.25 2.25 0 0 0-2.25 2.25v11.25a2.25 2.25 0 0 0 2.25 2.25h9.332a2.25 2.25 0 0 0 2.25-2.25V4.5a2.25 2.25 0 0 0-2.25-2.25H5.334Z" /></svg>);
const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);
const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296-2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>);

const juzStartPages = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];
const TOTAL_PAGES = 604;
const ARABIC_NUMERALS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const toArabicNumeral = (n: number) => n.toString().split('').map(digit => ARABIC_NUMERALS[parseInt(digit)]).join('');
const FONT_LIST = [
    { name: 'Mushaf (Amiri Quran)', value: "'Amiri Quran', serif" },
    { name: 'S. Hamdullah Mushaf', value: "'Katibeh', cursive" },
    { name: 'Elif 1 (Almarai)', value: "'Almarai', sans-serif" },
    { name: 'Elif 2 (Rakkas)', value: "'Rakkas', cursive" },
    { name: 'KFGQPC Hafs (Amiri)', value: "'Amiri', serif" },
    { name: 'Scheherazade', value: "'Scheherazade New', serif" },
    { name: 'Me Quran (Noto Naskh)', value: "'Noto Naskh Arabic', serif" },
    { name: 'PDMS Saleem (Lateef)', value: "'Lateef', cursive" },
    { name: 'IndoPak (Noto Naskh)', value: "'Noto Naskh Arabic', serif" },
    { name: 'Muhammadi (Reem Kufi)', value: "'Reem Kufi', sans-serif" },
    { name: 'Markazi Text', value: "'Markazi Text', serif" },
    { name: 'Cairo', value: "'Cairo', sans-serif" },
    { name: 'Tajawal', value: "'Tajawal', sans-serif" },
];

type PlaybackMode = 'juz' | 'surah' | 'page' | 'none';

const QuranReader: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    // Component State
    const [viewMode, setViewMode] = useState<'quran' | 'translation'>(() => (localStorage.getItem('quranViewMode') as 'quran' | 'translation') || 'quran');
    const [currentPage, setCurrentPage] = useState<number>(() => parseInt(localStorage.getItem('quranLastPage') || '1'));
    const [pageData, setPageData] = useState<CombinedAyah[]>([]);
    const [surahList, setSurahList] = useState<SurahSummary[]>([]);
    const [reciterList, setReciterList] = useState<Reciter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reader, setReader] = useState<string>(() => localStorage.getItem('quranReader') || 'ar.alafasy');
    const [fontSize, setFontSize] = useState<number>(() => parseInt(localStorage.getItem('quranFontSize') || '24'));
    const [fontFamily, setFontFamily] = useState<string>(() => localStorage.getItem('quranFontFamily') || FONT_LIST[0].value);
    
    // Playback State
    const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('none');
    const [activePlaybackId, setActivePlaybackId] = useState<number | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);
    const isAutoNavigating = useRef(false);

    // Other State
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [navTab, setNavTab] = useState<'surah' | 'juz'>('surah');
    const contentRef = useRef<HTMLElement>(null);

    // Lügat State
    const { showLugat } = useLugat();
    const handleLongPress = useCallback((text: string, { x, y }: {x: number, y: number}) => {
        if (text) {
            showLugat(text, { x, y });
        }
    }, [showLugat]);
    const longPressHandlers = useLongPress(handleLongPress, { delay: 500 });

    // Effects for data fetching and saving settings
    useEffect(() => {
        getSurahList().then(setSurahList).catch(() => setError('Sure listesi yüklenemedi.'));
        getReciterList().then(setReciterList).catch(() => setError('Okuyucu listesi yüklenemedi.'));
    }, []);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        if (!isAutoNavigating.current) {
            // Manual navigation, don't clear playlist immediately, but playback will stop
        }
        getPageDetail(currentPage, reader)
            .then(setPageData)
            .catch(() => setError(`Sayfa ${currentPage} yüklenemedi. Lütfen tekrar deneyin.`))
            .finally(() => setIsLoading(false));
    }, [currentPage, reader]);

    useEffect(() => {
        localStorage.setItem('quranViewMode', viewMode);
        localStorage.setItem('quranLastPage', currentPage.toString());
        localStorage.setItem('quranReader', reader);
        localStorage.setItem('quranFontSize', fontSize.toString());
        localStorage.setItem('quranFontFamily', fontFamily);
    }, [viewMode, currentPage, reader, fontSize, fontFamily]);

    // Core Playback Logic
    const handleStop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setIsPlaying(false);
        setPlaylist([]);
        setCurrentTrackIndex(-1);
        setPlaybackMode('none');
        setActivePlaybackId(null);
    }, []);

    const playTrack = useCallback(async (trackIndex: number) => {
        if (trackIndex < 0 || trackIndex >= playlist.length) {
            handleStop();
            return;
        }

        const track = playlist[trackIndex];
        if (!track || !track.audioUrl) {
            // Skip track if audio is missing and play next
            if(isPlaying) setCurrentTrackIndex(i => i + 1);
            return;
        }

        if (track.pageNumber !== currentPage) {
            isAutoNavigating.current = true;
            setCurrentPage(track.pageNumber);
        } else {
            if (audioRef.current) {
                audioRef.current.src = track.audioUrl;
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);
                } catch (err: any) {
                    // This error is expected when the user clicks another track quickly.
                    // We can safely ignore it to prevent console spam and unnecessary stops.
                    if (err.name === 'AbortError') {
                        // Play was interrupted by another play/pause call, which is fine.
                    } else {
                        console.error("Audio play failed:", err);
                        handleStop(); // Stop on other, more serious errors
                    }
                }
            }
        }
    }, [playlist, currentPage, isPlaying, handleStop]);

    useEffect(() => {
        // This effect triggers playback when the index changes
        if (isPlaying && currentTrackIndex !== -1) {
            playTrack(currentTrackIndex);
        }
    }, [currentTrackIndex]); // Only depends on index change
    
    useEffect(() => {
        // This effect continues playback after an auto-navigation page load is complete
        if (isAutoNavigating.current && !isLoading) {
             isAutoNavigating.current = false;
             if(isPlaying && currentTrackIndex !== -1) {
                playTrack(currentTrackIndex);
             }
        }
    }, [isLoading]);

    const handleAudioEnded = () => {
        if (currentTrackIndex < playlist.length - 1) {
            setCurrentTrackIndex(prevIndex => prevIndex + 1);
        } else {
            handleStop();
        }
    };
    
    // --- Handlers ---
    const startPlayback = (newPlaylist: PlaylistItem[], mode: PlaybackMode, id: number | null, startIndex = 0) => {
        if (newPlaylist && newPlaylist.length > 0) {
            setPlaylist(newPlaylist);
            setCurrentTrackIndex(startIndex);
            setIsPlaying(true);
            setPlaybackMode(mode);
            if(id) setActivePlaybackId(id);
        } else {
            setError("Bu bölüm için okunacak ayet bulunamadı.");
        }
    };

    const handlePlayJuz = async (juzNumber: number) => {
        handleStop();
        setIsLoading(true);
        try {
            const newPlaylist = await getJuzVerses(juzNumber, reader);
            startPlayback(newPlaylist, 'juz', juzNumber);
        } catch {
            setError(`Cüz ${juzNumber} yüklenemedi.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlaySurah = async (surahNumber: number) => {
        handleStop();
        setIsLoading(true);
        try {
            const newPlaylist = await getSurahVerses(surahNumber, reader);
            startPlayback(newPlaylist, 'surah', surahNumber);
        } catch {
            setError(`Sure ${surahNumber} yüklenemedi.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayPage = (startIndex = 0) => {
        handleStop();
        const pagePlaylist = pageData.map(v => ({
            ayahNumber: v.number,
            audioUrl: v.audio,
            pageNumber: v.page,
        })).filter(item => item.audioUrl);
        startPlayback(pagePlaylist, 'page', currentPage, startIndex);
    };

    const handlePlaySingleAyah = (ayah: CombinedAyah) => {
        handleStop();
        const singleItemPlaylist = [{ ayahNumber: ayah.number, audioUrl: ayah.audio, pageNumber: ayah.page }];
        startPlayback(singleItemPlaylist, 'none', null);
    };
    
    const handleAyahClick = (ayah: CombinedAyah) => {
        const indexOnPage = pageData.findIndex(a => a.number === ayah.number);
        if (indexOnPage !== -1) {
            handlePlayPage(indexOnPage);
        }
    };

    const handleMainPlayPause = () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            if (currentTrackIndex !== -1 && playlist.length > 0) { // Resume
                audioRef.current?.play();
                setIsPlaying(true);
            } else { // Start page playback from beginning
                handlePlayPage(0);
            }
        }
    };

    const jumpToPage = (page: number) => {
        if (page >= 1 && page <= TOTAL_PAGES) {
            if (playbackMode === 'juz' || playbackMode === 'surah') {
                handleStop();
            }
            setCurrentPage(page);
        }
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    const jumpToSurah = async (surahNumber: number) => {
        try {
            const { page } = await getSurahDetailForPageJump(surahNumber);
            jumpToPage(page);
        } catch (err) {
            setError('Sureye atlanamadı.');
        }
    };

    const currentlyPlayingAyahNumber = playlist[currentTrackIndex]?.ayahNumber;

    // Render Logic
    const renderQuranViewContent = () => {
        const elements: React.ReactNode[] = [];
        pageData.forEach((ayah, index) => {
            // Add a separator if a new surah begins on this page
            if (index > 0 && ayah.surah.number !== pageData[index - 1].surah.number) {
                elements.push(
                    <div key={`surah-header-${ayah.surah.number}`} className="w-full my-6 text-center">
                        <h2 className="text-4xl font-amiri font-bold text-amber-500 dark:text-amber-400" style={{ fontFamily: FONT_LIST[0].value }}>{ayah.surah.name}</h2>
                    </div>
                );
            }

            elements.push(
                <span
                    key={ayah.number}
                    onClick={() => handleAyahClick(ayah)}
                    className={`cursor-pointer transition-colors duration-300 rounded px-1 ${currentlyPlayingAyahNumber === ayah.number ? 'font-bold text-teal-600 dark:text-teal-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                    {ayah.arabicText}
                    <span className="text-sm font-sans text-amber-600 dark:text-amber-400 mx-1">۝{toArabicNumeral(ayah.numberInSurah)}</span>
                </span>
            );
        });
        
        const surahNamesOnPage = [...new Set(pageData.map(a => a.surah.name))].join(' - ');

        return (
         <div {...longPressHandlers} className="p-4 md:p-8 flex-1 flex items-center justify-center select-text">
             <div className="w-full max-w-4xl bg-[#FDFCF8] dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 shadow-lg rounded-lg p-6 border-4 border-double border-amber-400 dark:border-amber-600">
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4 px-2">
                    <span>Cüz {pageData[0]?.juz}</span>
                    <span>{surahNamesOnPage}</span>
                </div>
                <div className="text-center" style={{ fontFamily: fontFamily, fontSize: `${fontSize}px`, lineHeight: 2.5 }}>
                    {elements}
                </div>
                <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                    {currentPage}
                </div>
            </div>
        </div>
    )};
    
    const renderTranslationViewContent = () => {
        const elements: React.ReactNode[] = [];

        pageData.forEach((ayah, index) => {
            // Add a separator if a new surah begins on this page
            if (index > 0 && ayah.surah.number !== pageData[index - 1].surah.number) {
                 elements.push(
                    <div key={`surah-header-tr-${ayah.surah.number}`} className="my-8 text-center">
                        <h2 className="text-3xl font-amiri font-bold text-amber-500 dark:text-amber-400" style={{ fontFamily: FONT_LIST[0].value }}>{ayah.surah.name}</h2>
                    </div>
                );
            }

            elements.push(
                <div key={ayah.number} className="py-4 border-b border-gray-200 dark:border-gray-700 rounded-md p-2">
                    <p style={{fontFamily: fontFamily}} className={`text-right text-3xl leading-loose mb-4 cursor-pointer transition-colors duration-300 ${currentlyPlayingAyahNumber === ayah.number ? 'font-bold text-teal-600 dark:text-teal-400' : ''}`} onClick={() => handleAyahClick(ayah)}>
                        {ayah.arabicText} <span className="text-sm font-sans p-1 border rounded-full">{ayah.numberInSurah}</span>
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{ayah.turkishText}</p>
                     <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                         {/* This button is now redundant as clicking text plays */}
                     </div>
                </div>
            );
        });

        return (
             <div {...longPressHandlers} className="max-w-4xl mx-auto p-4 md:p-6 select-text">
                {elements}
            </div>
        );
    };
    
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
             <audio ref={audioRef} onEnded={handleAudioEnded} />
            {/* Sidebar */}
            <aside className={`absolute lg:relative z-20 flex flex-col h-full bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{width: '300px'}}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Navigasyon</h2>
                     <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon/></button>
                </div>
                <div className="flex border-b dark:border-gray-700">
                    <button onClick={() => setNavTab('surah')} className={`flex-1 p-3 text-sm font-medium ${navTab === 'surah' ? 'border-b-2 border-teal-500 text-teal-600' : ''}`}>Sureler</button>
                    <button onClick={() => setNavTab('juz')} className={`flex-1 p-3 text-sm font-medium ${navTab === 'juz' ? 'border-b-2 border-teal-500 text-teal-600' : ''}`}>Cüzler</button>
                </div>
                <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                    {navTab === 'surah' && surahList.map(s => (
                        <li key={s.number} className={`flex items-center justify-between p-2.5 rounded-md text-sm ${playbackMode === 'surah' && activePlaybackId === s.number ? 'bg-teal-100 dark:bg-teal-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            <button onClick={() => jumpToSurah(s.number)} className="flex-1 text-left flex justify-between"><span>{s.number}. {s.englishName}</span> <span>{s.name}</span></button>
                            <button onClick={() => handlePlaySurah(s.number)} className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><PlayIcon className="w-4 h-4" /></button>
                        </li>
                    ))}
                    {navTab === 'juz' && [...Array(30)].map((_, i) => (
                         <li key={i} className={`flex items-center justify-between p-2.5 rounded-md text-sm ${playbackMode === 'juz' && activePlaybackId === i + 1 ? 'bg-teal-100 dark:bg-teal-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            <button onClick={() => jumpToPage(juzStartPages[i])} className="flex-1 text-left">Cüz {i + 1}</button>
                            <button onClick={() => handlePlayJuz(i + 1)} className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"><PlayIcon className="w-4 h-4" /></button>
                        </li>
                    ))}
                </ul>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                 <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md p-2 flex justify-between items-center z-10">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><MenuIcon/></button>
                         <div className="flex items-center space-x-2">
                            <button onClick={handleMainPlayPause} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">{isPlaying ? <PauseIcon/> : <PlayIcon/>}</button>
                            <button onClick={handleStop} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" disabled={!isPlaying && currentTrackIndex === -1}><StopIcon/></button>
                        </div>
                    </div>
                    <div className="flex-1 flex justify-center">
                         <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex items-center">
                            <button onClick={() => setViewMode('quran')} className={`px-4 py-1 text-sm rounded-md ${viewMode === 'quran' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>Kur'an Görünümü</button>
                            <button onClick={() => setViewMode('translation')} className={`px-4 py-1 text-sm rounded-md ${viewMode === 'translation' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>Meal Görünümü</button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><SettingsIcon/></button>
                        <button onClick={onGoHome} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><HomeIcon/></button>
                    </div>
                </header>

                {/* Main Content */}
                <main ref={contentRef} className="flex-1 flex flex-col overflow-y-auto bg-gray-100 dark:bg-gray-900">
                    {isLoading ? <Spinner /> : error ? <p className="m-auto text-center text-red-500">{error}</p> : (
                        viewMode === 'quran' ? renderQuranViewContent() : renderTranslationViewContent()
                    )}
                </main>

                {/* Footer */}
                <footer className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-inner p-2 flex justify-between items-center">
                     <button onClick={() => jumpToPage(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-md disabled:opacity-50 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5"/> <span>Önceki Sayfa</span></button>
                    <span className="text-sm font-medium">{currentPage} / {TOTAL_PAGES}</span>
                     <button onClick={() => jumpToPage(currentPage + 1)} disabled={currentPage === TOTAL_PAGES} className="px-4 py-2 rounded-md disabled:opacity-50 flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700"><span>Sonraki Sayfa</span> <ChevronRightIcon className="w-5 h-5"/></button>
                </footer>
            </div>
            
             {/* Settings Modal */}
            {isSettingsOpen && (
                 <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center" onClick={() => setSettingsOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                             <h3 className="text-xl font-bold">Ayarlar</h3>
                             <button onClick={() => setSettingsOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon/></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Okuyucu (Kârî)</label>
                                <select value={reader} onChange={e => setReader(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500">
                                    {reciterList.length > 0 ? (
                                        reciterList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                                    ) : (
                                        <option disabled>Yükleniyor...</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yazı Tipi (Arapça)</label>
                                <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500">
                                    {FONT_LIST.map(font => <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yazı Tipi Boyutu (Kur'an Görünümü)</label>
                                <div className="flex items-center space-x-4">
                                     <input type="range" min="16" max="48" step="2" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full"/>
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

export default QuranReader;
