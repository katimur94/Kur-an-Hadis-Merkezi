import { useState, useEffect } from 'react';

export function useStreak() {
    const [pagesReadToday, setPagesReadToday] = useState<number>(0);
    const [currentStreak, setCurrentStreak] = useState<number>(0);

    useEffect(() => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const storedDate = localStorage.getItem('quranLastReadDate');
            const storedPagesToday = parseInt(localStorage.getItem('quranPagesReadToday') || '0', 10);
            let storedStreak = parseInt(localStorage.getItem('quranStreak') || '0', 10);

            if (storedDate === today) {
                setPagesReadToday(storedPagesToday);
                setCurrentStreak(storedStreak);
            } else {
                // Determine if it was exactly yesterday
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (storedDate === yesterdayStr) {
                    // Streak continues, just reset today's page count
                    setCurrentStreak(storedStreak);
                    setPagesReadToday(0);
                } else if (storedDate) {
                    // Broken streak
                    setCurrentStreak(0);
                    setPagesReadToday(0);
                }
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    const markPageRead = () => {
        const today = new Date().toISOString().split('T')[0];
        // Über das persistierte Datum statt über Closure-State entscheiden:
        // zwei schnelle Aufrufe vor einem Re-Render sahen sonst beide
        // pagesReadToday === 0 und zählten den Streak doppelt.
        const lastReadDate = localStorage.getItem('quranLastReadDate');
        const isFirstPageToday = lastReadDate !== today;
        localStorage.setItem('quranLastReadDate', today);

        setPagesReadToday(prev => {
            const newVal = isFirstPageToday ? 1 : prev + 1;
            localStorage.setItem('quranPagesReadToday', newVal.toString());
            return newVal;
        });

        if (isFirstPageToday) {
            setCurrentStreak(prev => {
                const newStreak = prev + 1;
                localStorage.setItem('quranStreak', newStreak.toString());
                return newStreak;
            });
        }
    };

    return {
        pagesReadToday,
        currentStreak,
        markPageRead
    };
}
