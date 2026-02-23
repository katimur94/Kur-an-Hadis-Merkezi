import React from 'react';

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>);
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>);

const TOTAL_PAGES = 604;

interface QuranFooterProps {
    currentPage: number;
    jumpToPage: (page: number) => void;
    isFocusMode?: boolean;
}

const QuranFooter: React.FC<QuranFooterProps> = ({ currentPage, jumpToPage, isFocusMode }) => {
    return (
        <footer className={`flex-shrink-0 relative z-10 p-3 flex justify-between items-center transition-all duration-500 ease-in-out ${isFocusMode ? 'translate-y-full opacity-0 absolute bottom-0 w-full hover:translate-y-0 hover:opacity-100' : 'bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-gray-200/50 dark:border-gray-800/50'}`}>
            <button
                onClick={() => jumpToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-md disabled:opacity-50 flex items-center space-x-2 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium transition-colors"
            >
                <ChevronLeftIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Önceki Sayfa</span>
            </button>
            <div className="flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {currentPage} <span className="text-gray-400 font-normal">/ {TOTAL_PAGES}</span>
                </span>
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${(currentPage / TOTAL_PAGES) * 100}%` }}></div>
                </div>
            </div>
            <button
                onClick={() => jumpToPage(currentPage + 1)}
                disabled={currentPage === TOTAL_PAGES}
                className="px-4 py-2 rounded-md disabled:opacity-50 flex items-center space-x-2 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium transition-colors"
            >
                <span className="hidden sm:inline">Sonraki Sayfa</span>
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </footer>
    );
};

export default QuranFooter;
