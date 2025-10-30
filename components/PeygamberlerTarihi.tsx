import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import * as htmlToImage from 'html-to-image';

// --- TYPES & INTERFACES ---
interface ProphetData {
    name: string;
    min: number;
    max: number;
    step: number;
    default: number;
    chat_character: string;
    lineage_details: LineageDetails;
}
interface LineageDetails {
    paternal_line?: string[];
    father: string;
    mother: string;
    children: { name: string; relationship: string; children?: LineageDetails['children'] }[];
}
interface ProphetsData {
    [key: string]: ProphetData;
}
interface KuranKaynak {
    referans: string;
    arapca: string;
    meal: string;
}
interface HadisKaynak {
    kaynak: string;
    rivayetEden: string;
    arapca: string;
    turkce: string;
}
interface SiyerKaynak {
    kaynak: string;
    alinti: string;
}
interface GeneratedContent {
    title: string;
    description: string;
    kuranKaynaklari?: KuranKaynak[];
    hadisKaynaklari?: HadisKaynak[];
    siyerKaynaklari?: SiyerKaynak[];
}


// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const PresentationIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125m-17.25 0h17.25m-17.25 0V5.625m17.25 13.875V5.625m0 13.875L13.5 13.5m0 0L9.75 17.25m3.75-3.75L6 19.5m12-13.5" /></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.375 0-9.375 0" /></svg>);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>);


