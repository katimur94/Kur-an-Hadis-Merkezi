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
    audio?: string;
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

// WordAnalysisResult is the structured feedback for a single word from the AI.
// This is what gets saved for each identified error.
export interface WordAnalysisResult {
  wordIndex: number;
  word: string;
  errorType: string; // e.g., "Tecvid Hatası: İdgam"
  explanation: string; // "Nun harfi bir sonraki harfe katılmalıydı."
  ruleInfo: string; // "İdgam, tenvin veya sakin nun'dan sonra..."
}

// The entire analysis for a page, which is an array of individual word errors.
// This is what's stored in localStorage.
export type PageAnalysis = WordAnalysisResult[];
