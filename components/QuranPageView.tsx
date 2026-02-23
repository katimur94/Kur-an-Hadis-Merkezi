import React, { useState, useEffect, useRef } from 'react';
import type { CombinedAyah } from '../types';
import { FONT_LIST } from '../hooks/useQuranSettings';
import { HighlightableText } from './Lugat';

const ARABIC_NUMERALS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const toArabicNumeral = (n: number) => n.toString().split('').map(digit => ARABIC_NUMERALS[parseInt(digit)]).join('');

// --- ICONS ---
const BookmarkIcon: React.FC<{ className?: string, solid?: boolean }> = ({ className, solid }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={solid ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
);

interface QuranPageViewProps {
    pageData: CombinedAyah[];
    currentPage: number;
    viewMode: 'quran' | 'translation';
    fontFamily: string;
    fontSize: number;
    highlightAyahNumber?: number | null;
    currentlyPlayingAyahNumber?: number;
    handlePlaySingleAyah: (ayah: CombinedAyah) => void;
    handleAyahClick: (ayah: CombinedAyah) => void;
    bookmarkManager: any; // Type from useBookmarks ideally
}

const QuranPageView: React.FC<QuranPageViewProps> = ({
    pageData, currentPage, viewMode, fontFamily, fontSize, highlightAyahNumber, currentlyPlayingAyahNumber, handleAyahClick, bookmarkManager
}) => {
    const [hoveredAyah, setHoveredAyah] = useState<number | null>(null);
    const ayahRefs = useRef<{ [key: number]: HTMLElement | null }>({});

    useEffect(() => {
        if (currentlyPlayingAyahNumber && ayahRefs.current[currentlyPlayingAyahNumber]) {
            ayahRefs.current[currentlyPlayingAyahNumber]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [currentlyPlayingAyahNumber]);

    const renderQuranViewContent = () => {
        const elements: React.ReactNode[] = [];
        pageData.forEach((ayah, index) => {
            if (index > 0 && ayah.surah.number !== pageData[index - 1].surah.number) {
                elements.push(
                    <div key={`surah-header-${ayah.surah.number}`} className="w-full my-6 text-center">
                        <h2 className="text-4xl font-amiri font-bold text-amber-500 dark:text-amber-400" style={{ fontFamily: FONT_LIST[0].value }}>{ayah.surah.name}</h2>
                    </div>
                );
            }
            const isPermanentlyHighlighted = highlightAyahNumber === ayah.number;
            let ayahClasses = 'cursor-pointer transition-all duration-300 rounded px-1';
            if (isPermanentlyHighlighted) {
                ayahClasses += ' bg-yellow-200 dark:bg-yellow-800/50';
            }
            if (currentlyPlayingAyahNumber === ayah.number) {
                ayahClasses += ' font-bold text-teal-600 dark:text-teal-400';
            } else if (!isPermanentlyHighlighted) {
                ayahClasses += ' hover:bg-gray-200 dark:hover:bg-gray-700';
            }

            const isBookmarked = bookmarkManager.isBookmarked(ayah.number);

            elements.push(
                <span
                    key={ayah.number}
                    ref={el => { ayahRefs.current[ayah.number] = el; }}
                    className="inline relative group"
                    onMouseEnter={() => setHoveredAyah(ayah.number)}
                    onMouseLeave={() => setHoveredAyah(null)}
                >
                    <span onClick={() => handleAyahClick(ayah)} className={ayahClasses}>
                        {ayah.arabicText}
                        <span className="text-sm font-sans text-amber-600 dark:text-amber-400 mx-1">۝{toArabicNumeral(ayah.numberInSurah)}</span>
                    </span>
                    {(hoveredAyah === ayah.number || isBookmarked) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); bookmarkManager.toggleBookmark(ayah.number, ayah.surah.name, ayah.numberInSurah, currentPage); }}
                            className={`absolute -top-3 -right-2 p-1 rounded-full ${isBookmarked ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'} bg-white dark:bg-gray-800 shadow-sm transition-all z-10`}
                            title={isBookmarked ? "Lesezeichen entfernen" : "Lesezeichen setzen"}
                        >
                            <BookmarkIcon className="w-4 h-4" solid={isBookmarked} />
                        </button>
                    )}
                </span>
            );
        });

        const surahNamesOnPage = [...new Set(pageData.map(a => a.surah.name))].join(' - ');

        return (
            <div className="p-4 md:p-8 flex-1 flex items-center justify-center select-text">
                <div className="w-full max-w-5xl 2xl:max-w-6xl bg-[#FDFCF8] dark:bg-[#1e293b] text-gray-900 dark:text-gray-100 shadow-xl rounded-2xl p-6 border-4 border-double border-amber-300 dark:border-amber-700/50 relative overflow-hidden transition-all duration-500">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 opacity-50"></div>

                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-6 px-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Cüz {pageData[0]?.juz}</span>
                        <span className="font-amiri text-lg text-amber-600 dark:text-amber-400">{surahNamesOnPage}</span>
                        <span className="font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Sayfa {currentPage}</span>
                    </div>

                    <div className="text-center" style={{ fontFamily: fontFamily, fontSize: `${fontSize}px`, lineHeight: 2.5 }}>
                        {elements}
                    </div>
                </div>
            </div>
        )
    };

    const renderTranslationViewContent = () => {
        const elements: React.ReactNode[] = [];

        pageData.forEach((ayah, index) => {
            const isPermanentlyHighlighted = highlightAyahNumber === ayah.number;
            if (index > 0 && ayah.surah.number !== pageData[index - 1].surah.number) {
                elements.push(
                    <div key={`surah-header-tr-${ayah.surah.number}`} className="my-10 text-center">
                        <div className="inline-block relative">
                            <h2 className="text-3xl font-amiri font-bold text-amber-500 dark:text-amber-400 relative z-10 px-6 py-2" style={{ fontFamily: FONT_LIST[0].value }}>{ayah.surah.name}</h2>
                            <div className="absolute inset-0 border-t-2 border-b-2 border-amber-300 dark:border-amber-700 opacity-50 rounded-full"></div>
                        </div>
                    </div>
                );
            }

            let arabicTextClasses = `text-right text-3xl leading-loose mb-4 cursor-pointer transition-colors duration-300`;
            if (currentlyPlayingAyahNumber === ayah.number) {
                arabicTextClasses += ' font-bold text-teal-600 dark:text-teal-400';
            }

            const isBookmarked = bookmarkManager.isBookmarked(ayah.number);

            elements.push(
                <div key={ayah.number} ref={el => { ayahRefs.current[ayah.number] = el; }} className={`py-6 border-b border-gray-200 dark:border-gray-700/50 p-4 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isPermanentlyHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/20 shadow-inner' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-bold text-sm shadow-sm ring-2 ring-white dark:ring-gray-800">
                            {ayah.numberInSurah}
                        </span>
                        <button
                            onClick={() => bookmarkManager.toggleBookmark(ayah.number, ayah.surah.name, ayah.numberInSurah, currentPage)}
                            className={`p-1.5 rounded-full transition-colors ${isBookmarked ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'}`}
                            title="Lesezeichen"
                        >
                            <BookmarkIcon className="w-5 h-5" solid={isBookmarked} />
                        </button>
                    </div>
                    <p style={{ fontFamily: fontFamily }} className={arabicTextClasses} onClick={() => handleAyahClick(ayah)}>
                        {ayah.arabicText}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mt-4">
                        <HighlightableText>{ayah.turkishText}</HighlightableText>
                    </p>
                </div>
            );
        });

        return (
            <div className="w-full max-w-4xl 2xl:max-w-5xl mx-auto p-4 md:p-6 select-text mb-12">
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800/60 overflow-hidden transition-all duration-500">
                    {elements}
                </div>
            </div>
        );
    };

    return viewMode === 'quran' ? renderQuranViewContent() : renderTranslationViewContent();
};

export default QuranPageView;