// --- CONSTANTS ---
const prophetsData: ProphetsData = {
    hzAdem: { name: "Hz. Adem (a.s.)", min: -8000, max: -6000, step: 50, default: -7000, chat_character: "İnsanlığın İlk Babası", lineage_details: { paternal_line: ["Hz. Adem (a.s.)"], father: "Yok (İlk İnsan)", mother: "Havva (İlk İnsan)", children: [ { name: "Kâbil", relationship: "Oğlu" }, { name: "Hâbil", relationship: "Oğlu" }, { name: "Hz. Şit (a.s.)", relationship: "Oğlu", children: [] } ] } },
    hzIdris: { name: "Hz. İdris (a.s.)", min: -7000, max: -5000, step: 50, default: -6000, chat_character: "Bilgin ve Hikmet Sahibi", lineage_details: { paternal_line: ["Hz. Adem (a.s.)", "Hz. Şit", "Anuş", "Kaynan", "Mehlail", "Yerd", "Hz. İdris (a.s.)"], father: "Yerd", mother: "Barkanah", children: [ { name: "Metuşelah", relationship: "Oğlu", children: [] } ] } },
    hzNuh: { name: "Hz. Nuh (a.s.)", min: -5000, max: -3000, step: 20, default: -4000, chat_character: "Geminin Rehberi", lineage_details: { paternal_line: ["Hz. Adem (a.s.)", "...", "Hz. İdris", "Metuşelah", "Lamek", "Hz. Nuh (a.s.)"], father: "Lamek", mother: "Kaynuş", children: [ { name: "Sam", relationship: "Oğlu", children: [] }, { name: "Ham", relationship: "Oğlu", children: [] }, { name: "Yafes", relationship: "Oğlu", children: [] }, { name: "Kenan", relationship: "Oğlu (iman etmeyen)", children: [] } ] } },
    hzHud: { name: "Hz. Hud (a.s.)", min: -3000, max: -2500, step: 10, default: -2800, chat_character: "Ad Kavminin Uyarıcısı", lineage_details: { paternal_line: ["Hz. Nuh (a.s.)", "Sam", "İrem", "Avs", "Âd", "Hulûd", "Rebah", "Abdullah", "Hz. Hud (a.s.)"], father: "Abdullah", mother: "Bilinmiyor", children: [] } },
    hzSalih: { name: "Hz. Salih (a.s.)", min: -2500, max: -2000, step: 10, default: -2200, chat_character: "Semud Kavminin Öğretmeni", lineage_details: { paternal_line: ["Hz. Nuh (a.s.)", "Sam", "Gesir", "Semud", "Amir", "Hasir", "Sadir", "Masi", "Ubeyd", "Hz. Salih (a.s.)"], father: "Ubeyd", mother: "Bilinmiyor", children: [] } },
    hzIbrahim: { name: "Hz. İbrahim (a.s.)", min: -2000, max: -1800, step: 5, default: -1900, chat_character: "Allah'ın Dostu", lineage_details: { paternal_line: ["Hz. Nuh (a.s.)", "Sam", "Erfahşed", "Şaleh", "Âbir", "Fâliğ", "Er'û", "Sârûğ", "Nâhur", "Târuh (Âzer)", "Hz. İbrahim (a.s.)"], father: "Târuh (Âzer)", mother: "Amile", children: [ { name: "Hz. İsmail (a.s.)", relationship: "Oğlu" },  { name: "Hz. İshak (a.s.)", relationship: "Oğlu" }, { name: "Medyen", relationship: "Oğlu" } ] } },
    hzLut: { name: "Hz. Lut (a.s.)", min: -2000, max: -1800, step: 5, default: -1850, chat_character: "Sadum Şehrinin Tebliğcisi", lineage_details: { paternal_line: ["Hz. Nuh (a.s.)", "...", "Târuh (Âzer)", "Haran", "Hz. Lut (a.s.)"], father: "Haran (Hz. İbrahim'in kardeşi)", mother: "Bilinmiyor", children: [] } },
    hzIsmail: { name: "Hz. İsmail (a.s.)", min: -1900, max: -1700, step: 5, default: -1800, chat_character: "Kabe'nin İnşacısı", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "Hz. İsmail (a.s.)", "... Adnan", "... Hz. Muhammed (s.a.v)"], father: "Hz. İbrahim (a.s.)", mother: "Hz. Hacer", children: [ { name: "Nâbit", relationship: "Oğlu" }, { name: "Kaydâr", relationship: "Oğlu" } ] } },
    hzIshaq: { name: "Hz. İshak (a.s.)", min: -1900, max: -1700, step: 5, default: -1780, chat_character: "Bereketli Soyun Atası", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "Hz. İshak (a.s.)"], father: "Hz. İbrahim (a.s.)", mother: "Hz. Sare", children: [ { name: "Hz. Yakub (a.s.)", relationship: "Oğlu" }, { name: "Îs (Esav)", relationship: "Oğlu" } ] } },
    hzYaqub: { name: "Hz. Yakub (a.s.)", min: -1800, max: -1600, step: 5, default: -1700, chat_character: "İsrail Oğullarının Babası", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "Hz. İshak (a.s.)", "Hz. Yakub (a.s.)"], father: "Hz. İshak (a.s.)", mother: "Rifka", children: [ { name: "Hz. Yusuf (a.s.)", relationship: "Oğlu" }, { name: "Bünyamin", relationship: "Oğlu" }, { name: "Yahuda", relationship: "Oğlu" }, { name: "Levi", relationship: "Oğlu" }, { name: "Diğer 8 oğlu" , relationship: "Oğlu"} ] } },
    hzYusuf: { name: "Hz. Yusuf (a.s.)", min: -1700, max: -1500, step: 5, default: -1600, chat_character: "Mısır'ın Veziri", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "Hz. İshak (a.s.)", "Hz. Yakub (a.s.)", "Hz. Yusuf (a.s.)"], father: "Hz. Yakub (a.s.)", mother: "Rahel", children: [ { name: "Efrayim", relationship: "Oğlu" }, { name: "Menasse", relationship: "Oğlu" } ] } },
    hzEyyub: { name: "Hz. Eyyub (a.s.)", min: -1600, max: -1400, step: 5, default: -1500, chat_character: "Sabrın Timsali", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "Hz. İshak (a.s.)", "Îs", "Râûm", "Zârih", "Âmus", "Hz. Eyyub (a.s.)"], father: "Âmus", mother: "Hz. Lut'un kızı olduğu rivayet edilir.", children: [] } },
    hzSuayb: { name: "Hz. Şuayb (a.s.)", min: -1500, max: -1300, step: 5, default: -1400, chat_character: "Medyen Halkının Uyarıcısı", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "Medyen", "Yeşcur", "Mikâil", "Hz. Şuayb (a.s.)"], father: "Mikâil", mother: "Hz. Lut'un kızı Mikâil", children: [] } },
    hzMusa: { name: "Hz. Musa (a.s.)", min: -1400, max: -1200, step: 5, default: -1300, chat_character: "Firavun'a Meydan Okuyan", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "Hz. İshak (a.s.)", "Hz. Yakub (a.s.)", "Levi", "Kâhis", "İmrân", "Hz. Musa (a.s.)"], father: "İmran", mother: "Yukâbid", children: [ { name: "Hz. Harun (a.s.)", relationship: "Kardeşi" } ] } },
    hzHarun: { name: "Hz. Harun (a.s.)", min: -1400, max: -1200, step: 5, default: -1300, chat_character: "Hz. Musa'nın Yardımcısı", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "...", "Kâhis", "İmrân", "Hz. Harun (a.s.)"], father: "İmran", mother: "Yukâbid", children: [] } },
    hzDavud: { name: "Hz. Davud (a.s.)", min: -1050, max: -950, step: 1, default: -1000, chat_character: "Zebur Sahibi Hükümdar", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "...", "Hz. Yakub (a.s.)", "Yahuda", "...", "Îşâ", "Hz. Davud (a.s.)"], father: "Îşâ", mother: "Bilinmiyor", children: [ { name: "Hz. Süleyman (a.s.)", relationship: "Oğlu" } ] } },
    hzSuleyman: { name: "Hz. Süleyman (a.s.)", min: -980, max: -900, step: 1, default: -940, chat_character: "Hikmet Sahibi Kral", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "...", "Îşâ", "Hz. Davud (a.s.)", "Hz. Süleyman (a.s.)"], father: "Hz. Davud (a.s.)", mother: "Bilinmiyor", children: [] } },
    hzIlyas: { name: "Hz. İlyas (a.s.)", min: -900, max: -800, step: 1, default: -850, chat_character: "Baal'a Karşı Mücadele Eden", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "...", "İmran", "Hz. Harun (a.s.)", "...", "Yasin", "Hz. İlyas (a.s.)"], father: "Yasin", mother: "Bilinmiyor", children: [] } },
    hzElyesa: { name: "Hz. Elyesa (a.s.)", min: -850, max: -750, step: 1, default: -800, chat_character: "Hz. İlyas'ın Öğrencisi", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "...", "Hz. Yusuf (a.s.)", "Efrayim", "...", "Ahtub", "Hz. Elyesa (a.s.)"], father: "Ahtub", mother: "Bilinmiyor", children: [] } },
    hzYunus: { name: "Hz. Yunus (a.s.)", min: -800, max: -700, step: 1, default: -750, chat_character: "Balık Karnındaki Öğretmen", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "...", "Hz. Yakub (a.s.)", "Bünyamin", "...", "Metta", "Hz. Yunus (a.s.)"], father: "Metta", mother: "Bilinmiyor", children: [] } },
    hzZulkifl: { name: "Hz. Zülkifl (a.s.)", min: -750, max: -650, step: 1, default: -700, chat_character: "Sabırlı ve Adaletli", lineage_details: { paternal_line: ["Hz. Eyyub (a.s.)'un oğlu olduğu rivayet edilir."], father: "Hz. Eyyub (a.s.) (rivayet)", mother: "Bilinmiyor", children: [] } },
    hzZekeriya: { name: "Hz. Zekeriya (a.s.)", min: -100, max: 1, step: 1, default: -50, chat_character: "Hz. Yahya'nın Babası", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "...", "Hz. Süleyman (a.s.)", "...", "Berekya", "Hz. Zekeriya (a.s.)"], father: "Berekya", mother: "Bilinmiyor", children: [ { name: "Hz. Yahya (a.s.)", relationship: "Oğlu" } ] } },
    hzYahya: { name: "Hz. Yahya (a.s.)", min: -10, max: 30, step: 1, default: 10, chat_character: "Hz. İsa'nın Müjdecisi", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "...", "Berekya", "Hz. Zekeriya (a.s.)", "Hz. Yahya (a.s.)"], father: "Hz. Zekeriya (a.s.)", mother: "İşa", children: [] } },
    hzIsa: { name: "Hz. İsa (a.s.)", min: 1, max: 33, step: 1, default: 20, chat_character: "İncil'in Peygamberi", lineage_details: { paternal_line: ["Baba tarafından soyu yoktur."], father: "Yok (Babası Olmadan Doğdu)", mother: "Hz. Meryem", children: [] } },
    hzMuhammed: { name: "Hz. Muhammed (s.a.v.)", min: 570, max: 632, step: 1, default: 600, chat_character: "Son Peygamber", lineage_details: { paternal_line: ["Hz. İbrahim (a.s.)", "Hz. İsmail (a.s.)", "...", "Adnan", "...", "Kureyş", "...", "Haşim", "Abdulmuttalib", "Abdullah", "Hz. Muhammed (s.a.v.)"], father: "Abdullah", mother: "Amine", children: [ { name: "Fâtıma", relationship: "Kızı" }, { name: "Zeyneb", relationship: "Kızı" }, { name: "Rukiyye", relationship: "Kızı" }, { name: "Ümmü Gülsüm", relationship: "Kızı" }, { name: "Kâsım", relationship: "Oğlu" }, { name: "Abdullah", relationship: "Oğlu" }, { name: "İbrahim", relationship: "Oğlu" } ] } },
};
const formatYear = (year: number) => {
    const absYear = Math.abs(year);
    if (year < 0) return `M.Ö. ${absYear}`;
    return year.toString();
};

