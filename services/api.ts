import axios from 'axios';
import type { SurahSummary, CombinedAyah, Reciter, PlaylistItem } from '../types';

const API_BASE_URL = 'https://api.alquran.cloud/v1';
const AUDIO_BASE_URL = 'https://cdn.islamic.network/quran/audio/128';

// A simple in-memory cache to avoid refetching static data
const cache = new Map<string, any>();

export const getSurahList = async (): Promise<SurahSummary[]> => {
    if (cache.has('surahList')) {
        return cache.get('surahList');
    }
    try {
        const response = await axios.get(`${API_BASE_URL}/surah`);
        const surahs: SurahSummary[] = response.data.data.map((s: any) => ({
            number: s.number,
            name: s.name,
            englishName: s.englishName,
            revelationType: s.revelationType,
            numberOfAyahs: s.numberOfAyahs,
        }));
        cache.set('surahList', surahs);
        return surahs;
    } catch (error) {
        console.error("Error fetching surah list:", error);
        throw new Error("Failed to fetch surah list");
    }
};

export const getReciterList = async (): Promise<Reciter[]> => {
    if (cache.has('reciterList')) {
        return cache.get('reciterList');
    }
    try {
        // FIX: Corrected the endpoint to fetch audio editions.
        const response = await axios.get(`${API_BASE_URL}/edition?format=audio`);
        const reciters: Reciter[] = response.data.data
            .map((r: any) => ({
                id: r.identifier,
                name: r.englishName,
            }))
            // Sort alphabetically by name for better UX
            .sort((a: Reciter, b: Reciter) => a.name.localeCompare(b.name));

        cache.set('reciterList', reciters);
        return reciters;
    } catch (error) {
        console.error("Error fetching dynamic reciter list:", error);
        // Fallback to a stable list in case of API failure
        return [
            { id: 'ar.alafasy', name: 'Mishary Alafasy' },
            { id: 'ar.abdulsamad', name: 'Abdul Basit' },
            { id: 'ar.sudais', name: 'Abdurrahman As-Sudais' },
            { id: 'ar.husary', name: 'Mahmoud Al-Husary' },
            { id: 'ar.minshawi', name: 'Mohamed Siddiq El-Minshawi' },
        ];
    }
};

export const getPageDetail = async (page: number, reciterId: string): Promise<CombinedAyah[]> => {
    try {
        const [arabicRes, turkishRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/page/${page}/${reciterId}`),
            axios.get(`${API_BASE_URL}/page/${page}/tr.diyanet`)
        ]);

        const arabicAyahs = arabicRes.data.data.ayahs;
        const turkishAyahs = turkishRes.data.data.ayahs;

        const combined: CombinedAyah[] = arabicAyahs.map((ayah: any) => {
            const turkishAyah = turkishAyahs.find((t: any) => t.number === ayah.number);
            return {
                numberInSurah: ayah.numberInSurah,
                arabicText: ayah.text,
                turkishText: turkishAyah ? turkishAyah.text : 'Çeviri bulunamadı.',
                audio: ayah.audio || '', // Use the audio URL from the reciter edition
                number: ayah.number, // overall Ayah number
                juz: ayah.juz,
                page: ayah.page,
                surah: {
                    number: ayah.surah.number,
                    name: ayah.surah.name,
                    englishName: ayah.surah.englishName,
                },
            };
        });

        return combined;
    } catch (error) {
        console.error(`Error fetching page ${page} detail:`, error);
        throw new Error(`Failed to fetch page ${page}`);
    }
};

export const getSurahDetailForPageJump = async (surahNumber: number): Promise<{ page: number }> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/surah/${surahNumber}`);
        // The first ayah of the surah tells us the starting page.
        const firstAyah = response.data.data.ayahs[0];
        return { page: firstAyah.page };
    } catch (error) {
        console.error(`Error fetching surah ${surahNumber} detail:`, error);
        throw new Error(`Failed to fetch surah ${surahNumber} details`);
    }
};

const getAyahsForPlaylist = async (endpoint: string, reciterId: string): Promise<PlaylistItem[]> => {
     try {
        const response = await axios.get(endpoint.replace('quran-uthmani', reciterId));
        const ayahs: any[] = response.data.data.ayahs;
        const playlist: PlaylistItem[] = ayahs
            .filter(ayah => ayah.audio) // Ensure there's an audio URL
            .map(ayah => ({
                ayahNumber: ayah.number,
                audioUrl: ayah.audio,
                pageNumber: ayah.page,
            }));
        return playlist;
    } catch (error) {
        console.error(`Error fetching playlist from ${endpoint}:`, error);
        throw new Error("Failed to construct playlist");
    }
}

export const getJuzVerses = (juzNumber: number, reciterId: string): Promise<PlaylistItem[]> => {
    return getAyahsForPlaylist(`${API_BASE_URL}/juz/${juzNumber}/quran-uthmani`, reciterId);
};

export const getSurahVerses = (surahNumber: number, reciterId: string): Promise<PlaylistItem[]> => {
    return getAyahsForPlaylist(`${API_BASE_URL}/surah/${surahNumber}/quran-uthmani`, reciterId);
};