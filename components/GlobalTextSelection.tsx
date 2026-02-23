import React, { useState, useEffect, useCallback } from 'react';
import { useLugat } from './Lugat';

const BookmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

interface Note {
    id: string;
    text: string;
    date: string;
    sourceModule?: string;
}

export const GlobalTextSelection: React.FC = () => {
    const { searchLugatTerm } = useLugat();
    const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
    const [showNotification, setShowNotification] = useState(false);

    const handleSelectionChange = useCallback(() => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
            const text = sel.toString().trim();
            if (text.length > 500) {
                // Ignore extremely large selections to avoid UI clutter
                setSelection(null);
                return;
            }

            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Calculate center top of the selection box
            setSelection({
                text,
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            });
        } else {
            setSelection(null);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('touchend', handleSelectionChange);

        return () => {
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('touchend', handleSelectionChange);
        };
    }, [handleSelectionChange]);

    const handleSaveNote = () => {
        if (!selection) return;

        const existingNotesStr = localStorage.getItem('dijitalMedreseNotes');
        const existingNotes: Note[] = existingNotesStr ? JSON.parse(existingNotesStr) : [];

        // Try to guess current module from URL or let user know
        let currentModule = "Genel";
        if (window.location.hash.includes('quran')) currentModule = "Kur'an Okuma";
        if (window.location.hash.includes('hadith')) currentModule = "Hadis Araştırma";
        if (window.location.hash.includes('risale')) currentModule = "Risale-i Nur";
        if (window.location.hash.includes('fiqh')) currentModule = "Fıkıh Sohbeti";

        const newNote: Note = {
            id: Date.now().toString(),
            text: selection.text,
            date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            sourceModule: currentModule
        };

        localStorage.setItem('dijitalMedreseNotes', JSON.stringify([newNote, ...existingNotes]));

        setSelection(null);
        window.getSelection()?.removeAllRanges();

        // Show short success notification
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000);

        // Dispatch custom event to notify notes modal if open
        window.dispatchEvent(new Event('notesUpdated'));
    };

    const handleSearchLugat = () => {
        if (!selection) return;

        const term = selection.text;
        setSelection(null);
        window.getSelection()?.removeAllRanges();

        searchLugatTerm(term);
    };

    return (
        <>
            {selection && (
                <div
                    className="fixed z-[100] flex items-center space-x-1 bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg shadow-2xl p-1.5 animate-scale-in"
                    style={{
                        left: Math.max(10, Math.min(selection.x, window.innerWidth - 200)), // Prevent overflowing right edge
                        top: Math.max(10, selection.y - 45), // Position slightly above selection
                        transform: 'translateX(-50%)'
                    }}
                    onMouseDown={(e) => e.preventDefault()} // Prevent taking focus away from selection
                >
                    <button
                        onClick={handleSaveNote}
                        className="flex items-center px-3 py-1.5 text-xs font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 rounded-md transition-colors"
                    >
                        <BookmarkIcon />
                        Not Al
                    </button>
                    <div className="w-px h-5 bg-gray-600 dark:bg-gray-300 mx-1"></div>
                    <button
                        onClick={handleSearchLugat}
                        className="flex items-center px-3 py-1.5 text-xs font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 rounded-md transition-colors"
                    >
                        <SearchIcon />
                        Lügat'ta Ara
                    </button>

                    {/* Small triangle arrow at bottom */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-800 dark:border-t-gray-100"></div>
                </div>
            )}

            {showNotification && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg z-[150] animate-fade-in">
                    Lesezeichen / Not kaydedildi!
                </div>
            )}
        </>
    );
};
