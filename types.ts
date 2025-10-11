// --- Quran Reader & General API Types ---

export interface SurahSummary {
    number: number;
    name: string;
    englishName: string;
    revelationType: string;
    numberOfAyahs: number;
}

export interface Reciter {
    id: string;
    name: string;
}

export interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
}

export interface CombinedAyah {
    numberInSurah: number;
    arabicText: string;
    turkishText: string;
    audio?: string;
    number: number;
    juz: number;
    page: number;
    surah: SurahInfo;
}

export interface PlaylistItem {
    ayahNumber: number;
    audioUrl: string;
    pageNumber: number;
}


// --- Hadith Search Types ---

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

export interface AIHadithResponse {
    hadiths: HadithResult[];
    hasMore: boolean;
}

export interface FiqhSourceInfo {
    bookTitle: string;
    author?: string;
    volume?: string;
    pageNumber?: string;
}

export interface ImamCommentary {
    imamName: string;
    commentary: string;
    source: FiqhSourceInfo;
}


// --- Quran Recitation Checker Types ---

export interface WordAnalysisResult {
    wordIndex: number;
    word: string;
    errorType: string;
    explanation: string;
    ruleInfo: string;
}

export type PageAnalysis = WordAnalysisResult[];


// --- Fiqh Chat Types ---

export interface MadhabPosition {
    madhab: string;
    position: string;
    source: FiqhSourceInfo;
}

export interface FiqhHadith {
    arabicText: string;
    turkishText: string;
    source: string;
    authenticity: string;
}

export interface FiqhQuranVerse {
    arabicText: string;
    turkishText: string;
    reference: string;
}

export interface FiqhResponse {
    summary: string;
    madhahibPositions: MadhabPosition[];
    relevantHadiths: FiqhHadith[];
    relevantQuranVerses: FiqhQuranVerse[];
}


// --- Risale Search Types ---

export interface RisaleSourceInfo {
    book: string;
    section: string;
    pageNumber?: string;
}

export interface RisaleExcerpt {
    originalText: string;
    source: RisaleSourceInfo;
}

export interface RisalePoint {
    pointTitle: string; // e.g., "Birinci Düstur"
    originalText: string;
    source: RisaleSourceInfo;
}

export interface RisaleResponse {
    overallSummary: string;
    excerpts: RisaleExcerpt[];
    relatedPointsTitle: string; // e.g., "İhlas Risalesi'nin Dört Düsturu"
    relatedPoints: RisalePoint[];
}

// --- Dua & Zikir Search Types ---

export interface DuaSourceInfo {
    sourceText: string; // e.g., "Sahih-i Buhari, Vudu, 10" or "Risale-i Nur, Lem'alar"
    sourceContent: string; // The actual text of the hadith, ayah, or excerpt
}

export interface DuaResponse {
    arabicText: string;
    transliteration: string;
    turkishMeaning: string;
    usageContext: string;
    sources: DuaSourceInfo[];
}
