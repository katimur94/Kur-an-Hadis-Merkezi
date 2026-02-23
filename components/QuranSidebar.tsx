import React, { useState } from 'react';
import type { SurahSummary } from '../types';

export const juzStartPages = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" /></svg>);
const BookmarkSolidIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" /></svg>);

interface QuranSidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    surahList: SurahSummary[];
    playbackMode: string;
    activePlaybackId: number | null;
    jumpToSurah: (surahNumber: number) => void;
    jumpToPage: (page: number) => void;
    handlePlaySurah: (surahNumber: number) => void;
    handlePlayJuz: (juzNumber: number) => void;
    bookmarks: any[];
    removeBookmark: (ayahNumber: number, surahName: string, numberInSurah: number, page: number) => void;
}

const QuranSidebar: React.FC<QuranSidebarProps> = ({
    isOpen, setIsOpen, surahList, playbackMode, activePlaybackId, jumpToSurah, jumpToPage, handlePlaySurah, handlePlayJuz, bookmarks, removeBookmark
}) => {
    const [navTab, setNavTab] = useState<'surah' | 'juz' | 'bookmarks'>('surah');

    return (
        <aside className={`absolute lg:relative z-20 flex flex-col h-full bg-white dark:bg-[#0f172a] border-r border-gray-200/50 dark:border-gray-800/50 shadow-lg transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '300px' }}>
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 flex justify-between items-center">
                <h2 className="font-bold text-lg">Navigasyon</h2>
                <button onClick={() => setIsOpen(false)} className="lg:hidden p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
            </div>
            <div className="flex border-b border-gray-200/50 dark:border-gray-800/50">
                <button onClick={() => setNavTab('surah')} className={`flex-1 p-3 text-sm font-medium transition-colors ${navTab === 'surah' ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>Sureler</button>
                <button onClick={() => setNavTab('juz')} className={`flex-1 p-3 text-sm font-medium transition-colors ${navTab === 'juz' ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>Cüzler</button>
                <button onClick={() => setNavTab('bookmarks')} className={`p-3 border-b-2 transition-colors ${navTab === 'bookmarks' ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-transparent text-gray-400 hover:text-amber-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`} title="Lesezeichen">
                    <BookmarkSolidIcon className="w-5 h-5 mx-auto" />
                </button>
            </div>
            <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                {navTab === 'surah' && surahList.map(s => (
                    <li key={s.number} className={`flex items-center justify-between p-2.5 rounded-md text-sm transition-colors ${playbackMode === 'surah' && activePlaybackId === s.number ? 'bg-amber-100/50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 font-medium' : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50'}`}>
                        <button onClick={() => jumpToSurah(s.number)} className="flex-1 text-left flex justify-between"><span>{s.number}. {s.name}</span> <span className="text-gray-500 dark:text-gray-400">{s.englishName}</span></button>
                        <button onClick={() => handlePlaySurah(s.number)} className="ml-2 p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-teal-600 dark:text-teal-400 transition-transform hover:scale-110 active:scale-95"><PlayIcon className="w-4 h-4" /></button>
                    </li>
                ))}
                {navTab === 'juz' && [...Array(30)].map((_, i) => (
                    <li key={i} className={`flex items-center justify-between p-2.5 rounded-md text-sm ${playbackMode === 'juz' && activePlaybackId === i + 1 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        <button onClick={() => jumpToPage(juzStartPages[i])} className="flex-1 text-left">Cüz {i + 1}</button>
                        <button onClick={() => handlePlayJuz(i + 1)} className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-teal-600 dark:text-teal-400"><PlayIcon className="w-4 h-4" /></button>
                    </li>
                ))}
                {navTab === 'bookmarks' && (
                    bookmarks.length === 0 ? (
                        <div className="text-center p-4 text-gray-500 dark:text-gray-400 text-sm">Keine Lesezeichen vorhanden.</div>
                    ) : (
                        bookmarks.map(b => (
                            <li key={b.ayahNumber} className="flex items-center justify-between p-2.5 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 group transition-colors">
                                <button onClick={() => jumpToPage(b.page)} className="flex-1 text-left flex flex-col">
                                    <span className="font-medium text-amber-700 dark:text-amber-400">{b.surahName}</span>
                                    <span className="text-xs text-gray-500">Ayet: {b.numberInSurah} • Sayfa: {b.page}</span>
                                </button>
                                <button onClick={() => removeBookmark(b.ayahNumber, b.surahName, b.numberInSurah, b.page)} className="ml-2 p-1 rounded-full text-red-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))
                    )
                )}
            </ul>
        </aside>
    );
};

export default QuranSidebar;
