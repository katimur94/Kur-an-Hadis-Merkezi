export interface SurahSummary {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
  numberOfAyahs: number;
}

export interface CombinedAyah {
    numberInSurah: number;
    arabicText: string;
    turkishText: string;
    audio: string;
    number: number; // overall Ayah number
    juz: number;
    page: number;
    surah: {
      number: number;
      name: string;
      englishName: string;
    };
}

export interface Reciter {
    id: string;
    name: string;
}

// AI Hadith Search Types
export interface HadithResult {
  text: string;
  source: string;
}

export interface AIHadithResponse {
    hadiths: HadithResult[];
    hasMore: boolean;
}

export interface PlaylistItem {
  ayahNumber: number; // The unique, overall number of the ayah
  audioUrl: string;
  pageNumber: number;
}