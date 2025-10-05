
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import * as htmlToImage from 'html-to-image';
import * as pako from 'pako';
import type { RisaleResponse, RisaleSourceInfo, RisaleExcerpt, RisalePoint } from '../types';
import Spinner from './Spinner';
import { HighlightableText } from './Lugat';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" /><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" clipRule="evenodd" /></svg>);
const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.375 0-9.375 0" /></svg>);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>);
const PresentationIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125V5.625c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125m-17.25 0h17.25m-17.25 0V5.625m17.25 13.875V5.625m0 13.875L13.5 13.5m0 0L9.75 17.25m3.75-3.75L6 19.5m12-13.5" /></svg>);
const MiniSpinner: React.FC = () => (<div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>);
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>);
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" /></svg>);

type Message = {
    role: 'user';
    content: string;
} | {
    role: 'model';
    content: RisaleResponse;
};

type HistoryItem = {
    id: string;
    question: string;
    customTitle?: string;
    response: RisaleResponse;
};

const RisaleSourceDetailModal: React.FC<{ sourceInfo: RisaleSourceInfo; onClose: () => void }> = ({ sourceInfo, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Kaynak Detayları</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <CloseIcon />
                    </button>
                </div>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex justify-between border-b pb-2 dark:border-gray-700">
                        <span className="font-semibold">Eser:</span>
                        <span className="text-right">{sourceInfo.book}</span>
                    </li>
                     <li className="flex justify-between border-b pb-2 dark:border-gray-700">
                        <span className="font-semibold">Bölüm:</span>
                        <span className="text-right">{sourceInfo.section}</span>
                    </li>
                    {sourceInfo.pageNumber && (
                        <li className="flex justify-between">
                            <span className="font-semibold">Sayfa No:</span>
                            <span>{sourceInfo.pageNumber}</span>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

const TaggedTextRenderer: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(<ayah>.*?<\/ayah>|<hadis>.*?<\/hadis>)/g).filter(Boolean);

    return (
        <p className="text-gray-700 dark:text-gray-300 leading-loose">
            {parts.map((part, index) => {
                if (part.startsWith('<ayah>')) {
                    return (
                        <span key={index} className="block my-3 p-4 bg-green-50 dark:bg-gray-700/50 border-r-4 border-green-600 dark:border-green-400 rounded-r-lg shadow-inner font-amiri text-xl text-green-900 dark:text-green-200">
                            {part.replace(/<\/?ayah>/g, '')}
                        </span>
                    );
                }
                if (part.startsWith('<hadis>')) {
                    return (
                        <span key={index} className="block my-3 p-4 bg-sky-50 dark:bg-gray-700/50 border-r-4 border-sky-600 dark:border-sky-400 rounded-r-lg shadow-inner font-amiri text-xl text-sky-900 dark:text-sky-200">
                            {part.replace(/<\/?hadis>/g, '')}
                        </span>
                    );
                }
                return <HighlightableText key={index}>{part}</HighlightableText>;
            })}
        </p>
    );
};

const PresentationCard: React.FC<{ question: string; response: RisaleResponse }> = ({ question, response }) => {
    return (
        <div className="p-16 font-sans bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#0a192f] text-gray-200">
            <div className="text-center mb-12">
                <p className="text-xl text-gray-400">Soru:</p>
                <h1 className="text-5xl font-bold mt-2 text-white">"{question}"</h1>
            </div>

            <div className="mb-10">
                <h2 className="text-2xl font-semibold text-amber-300 mb-3 border-b border-amber-400/30 pb-2">
                    Genel Özet
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed">{response.overallSummary}</p>
            </div>

            {response.relatedPoints && response.relatedPoints.length > 0 && (
                 <div className="mb-10">
                    <h2 className="text-2xl font-semibold text-amber-300 mb-4 border-b border-amber-400/30 pb-2">
                        {response.relatedPointsTitle}
                    </h2>
                     <div className="space-y-8">
                        {response.relatedPoints.map((point, i) => (
                             <div key={i} className="flex items-start">
                                <span className="text-2xl font-bold text-amber-300 mr-5 mt-1">{i + 1}.</span>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-sky-300 mb-2">
                                        {point.pointTitle}
                                    </h3>
                                    <div className="border-l-4 border-sky-400 pl-6">
                                        <blockquote className="italic">
                                             <div className="dark"> 
                                                <TaggedTextRenderer text={point.originalText} />
                                             </div>
                                        </blockquote>
                                         <p className="text-right text-sm text-gray-400 mt-2">Kaynak: {point.source.book} - {point.source.section}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {response.excerpts?.length > 0 && (
                <div>
                    <h2 className="text-2xl font-semibold text-amber-300 mb-4 border-b border-amber-400/30 pb-2">
                        İlgili Bölümlerden Alıntılar
                    </h2>
                    {response.excerpts.map((excerpt, i) => (
                        <div key={i} className="mb-8">
                            <h3 className="text-xl font-semibold text-sky-300 mb-4">
                                {excerpt.source.book} - {excerpt.source.section}
                            </h3>
                            <div className="border-l-4 border-sky-400 pl-6">
                                <blockquote className="italic">
                                     <div className="dark"> 
                                        <TaggedTextRenderer text={excerpt.originalText} />
                                     </div>
                                </blockquote>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <footer className="text-center mt-16 text-sm text-gray-500">
                Dijital Medrese
            </footer>
        </div>
    );
};


const RisaleSearch: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sourceModalData, setSourceModalData] = useState<RisaleSourceInfo | null>(null);
    const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
    const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
    const [presentationData, setPresentationData] = useState<{ question: string; response: RisaleResponse; index: number } | null>(null);

    // History State
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
    const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [sharingId, setSharingId] = useState<string | null>(null);


    const chatContainerRef = useRef<HTMLDivElement>(null);
    const responseCardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const presentationRef = useRef<HTMLDivElement>(null);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
    const model = 'gemini-2.5-flash';

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleHistoryItemClick = useCallback((item: HistoryItem) => {
        setActiveHistoryId(item.id);
        setMessages([
            { role: 'user', content: item.question },
            { role: 'model', content: item.response }
        ]);
        setIsHistoryOpen(false);
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // History & URL Import Load/Save Effects
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('risaleSearchHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }

            const importedDataString = sessionStorage.getItem('importedDataFor_risale');
            if (importedDataString) {
                sessionStorage.removeItem('importedDataFor_risale');
                const importedItem: HistoryItem = JSON.parse(importedDataString);
                setHistory(prev => {
                    if (prev.some(item => item.id === importedItem.id)) return prev;
                    return [importedItem, ...prev];
                });
                handleHistoryItemClick(importedItem);
            }
        } catch (e) {
            console.error("Failed to load or import history", e);
            showNotification('Geçmiş verisi işlenemedi.', 'error');
        }
    }, [handleHistoryItemClick]);

    useEffect(() => {
        try {
            localStorage.setItem('risaleSearchHistory', JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save history", e);
        }
    }, [history]);


     useEffect(() => {
        if (presentationData && presentationRef.current) {
            const node = presentationRef.current;
            
            htmlToImage.toPng(node, { pixelRatio: 2 })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = 'risale-sunum-karti.png';
                link.href = dataUrl;
                link.click();
            })
            .catch((error) => {
                console.error('Failed to generate presentation image', error);
                setError('Sunum kartı oluşturulurken bir hata oluştu.');
            })
            .finally(() => {
                setPresentationData(null);
                setGeneratingIndex(null);
            });
        }
    }, [presentationData]);
    
    const handleCopy = (response: RisaleResponse, index: number) => {
        const userMessage = messages[index - 1];
        const question = (userMessage && userMessage.role === 'user') ? userMessage.content : '';
        let textToCopy = `Soru: ${question}\n\n`;
        textToCopy += `Genel Özet:\n${response.overallSummary}\n\n`;

        if (response.relatedPoints && response.relatedPoints.length > 0) {
            textToCopy += `${response.relatedPointsTitle}:\n\n`;
            response.relatedPoints.forEach((point, i) => {
                 const sourceParts = [point.source.book, point.source.section, point.source.pageNumber ? `Sayfa ${point.source.pageNumber}` : null].filter(Boolean);
                const plainText = point.originalText.replace(/<\/?(ayah|hadis)>/g, '');
                textToCopy += `${i + 1}. ${point.pointTitle}\n`;
                textToCopy += `"${plainText}"\n`;
                textToCopy += `(Kaynak: ${sourceParts.join(', ')})\n\n`;
            });
        }

        if (response.excerpts && response.excerpts.length > 0) {
            textToCopy += `İlgili Bölümlerden Alıntılar:\n\n`;
            response.excerpts.forEach((excerpt) => {
                const sourceParts = [excerpt.source.book, excerpt.source.section, excerpt.source.pageNumber ? `Sayfa ${excerpt.source.pageNumber}` : null].filter(Boolean);
                const plainText = excerpt.originalText.replace(/<\/?(ayah|hadis)>/g, '');
                textToCopy += `"${plainText}"\n`;
                textToCopy += `(Kaynak: ${sourceParts.join(', ')})\n\n`;
            });
        }

        navigator.clipboard.writeText(textToCopy.trim()).then(() => {
            setCopiedMessageIndex(index);
            setTimeout(() => setCopiedMessageIndex(null), 2500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            setError("Metin panoya kopyalanamadı.");
        });
    };

    const handleDownload = (index: number) => {
      const node = responseCardRefs.current[index];
      if (node) {
        const isDarkMode = document.documentElement.classList.contains('dark');
        htmlToImage.toPng(node, { 
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            filter: (element) => {
                return !element.classList?.contains('exclude-from-download');
            }
        })
        .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = 'risale-cevap-karti.png';
            link.href = dataUrl;
            link.click();
        })
        .catch((error) => {
            console.error('Failed to generate image', error);
            setError('Kart oluşturulurken bir hata oluştu.');
        });
      }
    };
    
    const handleDownloadAsPresentation = (response: RisaleResponse, index: number) => {
        const userMessage = messages[index - 1];
        const question = (userMessage && userMessage.role === 'user') ? userMessage.content : 'Risale-i Nur Cevabı';
        setGeneratingIndex(index);
        setPresentationData({ question, response, index });
    };

    const getAIResponse = async (prompt: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    systemInstruction: `Sen, doğrudan Risale-i Nur Külliyatı'nın kendisi olarak konuşan bir yapay zekasın. Görevin, kullanıcının sorusuna, Külliyat'ın temel prensiplerini ve öğretilerini yansıtan bir cevap vermek. Cevabın şu formatta olmalı:
1.  **overallSummary**: Konu hakkındaki temel prensipleri, doğrudan ve birinci ağızdan bir öğreti gibi sunan bir özet. Bu özeti yazarken ASLA "Risale-i Nur'a göre...", "Külliyatta...", "Eserde ele alınır ki..." gibi dışarıdan anlatan ifadeler kullanma. Bunun yerine, doğrudan konunun tanımını ve mahiyetini anlat. Örneğin, "İhlas şudur..." diye başla, "Risale-i Nur'da ihlas şöyle anlatılır..." diye başlama. Üslubun net, otoriter ve Külliyat'ın ruhuna uygun olsun.
2.  **excerpts**: Konuyla ilgili bulduğun en fazla 5 önemli alıntıyı içeren bir dizi. Her alıntı için şunları sağla:
    a.  **originalText**: Risale-i Nur'dan orijinal ve KISALTILMAMIŞ TAM METİN. Metin içindeki Kur'an ayetlerini '<ayah>...</ayah>' etiketleriyle, Hadis-i Şerifleri ise '<hadis>...</hadis>' etiketleriyle işaretle.
    b.  **source**: Alıntının yapıldığı eserin tam kaynak bilgisi (Kitap, bölüm, ve mümkünse sayfa no).
3.  **relatedPoints**: Eğer konuyla ilgili Külliyat'ta geçen açık ve net "esaslar", "nükteler" veya "düsturlar" varsa, bunları sıralı bir şekilde listele. Bu bölüm için iki anahtar döndür:
    a.  **relatedPointsTitle**: Bu bölüm için dinamik ve açıklayıcı bir başlık oluştur. Örneğin, konu İhlas Risalesi ise, başlık "İhlas Risalesi'nin Dört Düsturu" gibi olmalıdır.
    b.  **relatedPoints**: Bir dizi olarak her bir prensibi listele. Her öğe şunları içermelidir:
        i.  **pointTitle**: Prensibin sıralı başlığı. Örneğin, "Birinci Düstur", "İkinci Esas".
        ii. **originalText**: Esasın, nüktenin veya düsturun geçtiği orijinal ve KISALTILMAMIŞ TAM METİN. Ayetleri '<ayah>...</ayah>' ve hadisleri '<hadis>...</hadis>' etiketleriyle işaretle.
        iii. **source**: Bu metnin tam kaynak bilgisi.
    Bir konu, özellikle de İhlas Risalesi gibi, belirli sayıda temel esasa veya düstura dayanıyorsa (örneğin 'Dört Düstur'), bu esasların **tamamını eksiksiz olarak** listelediğinden emin ol. Bu konuda kesinlikle hata yapmamalısın. Bilgilerin doğruluğu ve eksiksizliği en yüksek önceliktir. Eğer yoksa, bu alanı boş bir dizi olarak döndür.
Cevabını mutlaka JSON formatında döndür. Eğer konuyla ilgili bir cevap bulamazsan, 'overallSummary' alanına bunu nazikçe belirt ve diğer alanları boş bir dizi olarak döndür.`,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            overallSummary: { type: Type.STRING, description: "Konuyu genel hatlarıyla özetleyen giriş paragrafı." },
                            excerpts: {
                                type: Type.ARRAY,
                                description: "Konuyla ilgili Risale-i Nur'dan alıntılar.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        originalText: { type: Type.STRING, description: "Orijinal metin. Ayetler <ayah>...</ayah>, hadisler <hadis>...</hadis> ile etiketlenmiş." },
                                        source: {
                                            type: Type.OBJECT,
                                            description: "Alıntının yapıldığı eserin kaynak bilgisi.",
                                            properties: {
                                                book: { type: Type.STRING, description: "Eserin adı (örn: Sözler, Mektubat)." },
                                                section: { type: Type.STRING, description: "Bölüm veya konu adı (örn: Birinci Söz, Yirmi İkinci Mektup)." },
                                                pageNumber: { type: Type.STRING, description: "Sayfa numarası (varsa)." }
                                            },
                                            required: ['book', 'section']
                                        }
                                    },
                                    required: ['originalText', 'source']
                                }
                            },
                             relatedPointsTitle: { 
                                type: Type.STRING, 
                                description: "Esaslar, nükteler ve düsturlar bölümü için dinamik bir başlık. Örn: 'İhlas Risalesi'nin Dört Düsturu'." 
                            },
                             relatedPoints: {
                                type: Type.ARRAY,
                                description: "Konuyla ilgili esaslar, nükteler veya düsturlar.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        pointTitle: { type: Type.STRING, description: "Noktanın sıralı başlığı (örn: Birinci Düstur)." },
                                        originalText: { type: Type.STRING, description: "Esasın, nüktenin veya düsturun geçtiği orijinal metin." },
                                        source: {
                                            type: Type.OBJECT,
                                            description: "Metnin kaynak bilgisi.",
                                            properties: {
                                                book: { type: Type.STRING },
                                                section: { type: Type.STRING },
                                                pageNumber: { type: Type.STRING }
                                            },
                                            required: ['book', 'section']
                                        }
                                    },
                                    required: ['pointTitle', 'originalText', 'source']
                                }
                            }
                        },
                        required: ['overallSummary', 'excerpts', 'relatedPointsTitle', 'relatedPoints']
                    }
                }
            });

            const jsonString = response.text.trim();
            const aiResponse: RisaleResponse = JSON.parse(jsonString);
            const newAiMessage: Message = { role: 'model', content: aiResponse };
            setMessages(prev => [...prev, newAiMessage]);

            const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                question: prompt,
                response: aiResponse
            };
            setHistory(prev => [newHistoryItem, ...prev]);
            setActiveHistoryId(newHistoryItem.id);

        } catch (err) {
            console.error("AI Error:", err);
            setError("Yapay zekadan cevap alınırken bir hata oluştu. Lütfen sorunuzu daha net ifade ederek tekrar deneyin.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        setActiveHistoryId(null);
        const newUserMessage: Message = { role: 'user', content: userInput };
        setMessages([newUserMessage]);
        await getAIResponse(userInput);
        setUserInput('');
    };

    const handleClearHistory = () => {
        setHistory([]);
        setMessages([]);
        setActiveHistoryId(null);
    };
    
    const handleDeleteHistoryItem = (e: React.MouseEvent, idToDelete: string) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== idToDelete));
        if (activeHistoryId === idToDelete) {
            setMessages([]);
            setActiveHistoryId(null);
        }
    };

    const handleEditHistoryItem = (e: React.MouseEvent, item: HistoryItem) => {
        e.stopPropagation();
        setEditingHistoryId(item.id);
        setEditingTitle(item.customTitle || item.question);
    };

    const handleSaveHistoryTitle = (id: string) => {
        setHistory(prev => prev.map(item =>
            item.id === id ? { ...item, customTitle: editingTitle } : item
        ));
        setEditingHistoryId(null);
        setEditingTitle('');
    };

    const handleShareHistoryItem = async (e: React.MouseEvent, item: HistoryItem) => {
        e.stopPropagation();
        setSharingId(item.id);
        try {
            const jsonString = JSON.stringify(item);
            const compressed = pako.deflate(jsonString);
    
            let binaryString = '';
            for (let i = 0; i < compressed.length; i++) {
                binaryString += String.fromCharCode(compressed[i]);
            }
            
            const encodedData = btoa(binaryString);
            const shareUrl = `${window.location.origin}${window.location.pathname}#/?module=risale&v=2&data=${encodeURIComponent(encodedData)}`;
    
            navigator.clipboard.writeText(shareUrl);
            showNotification('Paylaşım linki kopyalandı!');
    
        } catch (err) {
            console.error("Paylaşım başarısız:", err);
            showNotification('Link oluşturulurken bir hata oluştu.', 'error');
        } finally {
            setSharingId(null);
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
             {notification && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 animate-fade-in ${notification.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}
             {presentationData && (
                <div className="absolute -left-[9999px] top-0 w-[1080px]">
                    <div ref={presentationRef}>
                        <PresentationCard 
                            question={presentationData.question} 
                            response={presentationData.response}
                        />
                    </div>
                </div>
            )}
            
            {/* History Panel */}
            <aside className={`absolute top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out z-30 flex flex-col ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '320px' }}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Geçmiş Aramalar</h2>
                    <button onClick={() => setIsHistoryOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
                </div>
                {history.length > 0 ? (
                    <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                        {history.map(item => (
                             <li key={item.id} className={`rounded-md group relative ${activeHistoryId === item.id ? 'bg-teal-100 dark:bg-teal-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                {editingHistoryId === item.id ? (
                                    <div className="p-2.5">
                                        <input
                                            type="text"
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveHistoryTitle(item.id)}
                                            className="w-full text-sm p-1 border rounded dark:bg-gray-800 dark:border-gray-600"
                                            autoFocus
                                        />
                                        <div className="flex justify-end space-x-2 mt-2">
                                            <button onClick={() => setEditingHistoryId(null)} className="text-xs px-2 py-1">İptal</button>
                                            <button onClick={() => handleSaveHistoryTitle(item.id)} className="text-xs px-2 py-1 bg-teal-600 text-white rounded">Kaydet</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => handleHistoryItemClick(item)} className="flex-1 text-left p-2.5 text-sm truncate" title={item.customTitle || item.question}>
                                            {item.customTitle || item.question}
                                        </button>
                                        <div className="flex items-center space-x-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleEditHistoryItem(e, item)} title="Yeniden Adlandır" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><EditIcon className="w-4 h-4 text-gray-500" /></button>
                                            <button onClick={(e) => handleShareHistoryItem(e, item)} title="Paylaş" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" disabled={sharingId === item.id}>
                                                {sharingId === item.id ? <MiniSpinner /> : <ShareIcon className="w-4 h-4 text-gray-500" />}
                                            </button>
                                            <button onClick={(e) => handleDeleteHistoryItem(e, item.id)} title="Sil" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><TrashIcon className="w-4 h-4 text-red-500" /></button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-4 text-gray-500">
                        <p>Henüz arama geçmişiniz yok.</p>
                    </div>
                )}
                 <div className="p-3 border-t dark:border-gray-700">
                    {history.length > 0 && (
                         <button onClick={handleClearHistory} className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white shadow-sm hover:bg-red-700">
                            <TrashIcon className="w-4 h-4" />
                            <span>Tüm Geçmişi Temizle</span>
                        </button>
                    )}
                </div>
            </aside>

            <div className="flex flex-col flex-1 h-screen">
                <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center z-20">
                     <div className="flex items-center space-x-2">
                        <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <HistoryIcon className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Risale-i Nur'da Ara</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sorularınıza külliyattan kaynaklı cevaplar bulun.</p>
                        </div>
                    </div>
                    <button onClick={onGoHome} className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                        <HomeIcon className="w-5 h-5" />
                        <span>Anasayfa</span>
                    </button>
                </header>

                <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 select-text">
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center text-gray-500 dark:text-gray-400 pt-16">
                            <p className="text-lg">Risale-i Nur'dan bir konu sorun.</p>
                            <p className="text-sm">Örn: "İhlas hakkında bilgi ver."</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'user' ? (
                                <div className="max-w-lg lg:max-w-2xl px-4 py-3 rounded-xl bg-teal-500 text-white shadow-md">
                                    {msg.content}
                                </div>
                            ) : (
                                <div
                                    ref={el => { responseCardRefs.current[index] = el; }}
                                    className="max-w-2xl lg:max-w-4xl w-full px-5 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md space-y-6 relative"
                                >
                                    <div className="absolute top-3 right-3 flex space-x-1 exclude-from-download">
                                        <button
                                            onClick={() => handleCopy(msg.content, index)}
                                            title="Cevabı kopyala"
                                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            {copiedMessageIndex === index ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => handleDownload(index)}
                                            title="Cevabı kart olarak indir"
                                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadAsPresentation(msg.content, index)}
                                            title="Cevabı sunum olarak indir"
                                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            disabled={generatingIndex === index}
                                        >
                                            {generatingIndex === index ? <MiniSpinner /> : <PresentationIcon className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Summary */}
                                    <section>
                                        <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-2">Genel Özet</h2>
                                        <TaggedTextRenderer text={msg.content.overallSummary} />
                                    </section>
                                    
                                    {/* Related Points */}
                                    {msg.content.relatedPoints?.length > 0 && (
                                        <section>
                                            <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-3">{msg.content.relatedPointsTitle}</h2>
                                            <div className="space-y-4">
                                                {msg.content.relatedPoints.map((point, i) => (
                                                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3 border-l-4 border-amber-500">
                                                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{point.pointTitle}</h3>
                                                        <TaggedTextRenderer text={point.originalText} />
                                                        <div className="text-right mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                            <button 
                                                                onClick={() => setSourceModalData(point.source)}
                                                                className="inline-block px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                                                            >
                                                                Kaynak: {point.source.book} - {point.source.section}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Excerpts */}
                                    {msg.content.excerpts?.length > 0 && (
                                        <section>
                                            <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-3">İlgili Bölümlerden Alıntılar</h2>
                                            <div className="space-y-4">
                                                {msg.content.excerpts.map((excerpt, i) => (
                                                    <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                        <TaggedTextRenderer text={excerpt.originalText} />
                                                        <div className="text-right mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                             <button 
                                                                onClick={() => setSourceModalData(excerpt.source)}
                                                                className="inline-block px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                                                            >
                                                                Kaynak: {excerpt.source.book} - {excerpt.source.section}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                    
                                    {/* Disclaimer */}
                                    <div className="!mt-8 flex items-start space-x-3 p-3 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 rounded-lg border border-amber-200 dark:border-amber-900/60 exclude-from-download">
                                        <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                                        <p>Bu, yapay zeka tarafından üretilmiş bir özettir. Sunulan kaynakları ve alimlerin eserlerini bizzat araştırmanız tavsiye edilir.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-2xl px-4 py-3 rounded-xl bg-white dark:bg-gray-800 shadow-md">
                                <Spinner />
                            </div>
                        </div>
                    )}
                    {error && <p className="text-center text-red-500">{error}</p>}
                </main>

                <footer className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-20">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Bir konu yazın (örn: İman hakikatleri)..."
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !userInput.trim()}
                            className="p-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </form>
                </footer>
            </div>

            {sourceModalData && (
                <RisaleSourceDetailModal
                    sourceInfo={sourceModalData}
                    onClose={() => setSourceModalData(null)}
                />
            )}
        </div>
    );
};

export default RisaleSearch;
