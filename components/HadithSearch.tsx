import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { AIHadithResponse, HadithResult, SourceInfo, ImamCommentary, FiqhSourceInfo } from '../types';
import Spinner from './Spinner';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" /><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" clipRule="evenodd" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.375 0-9.375 0" /></svg>);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>);
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>);
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" /></svg>);
const ImportIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>);


type Message = {
    role: 'user' | 'model';
    content: string | AIHadithResponse;
};

type HistoryItem = {
    id: string;
    question: string;
    customTitle?: string;
    responses: AIHadithResponse[];
};

const SourceDetailModal: React.FC<{ sourceInfo: SourceInfo; onClose: () => void }> = ({ sourceInfo, onClose }) => {
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
                    <h3 className="text-xl font-bold">Hadis Kaynak Detayları</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <CloseIcon />
                    </button>
                </div>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex justify-between border-b pb-2 dark:border-gray-700">
                        <span className="font-semibold">Koleksiyon:</span>
                        <span>{sourceInfo.book}</span>
                    </li>
                    <li className="flex justify-between border-b pb-2 dark:border-gray-700">
                        <span className="font-semibold">Kitap/Bölüm:</span>
                        <span className="text-right">{sourceInfo.chapter}</span>
                    </li>
                    <li className="flex justify-between border-b pb-2 dark:border-gray-700">
                        <span className="font-semibold">Hadis No:</span>
                        <span>{sourceInfo.hadithNumber}</span>
                    </li>
                    {sourceInfo.volume && (
                        <li className="flex justify-between border-b pb-2 dark:border-gray-700">
                            <span className="font-semibold">Cilt No:</span>
                            <span>{sourceInfo.volume}</span>
                        </li>
                    )}
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

const FiqhSourceDetailModal: React.FC<{ sourceInfo: FiqhSourceInfo; onClose: () => void }> = ({ sourceInfo, onClose }) => {
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
                    <h3 className="text-xl font-bold">Fıkıh Kaynak Detayları</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <CloseIcon />
                    </button>
                </div>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    <li className="flex justify-between border-b pb-2 dark:border-gray-700">
                        <span className="font-semibold">Eser Adı:</span>
                        <span className="text-right">{sourceInfo.bookTitle}</span>
                    </li>
                     {sourceInfo.author && (
                        <li className="flex justify-between border-b pb-2 dark:border-gray-700">
                            <span className="font-semibold">Yazar:</span>
                            <span className="text-right">{sourceInfo.author}</span>
                        </li>
                    )}
                    {sourceInfo.volume && (
                        <li className="flex justify-between border-b pb-2 dark:border-gray-700">
                            <span className="font-semibold">Cilt No:</span>
                            <span>{sourceInfo.volume}</span>
                        </li>
                    )}
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

const ImamCommentaryModal: React.FC<{
    data: { hadith: HadithResult; commentaries: ImamCommentary[]; error?: string; };
    isFetching: boolean;
    onClose: () => void;
    onViewFiqhSource: (source: FiqhSourceInfo) => void;
}> = ({ data, isFetching, onClose, onViewFiqhSource }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl">
                    <h2 className="text-xl font-bold">Mezhep İmamlarının Yorumları</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-amber-500">
                        <p dir="rtl" className="font-amiri text-lg text-right leading-relaxed text-gray-800 dark:text-gray-200">{data.hadith.arabicText}</p>
                        <p className="text-gray-600 dark:text-gray-400 mt-2 italic">"{data.hadith.turkishText}"</p>
                    </div>
                    {isFetching ? (
                        <Spinner />
                    ) : data.error ? (
                        <p className="text-center text-red-500">{data.error}</p>
                    ) : data.commentaries.length > 0 ? (
                        <div className="space-y-4">
                            {data.commentaries.map((item, index) => (
                                <div key={index} className="p-4 border rounded-lg dark:border-gray-700 space-y-3">
                                    <h3 className="font-bold text-lg text-teal-600 dark:text-teal-400">{item.imamName}</h3>
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.commentary}</p>
                                    <div className="text-right pt-2 border-t dark:border-gray-600">
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); onViewFiqhSource(item.source); }}
                                            className="inline-block px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                                        >
                                           Kaynak: {item.source.bookTitle}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">Bu hadis hakkında özel bir yorum bulunamadı.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const HadithSearch: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMore, setShowMore] = useState(false);
    
    // History State
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
    const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // State for modals
    const [hadithSourceModalData, setHadithSourceModalData] = useState<SourceInfo | null>(null);
    const [fiqhSourceModalData, setFiqhSourceModalData] = useState<FiqhSourceInfo | null>(null);
    const [commentaryModalData, setCommentaryModalData] = useState<{ hadith: HadithResult; commentaries: ImamCommentary[]; error?: string; } | null>(null);
    const [isFetchingCommentary, setIsFetchingCommentary] = useState(false);
    const [copiedHadithIdentifier, setCopiedHadithIdentifier] = useState<string | null>(null);


    const chatContainerRef = useRef<HTMLDivElement>(null);
    const lastQueryRef = useRef<string>('');
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const model = 'gemini-2.5-flash';

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleHistoryItemClick = useCallback((item: HistoryItem) => {
        lastQueryRef.current = item.question;
        setActiveHistoryId(item.id);

        const reconstructedMessages: Message[] = [{ role: 'user', content: item.question }];
        item.responses.forEach(response => {
            reconstructedMessages.push({ role: 'model', content: response });
        });
        
        setMessages(reconstructedMessages);
        setShowMore(item.responses[item.responses.length - 1]?.hasMore || false);
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
            const storedHistory = localStorage.getItem('hadithSearchHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }

            const importedDataString = sessionStorage.getItem('importedDataFor_hadith');
            if (importedDataString) {
                sessionStorage.removeItem('importedDataFor_hadith');
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
            localStorage.setItem('hadithSearchHistory', JSON.stringify(history));
        } catch(e) {
            console.error("Failed to save history", e);
        }
    }, [history]);


    const getAIResponse = async (prompt: string, isContinuation: boolean, currentHistoryId: string) => {
        setIsLoading(true);
        setError(null);
        if (!isContinuation) {
            setShowMore(false);
        }

        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    systemInstruction: `Sen Hadis ilimlerinde uzman bir İslam alimisin. Görevin, kullanıcının sorgusuyla ilgili sahih hadisleri bulmaktır. Kesinlikle kendi yorumunu veya özetini ekleme. Sadece hadisleri ve kaynaklarını listele. İlk cevapta en fazla 5 hadis sun. Eğer konuyla ilgili daha fazla hadis bulursan, 'hasMore' alanını 'true' olarak ayarla. Bulduğun her hadis için şu bilgileri yapılandırılmış bir formatta sunmalısın: 1. Hadisin orijinal Arapça metni. 2. Hadisin tam Türkçe çevirisi. 3. Hadisi kimin rivayet ettiği (örneğin, "Hz. Ebu Hureyre (r.a.) rivayet ediyor:"). 4. Detaylı kaynak bilgisini 'source' objesi içinde yapılandırılmış olarak sunmalısın. Bu obje 'book' (örn: Sahih-i Buhari), 'chapter' (örn: Kitabu'l-İman), 'hadithNumber' (örn: 5), ve MÜMKÜNSE 'volume' ve 'pageNumber' alanlarını içermelidir. Sadece tanınmış Sahih koleksiyonlardan bilgi ver.`,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            hadiths: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        arabicText: { type: Type.STRING, description: 'Hadisin orijinal Arapça metni.' },
                                        turkishText: { type: Type.STRING, description: 'Hadisin tam Türkçe çevirisi.' },
                                        narrator: { type: Type.STRING, description: 'Hadisi kimin rivayet ettiği (örn: Hz. Ebu Hureyre (r.a.) rivayet ediyor:).' },
                                        source: {
                                            type: Type.OBJECT,
                                            description: 'Hadisin detaylı ve yapılandırılmış kaynağı.',
                                            properties: {
                                                book: { type: Type.STRING, description: 'Ana hadis koleksiyonu (örn: Sahih-i Buhari).' },
                                                chapter: { type: Type.STRING, description: 'Kitap veya bölüm adı (örn: Kitabu\'l-İman).' },
                                                hadithNumber: { type: Type.STRING, description: 'Hadisin numarası.' },
                                                volume: { type: Type.STRING, description: 'Cilt numarası (varsa).' },
                                                pageNumber: { type: Type.STRING, description: 'Sayfa numarası (varsa).' }
                                            }
                                        }
                                    }
                                }
                            },
                            hasMore: {
                                type: Type.BOOLEAN,
                                description: 'Eğer konuyla ilgili daha fazla hadis varsa true.'
                            }
                        }
                    }
                }
            });

            const jsonString = response.text.trim();
            const aiResponse: AIHadithResponse = JSON.parse(jsonString);
            const newAiMessage: Message = { role: 'model', content: aiResponse };
            if (isContinuation) {
                setMessages(prev => [...prev, newAiMessage]);
            } else {
                 setMessages(prev => [prev[0], newAiMessage]);
            }
            setShowMore(aiResponse.hasMore);

            // Update history
            setHistory(prev => {
                return prev.map(item => {
                    if (item.id === currentHistoryId) {
                        return { ...item, responses: [...item.responses, aiResponse] };
                    }
                    return item;
                });
            });

        } catch (err) {
            console.error("AI Error:", err);
            setError("Yapay zekadan cevap alınırken bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;
        
        lastQueryRef.current = userInput;
        
        const newHistoryItem: HistoryItem = {
            id: Date.now().toString(),
            question: userInput,
            responses: []
        };
        setHistory(prev => [newHistoryItem, ...prev]);
        setActiveHistoryId(newHistoryItem.id);
        
        const newUserMessage: Message = { role: 'user', content: userInput };
        setMessages([newUserMessage]);
        
        await getAIResponse(userInput, false, newHistoryItem.id);
        setUserInput('');
    };
    
    const handleShowMore = async () => {
        if (!lastQueryRef.current || isLoading || !activeHistoryId) return;
        const morePrompt = `${lastQueryRef.current} (lütfen devamını getir)`;
        await getAIResponse(morePrompt, true, activeHistoryId);
    };
    
    const handleClearHistory = () => {
        setHistory([]);
        setMessages([]);
        setActiveHistoryId(null);
        lastQueryRef.current = '';
        setShowMore(false);
        localStorage.removeItem('hadithSearchHistory');
    };

    const handleDeleteHistoryItem = (e: React.MouseEvent, idToDelete: string) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== idToDelete));
        if (activeHistoryId === idToDelete) {
            setMessages([]);
            setActiveHistoryId(null);
            setShowMore(false);
            lastQueryRef.current = '';
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

    const handleShareHistoryItem = (e: React.MouseEvent, item: HistoryItem) => {
        e.stopPropagation();
        try {
            const jsonString = JSON.stringify(item);
            const encodedString = btoa(unescape(encodeURIComponent(jsonString)));
            const url = `${window.location.origin}${window.location.pathname}#/?module=hadith&data=${encodedString}`;
            navigator.clipboard.writeText(url);
            showNotification('Paylaşım linki panoya kopyalandı!');
        } catch (err) {
            showNotification('Link oluşturulurken bir hata oluştu.', 'error');
        }
    };

    const handleHadithClick = async (hadith: HadithResult) => {
        setCommentaryModalData({ hadith, commentaries: [] });
        setIsFetchingCommentary(true);
        
        try {
            const prompt = `Sen fıkıh ve hadis ilimlerinde uzman bir alimsin. Aşağıda metni verilen hadis özelinde, Dört Büyük Sünni Mezhep İmamı'nın (İmam Ebu Hanife, İmam Şafii, İmam Malik, İmam Ahmed bin Hanbel) görüşlerini, bu hadisten çıkardıkları hükümleri veya yorumlarını açıkla. Her imamın görüşünü ayrı ayrı belirt ve her görüş için bu bilginin kaynağını (eser adı, yazar, mümkünse cilt ve sayfa numarası) yapılandırılmış bir 'source' nesnesi içinde ver. Eğer bir imamın bu hadisle ilgili özel bir görüşü yoksa bunu da belirt.\n\nHadis:\nArapça: ${hadith.arabicText}\nTürkçe: "${hadith.turkishText}"`;
            
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                imamName: { type: Type.STRING, description: "İmamın adı ve mezhebi (örn: İmam Şafii (Şafii Mezhebi))." },
                                commentary: { type: Type.STRING, description: "İmamın bu hadis hakkındaki yorumu veya çıkardığı fıkhi hüküm." },
                                source: {
                                    type: Type.OBJECT,
                                    description: "Yorumun alındığı fıkıh kaynağı.",
                                    properties: {
                                        bookTitle: { type: Type.STRING, description: "Eserin adı (örn: el-Umm)." },
                                        author: { type: Type.STRING, description: "Eserin yazarı (örn: İmam Şafii)." },
                                        volume: { type: Type.STRING, description: "Cilt numarası (varsa)." },
                                        pageNumber: { type: Type.STRING, description: "Sayfa numarası (varsa)." }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            
            const results: ImamCommentary[] = JSON.parse(response.text.trim());
            setCommentaryModalData({ hadith, commentaries: results });

        } catch (err) {
            console.error("Error fetching commentary:", err);
            setCommentaryModalData({ hadith, commentaries: [], error: "İmamların yorumları alınırken bir hata oluştu." });
        } finally {
            setIsFetchingCommentary(false);
        }
    };
    
    const handleCopyHadith = (hadith: HadithResult) => {
        const sourceParts = [
            hadith.source.book,
            hadith.source.chapter,
            `Hadis No: ${hadith.source.hadithNumber}`
        ];
        if (hadith.source.volume) sourceParts.push(`Cilt: ${hadith.source.volume}`);
        if (hadith.source.pageNumber) sourceParts.push(`Sayfa: ${hadith.source.pageNumber}`);
        
        const sourceString = sourceParts.join(', ');

        const textToCopy = `${hadith.arabicText}\n\n${hadith.narrator}\n"${hadith.turkishText}"\n\nKaynak: ${sourceString}`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            const identifier = hadith.arabicText.slice(0, 30); // Unique identifier
            setCopiedHadithIdentifier(identifier);
            setTimeout(() => setCopiedHadithIdentifier(null), 2000);
        }).catch(err => {
            console.error('Failed to copy hadith: ', err);
        });
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
            {notification && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 animate-fade-in ${notification.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>
                    {notification.message}
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
                                            <button onClick={(e) => handleShareHistoryItem(e, item)} title="Paylaş" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><ShareIcon className="w-4 h-4 text-gray-500" /></button>
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

            {/* Main Content */}
            <div className="flex flex-col flex-1 h-screen">
                <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center z-20">
                    <div className="flex items-center space-x-2">
                         <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                            <HistoryIcon className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Yapay Zeka ile Hadis Ara</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Konu belirterek hadisleri keşfedin.</p>
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
                            <p className="text-lg">Aramak istediğiniz konuyu yazın.</p>
                            <p className="text-sm">Örn: "Namazın önemi hakkında hadisler"</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {typeof msg.content === 'string' ? (
                                <div className="max-w-lg lg:max-w-2xl px-4 py-3 rounded-xl bg-teal-500 text-white shadow-md">
                                    {msg.content}
                                </div>
                            ) : (
                                <div className="max-w-lg lg:max-w-2xl w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md space-y-4">
                                    <div className="space-y-4">
                                        {msg.content.hadiths?.map((hadith, hIndex) => {
                                            const hadithIdentifier = hadith.arabicText.slice(0, 30);
                                            return (
                                            <button 
                                                key={hIndex} 
                                                onClick={() => handleHadithClick(hadith)}
                                                className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3 border-l-4 border-teal-500 hover:border-teal-600 dark:hover:border-teal-500 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
                                            >
                                                <p dir="rtl" className="font-amiri text-xl text-right leading-relaxed mb-2 text-gray-800 dark:text-gray-200">
                                                    {hadith.arabicText}
                                                </p>
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    {hadith.narrator}
                                                </p>
                                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                                    "{hadith.turkishText}"
                                                </p>
                                                <div className="text-right mt-2 flex justify-end items-center space-x-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCopyHadith(hadith); }}
                                                        className="p-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-900/50 transition-colors"
                                                        title="Hadisi Kopyala"
                                                    >
                                                        {copiedHadithIdentifier === hadithIdentifier ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                                    </button>
                                                    <div 
                                                        onClick={(e) => { e.stopPropagation(); setHadithSourceModalData(hadith.source); }}
                                                        className="inline-block px-3 py-1 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/50 rounded-full hover:bg-teal-200 dark:hover:bg-teal-900 transition-colors cursor-pointer"
                                                    >
                                                    Kaynak: {hadith.source.book}
                                                    </div>
                                                </div>
                                            </button>
                                        )})}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {showMore && !isLoading && (
                        <div className="flex justify-center">
                            <button 
                                onClick={handleShowMore}
                                className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 transition-colors"
                            >
                                Daha Fazla Göster
                            </button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-lg lg:max-w-2xl px-4 py-3 rounded-xl bg-white dark:bg-gray-800 shadow-md">
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
                            placeholder="Bir konu yazın (örn: Oruç)..."
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                            disabled={isLoading || isFetchingCommentary}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || isFetchingCommentary || !userInput.trim()}
                            className="p-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </form>
                </footer>
            </div>

            {hadithSourceModalData && (
                <SourceDetailModal 
                    sourceInfo={hadithSourceModalData}
                    onClose={() => setHadithSourceModalData(null)}
                />
            )}
            
            {commentaryModalData && (
                <ImamCommentaryModal
                    data={commentaryModalData}
                    isFetching={isFetchingCommentary}
                    onClose={() => setCommentaryModalData(null)}
                    onViewFiqhSource={(source) => setFiqhSourceModalData(source)}
                />
            )}

            {fiqhSourceModalData && (
                <FiqhSourceDetailModal
                    sourceInfo={fiqhSourceModalData}
                    onClose={() => setFiqhSourceModalData(null)}
                />
            )}
        </div>
    );
};

export default HadithSearch;
