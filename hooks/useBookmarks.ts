import { useState, useEffect } from 'react';

export interface Bookmark {
    ayahNumber: number;
    surahName: string;
    numberInSurah: number;
    page: number;
}

export function useBookmarks() {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
        try {
            const stored = localStorage.getItem('quranBookmarks');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('quranBookmarks', JSON.stringify(bookmarks));
        // 'storage' feuert nur in anderen Tabs — im selben Tab lauscht das
        // Notiz-/Lesezeichen-Modal auf dieses Custom-Event.
        window.dispatchEvent(new Event('notesUpdated'));
    }, [bookmarks]);

    const toggleBookmark = (ayahNumber: number, surahName: string, numberInSurah: number, page: number) => {
        setBookmarks(prev => {
            const isBookmarked = prev.some(b => b.ayahNumber === ayahNumber);
            if (isBookmarked) {
                return prev.filter(b => b.ayahNumber !== ayahNumber);
            } else {
                return [...prev, { ayahNumber, surahName, numberInSurah, page }];
            }
        });
    };

    const isBookmarked = (ayahNumber: number) => {
        return bookmarks.some(b => b.ayahNumber === ayahNumber);
    };

    return {
        bookmarks,
        toggleBookmark,
        isBookmarked,
    };
}
