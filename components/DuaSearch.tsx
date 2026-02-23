import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import * as htmlToImage from 'html-to-image';
import * as pako from 'pako';
import type { DuaResponse, DuaSourceInfo } from '../types';
import Spinner from './Spinner';
import { HighlightableText } from './Lugat';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" /><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" clipRule="evenodd" /></svg>);
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
    content: DuaResponse;
};

type HistoryItem = {
    id: string;
    question: string;
    customTitle?: string;
    response: DuaResponse;
};

const PresentationCard: React.FC<{ question: string; response: DuaResponse }> = ({ question, response }) => {
    return (
        <div className="p-16 font-sans bg-gradient-to-br from-[#1c2e4a] via-[#2d0f3b] to-[#1c2e4a] text-gray-200">
            <div className="text-center mb-12">
                <p className="text-xl text-gray-400">Soru:</p>
                <h1 className="text-5xl font-bold mt-2 text-white">"{question}"</h1>
            </div>

            <div className="mb-10 p-8 bg-black/20 rounded-xl shadow-lg border border-gray-700">
                <p dir="rtl" className="font-amiri text-6xl text-center leading-relaxed text-amber-200 mb-6">{response.arabicText}</p>
                <p className="text-center text-lg italic text-gray-400">({response.transliteration})</p>
            </div>
            
            <div className="mb-10">
                <h2 className="text-2xl font-semibold text-sky-300 mb-3 border-b border-sky-400/30 pb-2">
                    Anlamı ve Kullanım Yeri
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed mb-4">{response.turkishMeaning}</p>
                <p className="text-lg text-gray-300 leading-relaxed">{response.usageContext}</p>
            </div>
            
            {response.sources && response.sources.length > 0 && (
                 <div className="mb-10">
                    <h2 className="text-2xl font-semibold text-sky-300 mb-4 border-b border-sky-400/30 pb-2">
                        Kaynaklar
                    </h2>
                     <div className="space-y-6">
                        {response.sources.map((source, i) => (
                             <div key={i} className="border-l-4 border-amber-400 pl-6">
                                <blockquote className="italic text-gray-300 text-lg">
                                    <HighlightableText>{source.sourceContent}</HighlightableText>
                                </blockquote>
                                <p className="text-right text-sm text-gray-400 mt-2">Kaynak: {source.sourceText}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <footer className="text-center mt-16 text-sm text-gray-500">
                Dijital Medrese
            </footer>
        </div>
    );
};


const DuaSearch: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
    const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
    const [presentationData, setPresentationData] = useState<{ question: string; response: DuaResponse; index: number } | null>(null);

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
            const storedHistory = localStorage.getItem('duaSearchHistory');
            if (storedHistory) setHistory(JSON.parse(storedHistory));

            const importedDataString = sessionStorage.getItem('importedDataFor_dua');
            if (importedDataString) {
                sessionStorage.removeItem('importedDataFor_dua');
                const importedItem: HistoryItem = JSON.parse(importedDataString);
                setHistory(prev => {
                    if (prev.some(item => item.id === importedItem.id)) return prev;
                    return [importedItem, ...prev];
                });
                handleHistoryItemClick(importedItem);
            }
        } catch (e) { console.error("Failed to load or import history", e); }
    }, [handleHistoryItemClick]);

    useEffect(() => {
        localStorage.setItem('duaSearchHistory', JSON.stringify(history));
    }, [history]);

     useEffect(() => {
        if (presentationData && presentationRef.current) {
            htmlToImage.toPng(presentationRef.current, { pixelRatio: 2 })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = 'dua-sunum-karti.png';
                link.href = dataUrl;
                link.click();
            })
            .catch((error) => setError('Sunum kartı oluşturulurken bir hata oluştu.'))
            .finally(() => {
                setPresentationData(null);
                setGeneratingIndex(null);
            });
        }
    }, [presentationData]);
    
    const handleCopy = (response: DuaResponse, index: number) => {
        const userMessage = messages[index - 1];
        const question = (userMessage?.role === 'user') ? userMessage.content : '';
        let textToCopy = `Soru: ${question}\n\n`;
        textToCopy += `Dua (Arapça):\n${response.arabicText}\n\n`;
        textToCopy += `Okunuşu:\n${response.transliteration}\n\n`;
        textToCopy += `Anlamı:\n${response.turkishMeaning}\n\n`;
        textToCopy += `Ne Zaman Okunur:\n${response.usageContext}\n\n`;
        if (response.sources?.length > 0) {
            textToCopy += "Kaynaklar:\n";
            response.sources.forEach(source => {
                textToCopy += `- ${source.sourceText}: "${source.sourceContent}"\n`;
            });
        }
        navigator.clipboard.writeText(textToCopy.trim()).then(() => {
            setCopiedMessageIndex(index);
            setTimeout(() => setCopiedMessageIndex(null), 2500);
        }).catch(() => setError("Metin panoya kopyalanamadı."));
    };

    const handleDownload = (index: number) => {
      const node = responseCardRefs.current[index];
      if (node) {
        const isDarkMode = document.documentElement.classList.contains('dark');
        htmlToImage.toPng(node, { 
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            filter: (element) => !element.classList?.contains('exclude-from-download')
        })
        .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = 'dua-cevap-karti.png';
            link.href = dataUrl;
            link.click();
        })
        .catch(() => setError('Kart oluşturulurken bir hata oluştu.'));
      }
    };
    
    const handleDownloadAsPresentation = (response: DuaResponse, index: number) => {
        const userMessage = messages[index - 1];
        const question = (userMessage?.role === 'user') ? userMessage.content : 'Dua & Zikir';
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
                    systemInstruction: `Sen, Kur'an ve Sünnet'teki dualar (Dua) ve zikirler (Zikir) konusunda uzman bir İslam alimisin. Görevin, kullanıcının sorgusuna göre ilgili duayı veya zikri tüm detaylarıyla sunmaktır. Cevabın MUTLAKA aşağıdaki anahtarlara sahip bir JSON objesi olmalıdır:
- \`arabicText\`: Duanın tam, harekelenmiş Arapça metni.
- \`transliteration\`: Arapça metnin Latin harfleriyle okunuşu.
- \`turkishMeaning\`: Duanın Türkçe anlamı.
- \`usageContext\`: Bu duanın ne zaman ve hangi durumda okunduğunu açıklayan kısa bir bölüm.
- \`sources\`: Bir dizi (array). Bu duanın kaynağı olan her hadis, ayet veya Risale-i Nur alıntısı için bu diziye bir obje ekle. Her obje şu iki anahtarı içermelidir: \`sourceText\` (örn: "Sahih-i Buhari, Vudu, 10") ve \`sourceContent\` (kaynak metnin tamamı).`,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            arabicText: { type: Type.STRING },
                            transliteration: { type: Type.STRING },
                            turkishMeaning: { type: Type.STRING },
                            usageContext: { type: Type.STRING },
                            sources: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        sourceText: { type: Type.STRING },
                                        sourceContent: { type: Type.STRING }
                                    },
                                    required: ['sourceText', 'sourceContent']
                                }
                            }
                        },
                        required: ['arabicText', 'transliteration', 'turkishMeaning', 'usageContext', 'sources']
                    }
                }
            });

            const aiResponse: DuaResponse = JSON.parse(response.text.trim());
            const newAiMessage: Message = { role: 'model', content: aiResponse };
            setMessages(prev => [...prev, newAiMessage]);

            const newHistoryItem: HistoryItem = { id: Date.now().toString(), question: prompt, response: aiResponse };
            setHistory(prev => [newHistoryItem, ...prev]);
            setActiveHistoryId(newHistoryItem.id);

        } catch (err) {
            setError("Yapay zekadan cevap alınırken bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;
        setActiveHistoryId(null);
        setMessages([{ role: 'user', content: userInput }]);
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
            const shareUrl = `${window.location.origin}${window.location.pathname}#/?module=dua&v=2&data=${encodeURIComponent(encodedData)}`;
            navigator.clipboard.writeText(shareUrl);
            showNotification('Paylaşım linki kopyalandı!');
        } catch (err) {
            showNotification('Link oluşturulurken bir hata oluştu.', 'error');
        } finally {
            setSharingId(null);
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
            {notification && ( <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 animate-fade-in ${notification.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>{notification.message}</div> )}
            {presentationData && ( <div className="absolute -left-[9999px] top-0 w-[1080px]"><div ref={presentationRef}><PresentationCard question={presentationData.question} response={presentationData.response}/></div></div> )}
            
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
                                        <input type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveHistoryTitle(item.id)} className="w-full text-sm p-1 border rounded dark:bg-gray-800 dark:border-gray-600" autoFocus />
                                        <div className="flex justify-end space-x-2 mt-2">
                                            <button onClick={() => setEditingHistoryId(null)} className="text-xs px-2 py-1">İptal</button>
                                            <button onClick={() => handleSaveHistoryTitle(item.id)} className="text-xs px-2 py-1 bg-teal-600 text-white rounded">Kaydet</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => handleHistoryItemClick(item)} className="flex-1 text-left p-2.5 text-sm truncate" title={item.customTitle || item.question}>{item.customTitle || item.question}</button>
                                        <div className="flex items-center space-x-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleEditHistoryItem(e, item)} title="Yeniden Adlandır" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><EditIcon className="w-4 h-4 text-gray-500" /></button>
                                            <button onClick={(e) => handleShareHistoryItem(e, item)} title="Paylaş" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" disabled={sharingId === item.id}>{sharingId === item.id ? <MiniSpinner /> : <ShareIcon className="w-4 h-4 text-gray-500" />}</button>
                                            <button onClick={(e) => handleDeleteHistoryItem(e, item.id)} title="Sil" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><TrashIcon className="w-4 h-4 text-red-500" /></button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : ( <div className="flex-1 flex items-center justify-center text-center p-4 text-gray-500"><p>Henüz arama geçmişiniz yok.</p></div> )}
                 <div className="p-3 border-t dark:border-gray-700">
                    {history.length > 0 && ( <button onClick={handleClearHistory} className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white shadow-sm hover:bg-red-700"><TrashIcon className="w-4 h-4" /><span>Tüm Geçmişi Temizle</span></button> )}
                </div>
            </aside>

            <div className="flex flex-col flex-1 h-screen">
                <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center z-20">
                     <div className="flex items-center space-x-2">
                        <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><HistoryIcon className="w-5 h-5" /></button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Dua & Zikir Arama</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Sünnet'ten duaları ve zikirleri bulun.</p>
                        </div>
                    </div>
                    <button onClick={onGoHome} className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"><HomeIcon className="w-5 h-5" /><span>Anasayfa</span></button>
                </header>

                <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 select-text">
                    {messages.length === 0 && !isLoading && ( <div className="text-center text-gray-500 dark:text-gray-400 pt-16"><p className="text-lg">Bir dua veya zikir konusu arayın.</p><p className="text-sm">Örn: "Yemekten sonra okunacak dua"</p></div> )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'user' ? ( <div className="max-w-lg lg:max-w-2xl px-4 py-3 rounded-xl bg-teal-500 text-white shadow-md">{msg.content}</div>
                            ) : (
                                <div ref={el => { responseCardRefs.current[index] = el; }} className="max-w-2xl lg:max-w-4xl w-full px-5 py-4 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md space-y-6 relative">
                                    <div className="absolute top-3 right-3 flex space-x-1 exclude-from-download">
                                        <button onClick={() => handleCopy(msg.content, index)} title="Cevabı kopyala" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{copiedMessageIndex === index ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}</button>
                                        <button onClick={() => handleDownload(index)} title="Cevabı kart olarak indir" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><DownloadIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDownloadAsPresentation(msg.content, index)} title="Cevabı sunum olarak indir" className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" disabled={generatingIndex === index}>{generatingIndex === index ? <MiniSpinner /> : <PresentationIcon className="w-5 h-5" />}</button>
                                    </div>

                                    <section className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <p dir="rtl" className="font-amiri text-4xl text-gray-900 dark:text-gray-100 leading-relaxed">{msg.content.arabicText}</p>
                                        <p className="mt-4 text-md italic text-gray-500 dark:text-gray-400">({msg.content.transliteration})</p>
                                    </section>
                                    
                                    <section><h3 className="font-semibold text-teal-600 dark:text-teal-400">Anlamı:</h3><p className="text-gray-700 dark:text-gray-300"><HighlightableText>{msg.content.turkishMeaning}</HighlightableText></p></section>
                                    <section><h3 className="font-semibold text-teal-600 dark:text-teal-400">Ne Zaman Okunur:</h3><p className="text-gray-700 dark:text-gray-300"><HighlightableText>{msg.content.usageContext}</HighlightableText></p></section>

                                    {msg.content.sources?.length > 0 && (
                                        <section>
                                            <h3 className="font-semibold text-teal-600 dark:text-teal-400 mb-2">Kaynaklar:</h3>
                                            <div className="space-y-3">
                                                {msg.content.sources.map((source, i) => (
                                                    <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                                                        <p className="text-gray-600 dark:text-gray-400 italic mb-2">"<HighlightableText>{source.sourceContent}</HighlightableText>"</p>
                                                        <p className="text-right font-semibold text-xs text-gray-500 dark:text-gray-400">{source.sourceText}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && ( <div className="flex justify-start"><div className="max-w-2xl px-4 py-3 rounded-xl bg-white dark:bg-gray-800 shadow-md"><Spinner /></div></div> )}
                    {error && <p className="text-center text-red-500">{error}</p>}
                </main>

                <footer className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-20">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                        <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Bir dua konusu arayın (örn: Tuvalete girerken)..." className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" disabled={isLoading} />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-colors"><SendIcon className="w-6 h-6" /></button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default DuaSearch;
