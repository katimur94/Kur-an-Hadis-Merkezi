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

        setPagesReadToday(prev => {
            const newVal = prev + 1;
            localStorage.setItem('quranPagesReadToday', newVal.toString());
            return newVal;
        });

        setCurrentStreak(prev => {
            // Only increment streak if this is the FIRST page read today
            if (pagesReadToday === 0) {
                const newStreak = prev + 1;
                localStorage.setItem('quranStreak', newStreak.toString());
                return newStreak;
            }
            return prev;
        });

        localStorage.setItem('quranLastReadDate', today);
    };

    return {
        pagesReadToday,
        currentStreak,
        markPageRead
    };
}
