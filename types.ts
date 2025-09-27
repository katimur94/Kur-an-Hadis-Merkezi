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
export interface SourceInfo {
  book: string;
  chapter: string;
  hadithNumber: string;
  volume?: string;
  pageNumber?: string;
}

export interface HadithResult {
  arabicText: string;
  turkishText: string;
  narrator: string;
  source: SourceInfo;
}

export interface FiqhSourceInfo {
  bookTitle: string;
  author?: string;
  volume?: string;
  pageNumber?: string;
}

export interface ImamCommentary {
  imamName: string; // e.g., "İmam Ebu Hanife (Hanefi Mezhebi)"
  commentary: string;
  source: FiqhSourceInfo;
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


// AI Fiqh Chat Types
export interface MadhabPosition {
  madhab: 'Hanefi' | 'Şafii' | 'Maliki' | 'Hanbeli';
  position: string;
  source: FiqhSourceInfo;
}

export interface RelevantHadith {
  arabicText: string;
  turkishText: string;
  source: string; // e.g., "Sahih-i Buhari, Oruç, 2"
  authenticity: 'Sahih' | 'Hasan' | 'Zayıf' | 'Mevzu';
}

export interface RelevantQuranVerse {
  arabicText: string;
  turkishText: string;
  reference: string; // e.g., "Bakara, 183"
}

export interface FiqhResponse {
  summary: string;
  madhahibPositions: MadhabPosition[];
  relevantHadiths: RelevantHadith[];
  relevantQuranVerses: RelevantQuranVerse[];
}
