import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPageDetail, getSurahList, getSurahDetailForPageJump } from '../services/api';
import type { SurahSummary, CombinedAyah } from '../types';
import { useQuranSettings } from '../hooks/useQuranSettings';
import { useQuranAudio } from '../hooks/useQuranAudio';
import { useBookmarks } from '../hooks/useBookmarks';
import { useStreak } from '../hooks/useStreak';
import { QuranSkeleton, TranslationSkeleton } from './QuranSkeleton';
import QuranSidebar from './QuranSidebar';
import QuranHeader from './QuranHeader';
import QuranFooter from './QuranFooter';
import QuranSettingsModal from './QuranSettingsModal';
import QuranPageView from './QuranPageView';

const TOTAL_PAGES = 604;

interface QuranReaderProps {
    onGoHome: () => void;
    initialPage?: number | null;
    highlightAyahNumber?: number | null;
}

const QuranReader: React.FC<QuranReaderProps> = ({ onGoHome, initialPage, highlightAyahNumber }) => {
    // Shared State
    const [viewMode, setViewMode] = useState<'quran' | 'translation'>(() => (localStorage.getItem('quranViewMode') as 'quran' | 'translation') || 'quran');
    const [currentPage, setCurrentPage] = useState<number>(() => initialPage || parseInt(localStorage.getItem('quranLastPage') || '1'));
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // UI Toggle State
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [pageAnimationClass, setPageAnimationClass] = useState<string>('');

    // Custom Hooks
    const settings = useQuranSettings();
    const bookmarkManager = useBookmarks();
    const streakManager = useStreak();
    const queryClient = useQueryClient();

    // Data Fetching with React Query
    const { data: surahList = [], isError: isSurahError } = useQuery({
        queryKey: ['surahList'],
        queryFn: getSurahList,
        staleTime: Infinity,
    });

    const { data: pageData = [], isLoading, isError: isPageError } = useQuery({
        queryKey: ['quranPage', currentPage, settings.reader],
        queryFn: () => getPageDetail(currentPage, settings.reader),
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    // Custom Hooks
    const audio = useQuranAudio({
        currentPage,
        setCurrentPage,
        reader: settings.reader,
        pageData,
        isLoading: isAudioLoading || isLoading,
        setIsLoading: setIsAudioLoading,
        setError: setLocalError
    });

    // Prefetch next page
    useEffect(() => {
        if (currentPage < TOTAL_PAGES) {
            queryClient.prefetchQuery({
                queryKey: ['quranPage', currentPage + 1, settings.reader],
                queryFn: () => getPageDetail(currentPage + 1, settings.reader),
                staleTime: 1000 * 60 * 60,
            });
        }
    }, [currentPage, settings.reader, queryClient]);

    const error = localError || (isSurahError || isPageError ? "Veriler yüklenemedi. Lütfen internet bağlantınızı kontrol edin." : null);

    // Save View Mode and Page
    useEffect(() => {
        localStorage.setItem('quranViewMode', viewMode);
        localStorage.setItem('quranLastPage', currentPage.toString());
    }, [viewMode, currentPage]);

    // Navigation Handlers
    const jumpToPage = (page: number) => {
        if (page >= 1 && page <= TOTAL_PAGES && page !== currentPage) {
            if (audio.playbackMode === 'juz' || audio.playbackMode === 'surah') {
                audio.handleStop();
            }
            streakManager.markPageRead();

            const isNext = page > currentPage;
            setPageAnimationClass(isNext ? 'page-turn-left' : 'page-turn-right');

            setTimeout(() => {
                setCurrentPage(page);
                setPageAnimationClass(isNext ? 'page-enter-right' : 'page-enter-left');
                setTimeout(() => setPageAnimationClass(''), 500);
            }, 250); // half time of animation
        }
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    const jumpToSurah = async (surahNumber: number) => {
        try {
            const { page } = await getSurahDetailForPageJump(surahNumber);
            jumpToPage(page);
        } catch (err) {
            setLocalError('Sureye atlanamadı.');
        }
    };

    const handleAyahClick = (ayah: CombinedAyah) => {
        const indexOnPage = pageData.findIndex(a => a.number === ayah.number);
        if (indexOnPage !== -1) {
            // Provide a way to play an ayah directly by clicking
            audio.handlePlayPage(indexOnPage);
        }
    };

    // Swipe handlers for mobile page turning
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchEndX, setTouchEndX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const [touchEndY, setTouchEndY] = useState<number | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEndX(null);
        setTouchEndY(null);
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchStartY(e.targetTouches[0].clientY);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX);
        setTouchEndY(e.targetTouches[0].clientY);
    };

    const onTouchEndFixed = () => {
        if (touchStartX === null || touchEndX === null) return;
        const distance = touchStartX - touchEndX;
        const verticalDistance = touchStartY !== null && touchEndY !== null ? Math.abs(touchStartY - touchEndY) : 0;
        const minSwipeDistance = 50;

        // Nur blättern, wenn die Geste klar horizontal ist — sonst löst
        // vertikales Scrollen mit leichter Drift ungewollt Seitenwechsel aus.
        if (Math.abs(distance) <= verticalDistance) return;

        if (distance > minSwipeDistance) {
            if (currentPage < TOTAL_PAGES) jumpToPage(currentPage + 1);
        } else if (distance < -minSwipeDistance) {
            if (currentPage > 1) jumpToPage(currentPage - 1);
        }
    };

    return (
        <div className="flex h-dvh bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            {/* onError: bei 404/Netzwerkfehler eines Tracks zum nächsten springen statt stumm stehenzubleiben */}
            <audio ref={audio.audioRef} onEnded={audio.handleAudioEnded} onError={audio.handleAudioEnded} />

            <QuranSidebar
                isOpen={isSidebarOpen && !isFocusMode}
                setIsOpen={setSidebarOpen}
                surahList={surahList}
                playbackMode={audio.playbackMode}
                activePlaybackId={audio.activePlaybackId}
                jumpToSurah={jumpToSurah}
                jumpToPage={jumpToPage}
                handlePlaySurah={audio.handlePlaySurah}
                handlePlayJuz={audio.handlePlayJuz}
                bookmarks={bookmarkManager.bookmarks}
                removeBookmark={bookmarkManager.toggleBookmark}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <QuranHeader
                    isSidebarOpen={isSidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    isPlaying={audio.isPlaying}
                    handleMainPlayPause={audio.handleMainPlayPause}
                    handleStop={audio.handleStop}
                    playbackMode={audio.playbackMode}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    setSettingsOpen={setSettingsOpen}
                    onGoHome={onGoHome}
                    isFocusMode={isFocusMode}
                    setIsFocusMode={setIsFocusMode}
                    pagesReadToday={streakManager.pagesReadToday}
                    currentStreak={streakManager.currentStreak}
                />

                <main
                    className={`flex-1 flex flex-col overflow-y-auto w-full transition-all duration-500 ${isFocusMode ? 'mt-4' : ''}`}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEndFixed}
                >
                    {isLoading ? (viewMode === 'quran' ? <QuranSkeleton /> : <TranslationSkeleton />) : error ? <div className="m-auto text-center text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</div> : (
                        <div className={`w-full h-full pb-16 ${pageAnimationClass}`}>
                            <QuranPageView
                                pageData={pageData}
                                currentPage={currentPage}
                                viewMode={viewMode}
                                fontFamily={settings.fontFamily}
                                fontSize={settings.fontSize}
                                highlightAyahNumber={highlightAyahNumber}
                                currentlyPlayingAyahNumber={audio.currentlyPlayingAyahNumber}
                                handlePlaySingleAyah={audio.handlePlaySingleAyah}
                                handleAyahClick={handleAyahClick}
                                bookmarkManager={bookmarkManager}
                            />
                        </div>
                    )}
                </main>

                <QuranFooter
                    currentPage={currentPage}
                    jumpToPage={jumpToPage}
                    isFocusMode={isFocusMode}
                />
            </div>

            <QuranSettingsModal
                isOpen={isSettingsOpen}
                setIsOpen={setSettingsOpen}
                reader={settings.reader}
                setReader={settings.setReader}
                reciterList={settings.reciterList}
                fontFamily={settings.fontFamily}
                setFontFamily={settings.setFontFamily}
                fontSize={settings.fontSize}
                setFontSize={settings.setFontSize}
            />
        </div>
    );
};

export default QuranReader;
