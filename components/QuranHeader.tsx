import React from 'react';

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" /></svg>);
const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" /></svg>);
const StopIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M5.334 2.25a2.25 2.25 0 0 0-2.25 2.25v11.25a2.25 2.25 0 0 0 2.25 2.25h9.332a2.25 2.25 0 0 0 2.25-2.25V4.5a2.25 2.25 0 0 0-2.25-2.25H5.334Z" /></svg>);
const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296-2.247a1.125 1.125 0 0 1-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 0 1-1.37-.49l-1.296-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 0 1-.26-1.431l1.296-2.247a1.125 1.125 0 0 1 1.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>);
const FocusIcon: React.FC<{ className?: string, isFocus?: boolean }> = ({ className, isFocus }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        {isFocus ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        )}
    </svg>
);

interface QuranHeaderProps {
    isSidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    isPlaying: boolean;
    handleMainPlayPause: () => void;
    handleStop: () => void;
    playbackMode: string;
    viewMode: 'quran' | 'translation';
    setViewMode: (mode: 'quran' | 'translation') => void;
    setSettingsOpen: (open: boolean) => void;
    onGoHome: () => void;
    isFocusMode?: boolean;
    setIsFocusMode?: (mode: boolean) => void;
    pagesReadToday?: number;
    currentStreak?: number;
}

const QuranHeader: React.FC<QuranHeaderProps> = ({
    isSidebarOpen, setSidebarOpen, isPlaying, handleMainPlayPause, handleStop, playbackMode, viewMode, setViewMode, setSettingsOpen, onGoHome, isFocusMode, setIsFocusMode, pagesReadToday = 0, currentStreak = 0
}) => {
    return (
        <header className={`flex-shrink-0 relative z-10 transition-all duration-500 ease-in-out ${isFocusMode ? '-translate-y-full opacity-0 absolute top-0 w-full hover:translate-y-0 hover:opacity-100' : 'bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-800/50 p-2 flex justify-between items-center'}`}>
            <div className="flex items-center space-x-2">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"><MenuIcon /></button>
                <div className="flex items-center space-x-2">
                    <button onClick={handleMainPlayPause} className="p-2 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-600 dark:text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors">
                        {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                    </button>
                    <button onClick={handleStop} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/40 text-red-500 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors" disabled={!isPlaying && playbackMode === 'none'}>
                        <StopIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <div className="flex-1 flex justify-center px-1 min-w-0">
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="hidden lg:flex items-center space-x-3 text-xs font-medium text-gray-500 bg-gray-100/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                        <span title="Bugün okunan sayfa">📖 {pagesReadToday} Syf</span>
                        {currentStreak > 0 && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                <span title="Kesintisiz okuma günü" className="text-amber-600 dark:text-amber-500 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mr-1"><path fillRule="evenodd" d="M13.5 4.938a7 7 0 1 1-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.688.928 1.005A3.5 3.5 0 0 0 11 11.5l1.651-.256c.162-.024.281-.15.292-.312.022-.321.04-.64.057-.956L15 8.453v-.353l-1.5-.107A7.01 7.01 0 0 1 13.5 4.938Z" clipRule="evenodd" /></svg>
                                    {currentStreak} Gün
                                </span>
                            </>
                        )}
                    </div>

                    <div className="bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-lg flex items-center shadow-inner border border-gray-200/30 dark:border-gray-700/30">
                        <button onClick={() => setViewMode('quran')} className={`px-2 sm:px-4 py-1 text-xs sm:text-sm rounded-md whitespace-nowrap transition-all duration-300 ${viewMode === 'quran' ? 'bg-white dark:bg-gray-700 shadow-sm text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <span className="sm:hidden">Kur'an</span>
                            <span className="hidden sm:inline">Kur'an Görünümü</span>
                        </button>
                        <button onClick={() => setViewMode('translation')} className={`px-2 sm:px-4 py-1 text-xs sm:text-sm rounded-md whitespace-nowrap transition-all duration-300 ${viewMode === 'translation' ? 'bg-white dark:bg-gray-700 shadow-sm text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
                            <span className="sm:hidden">Meal</span>
                            <span className="hidden sm:inline">Meal Görünümü</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
                {setIsFocusMode && (
                    <button onClick={() => setIsFocusMode(!isFocusMode)} className="p-2 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 transition-colors" title="Odak Modu">
                        <FocusIcon isFocus={isFocusMode} />
                    </button>
                )}
                <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"><SettingsIcon /></button>
                <button onClick={onGoHome} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"><HomeIcon /></button>
            </div>
        </header>
    );
};

export default QuranHeader;