const PresentationCard: React.FC<{ content: GeneratedContent }> = ({ content }) => {
    return (
        <div className="p-16 font-roboto bg-gradient-to-br from-[#1c2e4a] via-[#2d0f3b] to-[#1c2e4a] text-gray-200 w-full shadow-2xl rounded-2xl border-2 border-purple-800">
            <h1 className="text-5xl font-bold text-center mb-10 text-amber-300 font-orbitron">{content.title}</h1>
            
            <p className="text-lg text-gray-300 leading-relaxed mb-10 text-center">{content.description}</p>
            
            {content.kuranKaynaklari && content.kuranKaynaklari.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-green-300 mb-4 border-b border-green-400/30 pb-2 font-orbitron">Kur'an'dan Kaynaklar</h2>
                    <div className="space-y-6">
                        {content.kuranKaynaklari.map((source, i) => (
                             <div key={`kuran-${i}`} className="border-l-4 border-green-400 pl-6">
                                {source.arapca && <blockquote dir="rtl" className="italic text-gray-200 text-2xl font-arabic mb-3">"{source.arapca}"</blockquote>}
                                <blockquote className="italic text-gray-300 text-lg">"{source.meal}"</blockquote>
                                <p className="text-right text-sm text-gray-400 mt-2">{source.referans}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {content.hadisKaynaklari && content.hadisKaynaklari.length > 0 && (
                 <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-sky-300 mb-4 border-b border-sky-400/30 pb-2 font-orbitron">Hadislerden Kaynaklar</h2>
                     <div className="space-y-6">
                        {content.hadisKaynaklari.map((source, i) => (
                             <div key={`hadis-${i}`} className="border-l-4 border-sky-400 pl-6">
                                {source.arapca && <blockquote dir="rtl" className="italic text-gray-200 text-2xl font-arabic mb-3">"{source.arapca}"</blockquote>}
                                {source.rivayetEden && <p className="font-semibold text-md text-gray-400 mb-2">{source.rivayetEden} rivayet ediyor:</p>}
                                <blockquote className="italic text-gray-300 text-lg">"{source.turkce}"</blockquote>
                                <p className="text-right text-sm text-gray-400 mt-2">{source.kaynak}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {content.siyerKaynaklari && content.siyerKaynaklari.length > 0 && (
                 <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-purple-300 mb-4 border-b border-purple-400/30 pb-2 font-orbitron">Siyer Kaynaklarından Alıntılar</h2>
                     <div className="space-y-6">
                        {content.siyerKaynaklari.map((source, i) => (
                             <div key={`siyer-${i}`} className="border-l-4 border-purple-400 pl-6">
                                <blockquote className="italic text-gray-300 text-lg">"{source.alinti}"</blockquote>
                                <p className="text-right text-sm text-gray-400 mt-2">{source.kaynak}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <footer className="text-center mt-12 text-sm text-gray-500 font-orbitron">
                Dijital Medrese - Peygamberler Tarihi
            </footer>
        </div>
    );
};

// --- MAIN COMPONENT ---
const PeygamberlerTarihi: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    // State
    const [currentProphetKey, setCurrentProphetKey] = useState<string>('hzMuhammed');
    const [currentYear, setCurrentYear] = useState<number>(prophetsData['hzMuhammed'].default);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    
    // Sub-window/Modal States
    const [activeSubWindow, setActiveSubWindow] = useState<'genealogy' | null>(null);
    
    // Feature-specific States
    const [isDownloading, setIsDownloading] = useState(false);
    const [presentationData, setPresentationData] = useState<GeneratedContent | null>(null);
    
    // Refs
   const ai = useRef(new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string }));
    const presentationRef = useRef<HTMLDivElement>(null);

    // Effects
    useEffect(() => {
        let lastProphetKey = 'hzMuhammed';
        try {
            const savedProphet = localStorage.getItem('peygamberlerLastProphet');
            if (savedProphet) {
                lastProphetKey = JSON.parse(savedProphet).key;
            }
        } catch (e) {
            console.error("Failed to load last prophet", e);
        }
        handleSetProphet(lastProphetKey);
    }, []);
    
    useEffect(() => {
        if (presentationData && presentationRef.current) {
            handleDownloadAsPresentation();
        }
    }, [presentationData]);


    const callGemini = useCallback(async (prompt: string, schema?: object): Promise<string> => {
        try {
            const config: { responseMimeType?: string, responseSchema?: object } = {};
            if (schema) {
                config.responseMimeType = "application/json";
                config.responseSchema = schema;
            }
            const response = await ai.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config,
            });
            return response.text;
        } catch (error) {
            console.error("Gemini API Error:", error);
            throw new Error("Yapay zeka ile iletişim kurulamadı. Lütfen tekrar deneyin.");
        }
    }, []);

    const handleSetProphet = (prophetKey: string) => {
        const prophet = prophetsData[prophetKey];
        if (!prophet) return;
        setCurrentProphetKey(prophetKey);
        setCurrentYear(prophet.default);
        setGeneratedContent({ title: prophet.name, description: 'Bilgi üretmek için "Bilgi Üret" düğmesine tıklayın.' });
        setError(null);
        try {
            localStorage.setItem('peygamberlerLastProphet', JSON.stringify({ key: prophetKey, name: prophet.name }));
        } catch (e) {
            console.error("Failed to save last prophet", e);
        }
    };

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedContent(null);

        const prophet = prophetsData[currentProphetKey];
        const range = prophet.max - prophet.min;
        const earlyLifeThreshold = prophet.min + range * 0.1;
        const endOfLifeThreshold = prophet.max - range * 0.1;

        let specificPromptPart = '';

        if (currentYear <= earlyLifeThreshold) {
            specificPromptPart = `doğumu, ailesi, çocukluğu ve peygamberlik öncesi hayatındaki önemli olayları anlat.`;
        } else if (currentYear >= endOfLifeThreshold) {
            specificPromptPart = `vefatı, vefatının sebebi, son günleri, son vasiyetleri ve mirası hakkında detaylı bilgi ver.`;
        } else {
            specificPromptPart = `hayatında ${formatYear(currentYear)} yılı civarında gerçekleşen önemli bir peygamberlik görevi, mucizesi, mücadelesi veya önemli bir olayı anlat. Eğer o yıl tam bir olay yoksa, o döneme en yakın ve en önemli olayı seçerek anlat.`;
        }

        const prompt = `Sen bir İslam Tarihi ve Siyer uzmanısın. ${prophet.name}'in ${specificPromptPart} Cevabın SADECE JSON formatında ve şu yapıya uygun olmalı: Bir 'title' (başlık), bir 'description' (detaylı açıklama) ve üç ayrı kaynak dizisi içermeli: 'kuranKaynaklari', 'hadisKaynaklari' ve 'siyerKaynaklari'. Her bir kaynak için ilgili metinleri, çevirilerini ve tam referanslarını (Sure:Ayet, Kitap:Bölüm:No, Eser:Cilt:Sayfa gibi) belirt.`;
        const schema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                kuranKaynaklari: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            referans: { type: Type.STRING },
                            arapca: { type: Type.STRING },
                            meal: { type: Type.STRING },
                        },
                    },
                },
                hadisKaynaklari: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            kaynak: { type: Type.STRING },
                            rivayetEden: { type: Type.STRING },
                            arapca: { type: Type.STRING },
                            turkce: { type: Type.STRING },
                        },
                    },
                },
                siyerKaynaklari: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            kaynak: { type: Type.STRING },
                            alinti: { type: Type.STRING },
                        },
                    },
                },
            },
            required: ['title', 'description']
        };

        try {
            const result = await callGemini(prompt, schema);
            const parsedResult: GeneratedContent = JSON.parse(result);
            setGeneratedContent(parsedResult);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentProphetKey, currentYear, callGemini]);
    
    const handleDownloadAsPresentation = async () => {
        if (!presentationRef.current) return;
        setIsDownloading(true);
        setError(null);
        try {
            const dataUrl = await htmlToImage.toPng(presentationRef.current, {
                quality: 0.98,
                pixelRatio: 2,
            });
            const link = document.createElement('a');
            link.download = `peygamberler-tarihi-sunum-${currentProphetKey}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            setError("Sunum kartı indirilirken bir hata oluştu.");
        } finally {
            setIsDownloading(false);
            setPresentationData(null);
        }
    };

    const handleCopyContent = () => {
        if (!generatedContent) return;
        let textToCopy = `${generatedContent.title}\n\n${generatedContent.description}\n\n`;

        if (generatedContent.kuranKaynaklari?.length) {
            textToCopy += "--- KUR'AN'DAN KAYNAKLAR ---\n";
            generatedContent.kuranKaynaklari.forEach(s => {
                textToCopy += `"${s.meal}" (${s.referans})\n`;
            });
            textToCopy += "\n";
        }
        if (generatedContent.hadisKaynaklari?.length) {
            textToCopy += "--- HADİSLERDEN KAYNAKLAR ---\n";
            generatedContent.hadisKaynaklari.forEach(s => {
                textToCopy += `${s.rivayetEden} rivayet ediyor: "${s.turkce}" (${s.kaynak})\n`;
            });
            textToCopy += "\n";
        }
        if (generatedContent.siyerKaynaklari?.length) {
            textToCopy += "--- SİYER KAYNAKLARINDAN ALINTILAR ---\n";
            generatedContent.siyerKaynaklari.forEach(s => {
                textToCopy += `"${s.alinti}" (${s.kaynak})\n`;
            });
        }

        navigator.clipboard.writeText(textToCopy.trim()).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        }).catch(err => {
            setError("İçerik kopyalanamadı.");
            console.error('Failed to copy content: ', err);
        });
    };

    const renderGenealogyNode = (node: { name: string; relationship: string; children?: LineageDetails['children'] }) => (
        <li key={node.name} className="genealogy-list-item">
            <div className="genealogy-item-content">
                <strong>{node.name}</strong> ({node.relationship})
            </div>
            {node.children && node.children.length > 0 && (
                <ul>
                    {node.children.map(child => renderGenealogyNode(child))}
                </ul>
            )}
        </li>
    );

    const closeModal = () => {
        setActiveSubWindow(null);
    }

    return (
        <div className="font-roboto bg-gray-900 text-white min-h-screen p-4 flex flex-col items-center">
             {presentationData && (
                <div className="fixed -left-[9999px] top-0 w-[1080px] p-8">
                    <div ref={presentationRef}>
                        <PresentationCard content={presentationData} />
                    </div>
                </div>
            )}
             <div className="w-full max-w-4xl mx-auto flex flex-col items-center space-y-6">
                 <button onClick={onGoHome} className="fixed top-4 left-4 emboss-button bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 z-20"><HomeIcon/> Anasayfa</button>
                <h1 className="font-orbitron text-4xl md:text-5xl font-bold text-center tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mt-16 md:mt-0">
                    Peygamberler Tarihi
                </h1>
                
                 <div className="w-full bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-gray-700">
                    <h2 className="text-center text-lg text-blue-300 font-semibold mb-3 font-orbitron">Bir Peygamber Seçin</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                        {Object.entries(prophetsData).map(([key, { name }]) => (
                            <button key={key} onClick={() => handleSetProphet(key)} className={`prophet-button bg-gray-700 hover:bg-gray-600 rounded-lg py-2 px-3 ${currentProphetKey === key ? 'active' : ''}`}>
                                {name.replace(/\(a\.s\.\)|\(s\.a\.v\.\)/, '')}
                            </button>
                        ))}
                    </div>
                </div>

                 <div className="w-full bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700">
                    <h2 className="text-center text-lg text-blue-300 font-semibold mb-3 font-orbitron">Dönem Seçin</h2>
                    <div className="font-orbitron text-4xl md:text-5xl font-bold text-center text-blue-400 my-4">{formatYear(currentYear)}</div>
                    <input 
                        type="range" 
                        min={prophetsData[currentProphetKey].min}
                        max={prophetsData[currentProphetKey].max}
                        step={prophetsData[currentProphetKey].step}
                        value={currentYear}
                        onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                        className="w-full pt-range bg-gray-600 rounded-lg appearance-none cursor-pointer h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
                        <span>{formatYear(prophetsData[currentProphetKey].min)}</span>
                        <span>{formatYear(prophetsData[currentProphetKey].max)}</span>
                    </div>
                </div>

                <button onClick={handleGenerate} disabled={isLoading} className="emboss-button bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50">
                    {isLoading ? "Üretiliyor..." : "Bilgi Üret"}
                </button>
                
                {(isLoading || error || generatedContent) && (
                    <div className="w-full emboss-card p-6">
                        {isLoading && <div className="w-full flex justify-center items-center py-16"><div className="pt-loader"></div></div>}
                        {error && <p className="text-center text-red-400 font-semibold">{error}</p>}
                        {generatedContent && !isLoading && (
                            <div>
                                <h2 className="text-3xl font-bold text-blue-300 mb-3 font-orbitron">{generatedContent.title}</h2>
                                <p className="text-gray-300 text-lg leading-relaxed">{generatedContent.description}</p>
                                
                                {generatedContent.kuranKaynaklari && generatedContent.kuranKaynaklari.length > 0 && (
                                    <div className="mt-6 border-t border-gray-700 pt-4">
                                        <h4 className="text-lg font-semibold text-green-300 mb-2">Kur'an'dan Kaynaklar</h4>
                                        <div className="space-y-4">
                                            {generatedContent.kuranKaynaklari.map((source, index) => (
                                                <div key={index} className="p-3 bg-gray-800/60 rounded-lg border-l-4 border-green-500">
                                                    {source.arapca && <p dir="rtl" className="font-arabic text-xl mb-2">{source.arapca}</p>}
                                                    <p className="italic text-gray-300">"{source.meal}"</p>
                                                    <p className="text-right text-xs text-gray-400 mt-2 font-mono">{source.referans}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {generatedContent.hadisKaynaklari && generatedContent.hadisKaynaklari.length > 0 && (
                                    <div className="mt-6 border-t border-gray-700 pt-4">
                                        <h4 className="text-lg font-semibold text-sky-300 mb-2">Hadislerden Kaynaklar</h4>
                                        <div className="space-y-4">
                                            {generatedContent.hadisKaynaklari.map((source, index) => (
                                                <div key={index} className="p-3 bg-gray-800/60 rounded-lg border-l-4 border-sky-500">
                                                    {source.arapca && <p dir="rtl" className="font-arabic text-xl mb-2">{source.arapca}</p>}
                                                    {source.rivayetEden && <p className="font-semibold text-sm text-gray-400 mb-2">{source.rivayetEden} rivayet ediyor:</p>}
                                                    <p className="italic text-gray-300">"{source.turkce}"</p>
                                                    <p className="text-right text-xs text-gray-400 mt-2 font-mono">{source.kaynak}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {generatedContent.siyerKaynaklari && generatedContent.siyerKaynaklari.length > 0 && (
                                    <div className="mt-6 border-t border-gray-700 pt-4">
                                        <h4 className="text-lg font-semibold text-purple-300 mb-2">Siyer Kaynaklarından Alıntılar</h4>
                                        <div className="space-y-4">
                                            {generatedContent.siyerKaynaklari.map((source, index) => (
                                                <div key={index} className="p-3 bg-gray-800/60 rounded-lg border-l-4 border-purple-500">
                                                    <p className="italic text-gray-300">"{source.alinti}"</p>
                                                    <p className="text-right text-xs text-gray-400 mt-2 font-mono">{source.kaynak}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                <div className="mt-6 border-t border-gray-700 pt-4 flex flex-wrap gap-4">
                                    <button onClick={handleCopyContent} className="emboss-button flex-auto bg-gradient-to-br from-gray-500 to-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2">
                                        {isCopied ? <CheckIcon className="w-5 h-5"/> : <CopyIcon className="w-5 h-5"/>} {isCopied ? 'Kopyalandı!' : 'Tümünü Kopyala'}
                                    </button>
                                    <button onClick={() => setPresentationData(generatedContent)} disabled={isDownloading} className="emboss-button flex-auto bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2">
                                        {isDownloading ? <div className="pt-mini-loader"></div> : <PresentationIcon className="w-5 h-5"/>} Sunum Olarak İndir
                                    </button>
                                    <button onClick={() => setActiveSubWindow('genealogy')} className="emboss-button flex-auto bg-gradient-to-br from-green-500 to-blue-600 text-white font-bold py-2 px-3 rounded-lg shadow-md">🌳 Peygamberler Şeceresi</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {activeSubWindow === 'genealogy' && (
                 <div className="fixed top-0 left-0 w-full h-full bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-30" onClick={closeModal}>
                    <div className="w-full max-w-3xl emboss-card flex flex-col p-6 relative h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button className="absolute top-4 right-4 text-sm bg-gray-600 hover:bg-gray-500 py-1 px-3 rounded-lg z-10" onClick={closeModal}><CloseIcon className="w-4 h-4"/></button>
                        <h3 className="text-2xl text-blue-300 font-bold mb-4 font-orbitron">Peygamberler Şeceresi: {prophetsData[currentProphetKey].name}</h3>
                        <div className="flex-1 overflow-y-auto text-gray-300 leading-relaxed space-y-6">
                            {prophetsData[currentProphetKey].lineage_details.paternal_line && (
                            <div>
                                <h4 className="text-xl text-purple-400 font-semibold mb-2">Soy Hattı (Baba Tarafı)</h4>
                                <p className="text-lg italic text-blue-200 bg-gray-800 p-3 rounded-md">
                                    {prophetsData[currentProphetKey].lineage_details.paternal_line?.join(' » ')}
                                </p>
                            </div>
                            )}
                            <div>
                                <h4 className="text-xl text-purple-400 font-semibold mb-2">Yakın Ailesi</h4>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                    <li><strong>Babası:</strong> {prophetsData[currentProphetKey].lineage_details.father}</li>
                                    <li><strong>Annesi:</strong> {prophetsData[currentProphetKey].lineage_details.mother}</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xl text-purple-400 font-semibold mb-2">Çocukları</h4>
                                <ul className="text-lg italic text-blue-200">
                                    {prophetsData[currentProphetKey].lineage_details.children.length > 0 
                                        ? renderGenealogyNode({ name: "", relationship: "", children: prophetsData[currentProphetKey].lineage_details.children }) 
                                        : <li className="genealogy-list-item">Bilinen çocuğu kaynaklarda belirtilmemiştir.</li>
                                    }
                                </ul>
                            </div>
                            <p className="text-red-400 text-xs mt-4 italic">**ÖNEMLİ UYARI:** Bu soy bilgileri, yaygın İslami anlatılara dayanmaktadır ve basitleştirilmiştir. Tüm detayları ve farklı rivayetleri içermeyebilir.</p>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default PeygamberlerTarihi;
