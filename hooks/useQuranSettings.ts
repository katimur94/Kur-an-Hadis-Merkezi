import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReciterList } from '../services/api';
import type { Reciter } from '../types';

export const FONT_LIST = [
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

export function useQuranSettings() {
    const [reader, setReader] = useState<string>(() => localStorage.getItem('quranReader') || 'ar.alafasy');
    const [fontSize, setFontSize] = useState<number>(() => parseInt(localStorage.getItem('quranFontSize') || '24'));
    const [fontFamily, setFontFamily] = useState<string>(() => localStorage.getItem('quranFontFamily') || FONT_LIST[0].value);

    const { data: reciterList = [] } = useQuery({
        queryKey: ['reciterList'],
        queryFn: getReciterList,
        staleTime: Infinity, // Reciter list rarely changes
    });

    useEffect(() => {
        localStorage.setItem('quranReader', reader);
        localStorage.setItem('quranFontSize', fontSize.toString());
        localStorage.setItem('quranFontFamily', fontFamily);
    }, [reader, fontSize, fontFamily]);

    return {
        reader,
        setReader,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        reciterList,
    };
}
