import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import * as htmlToImage from 'html-to-image';
import type { FiqhResponse, FiqhSourceInfo } from '../types';
import Spinner from './Spinner';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" /><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" clipRule="evenodd" /></svg>);
const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.375 0-9.375 0" /></svg>);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>);
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>);
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" /></svg>);
const ImportIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>);

type Message = {
    role: 'user' | 'model';
    content: string | FiqhResponse;
};

type HistoryItem = {
    id: string;
    question: string;
    customTitle?: string;
    response: FiqhResponse;
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

const FiqhChat: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fiqhSourceModalData, setFiqhSourceModalData] = useState<FiqhSourceInfo | null>(null);
    const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

    // History State
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
    const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [importCode, setImportCode] = useState('');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const responseCardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
    const model = 'gemini-2.5-flash';
    
    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // History Load/Save Effects
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('fiqhChatHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('fiqhChatHistory', JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save history", e);
        }
    }, [history]);
    
    const handleCopy = (response: FiqhResponse, index: number) => {
      let textToCopy = `Soru: ${typeof messages[index-1]?.content === 'string' ? messages[index-1].content : ''}\n\nÖzet:\n${response.summary}\n\n`;

      if (response.madhahibPositions?.length > 0) {
        textToCopy += "Mezheplerin Görüşleri:\n";
        response.madhahibPositions.forEach(p => {
          const sourceParts = [p.source.bookTitle, p.source.author, p.source.volume ? `Cilt ${p.source.volume}`: null, p.source.pageNumber ? `Sayfa ${p.source.pageNumber}`: null].filter(Boolean);
          textToCopy += `- ${p.madhab} Mezhebi: ${p.position}\n`;
          textToCopy += `  (Kaynak: ${sourceParts.join(', ')})\n\n`;
        });
      }

      if (response.relevantHadiths?.length > 0) {
        textToCopy += "İlgili Hadisler:\n";
        response.relevantHadiths.forEach(h => {
          textToCopy += `${h.arabicText}\n`;
          textToCopy += `"${h.turkishText}"\n`;
          textToCopy += `(Kaynak: ${h.source}, Sıhhat: ${h.authenticity})\n\n`;
        });
      }

      if (response.relevantQuranVerses?.length > 0) {
        textToCopy += "İlgili Kur'an Ayetleri:\n";
        response.relevantQuranVerses.forEach(v => {
          textToCopy += `${v.arabicText}\n`;
          textToCopy += `"${v.turkishText}"\n`;
          textToCopy += `(Kaynak: ${v.reference})\n\n`;
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
            link.download = 'fiqh-cevap-kart.png';
            link.href = dataUrl;
            link.click();
        })
        .catch((error) => {
            console.error('Failed to generate image', error);
            setError('Kart oluşturulurken bir hata oluştu.');
        });
      }
    };

    const getAIResponse = async (prompt: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    systemInstruction: `Sen, dört Sünni mezhep (Hanefi, Şafii, Maliki, Hanbeli) konusunda uzmanlaşmış bir Fıkıh alimisin. Kullanıcının fıkhi sorularını yanıtlarken, aşağıdaki yapıya harfiyen uymalısın VE TÜM BÖLÜMLERİ DOLDURMALISIN:
1.  **Özet:** Sorunun cevabını net, kısa ve anlaşılır bir şekilde özetle.
2.  **Mezheplerin Görüşleri:** Dört büyük mezhebin konu hakkındaki görüşlerini ayrı ayrı belirt. Her görüş için, bu bilginin alındığı temel fıkıh eserini kaynak olarak göstermelisin. Kaynak bilgisi; eserin adı, yazarı, cilt ve sayfa numarasını içermelidir.
3.  **İlgili Hadisler:** Konuyla doğrudan ilgili en fazla 2-3 adet sahih hadis sun. Her hadis için Arapça metnini, Türkçe tercümesini, tam kaynağını (örn: 'Sahih-i Buhari, Oruç, 2') ve sıhhat durumunu ('Sahih', 'Hasan' vb.) belirt.
4.  **İlgili Kur'an Ayetleri:** Konuyla ilgili ayetler varsa, Arapça metni, Türkçe meali ve referansı (örn: 'Bakara, 183') ile birlikte sun.
Cevabın her zaman bu yapılandırılmış formatta ve JSON olarak dönmelidir. Eğer bir bölüm için (hadis, ayet, mezhep görüşü) bilgi bulamazsan, o bölüm için boş bir dizi [] döndür, ama anahtarı (key) asla yanıttan çıkarma.`,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            summary: { type: Type.STRING, description: "Sorunun cevabının net, kısa ve anlaşılır özeti." },
                            madhahibPositions: {
                                type: Type.ARRAY,
                                description: "Dört Sünni mezhebin konu hakkındaki kaynaklı görüşleri.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        madhab: { type: Type.STRING, description: "Mezhebin adı (Hanefi, Şafii, Maliki, Hanbeli)." },
                                        position: { type: Type.STRING, description: "Mezhebin konu hakkındaki görüşü veya hükmü." },
                                        source: {
                                            type: Type.OBJECT,
                                            description: "Görüşün alındığı fıkıh kaynağı.",
                                            properties: {
                                                bookTitle: { type: Type.STRING, description: "Eserin adı (örn: el-Mebsut)." },
                                                author: { type: Type.STRING, description: "Eserin yazarı (örn: İmam Serahsi)." },
                                                volume: { type: Type.STRING, description: "Cilt numarası (varsa)." },
                                                pageNumber: { type: Type.STRING, description: "Sayfa numarası (varsa)." }
                                            },
                                            required: ['bookTitle']
                                        }
                                    },
                                    required: ['madhab', 'position', 'source']
                                }
                            },
                            relevantHadiths: {
                                type: Type.ARRAY,
                                description: "Konuyla ilgili delil niteliğindeki hadisler.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        arabicText: { type: Type.STRING, description: "Hadisin orijinal Arapça metni." },
                                        turkishText: { type: Type.STRING, description: "Hadisin tam Türkçe çevirisi." },
                                        source: { type: Type.STRING, description: "Hadisin kaynağı (örn: Sahih-i Buhari, Oruç, 2)." },
                                        authenticity: { type: Type.STRING, description: "Hadisin sıhhat durumu (Sahih, Hasan, Zayıf, Mevzu)." }
                                    },
                                    required: ['arabicText', 'turkishText', 'source', 'authenticity']
                                }
                            },
                            relevantQuranVerses: {
                                type: Type.ARRAY,
                                description: "Konuyla ilgili Kur'an ayetleri.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        arabicText: { type: Type.STRING, description: "Ayetin orijinal Arapça metni." },
                                        turkishText: { type: Type.STRING, description: "Ayetin Türkçe meali." },
                                        reference: { type: Type.STRING, description: "Ayetin referansı (örn: Bakara, 183)." }
                                    },
                                    required: ['arabicText', 'turkishText', 'reference']
                                }
                            }
                        },
                        required: ['summary', 'madhahibPositions', 'relevantHadiths', 'relevantQuranVerses']
                    }
                }
            });

            const jsonString = response.text.trim();
            const aiResponse: FiqhResponse = JSON.parse(jsonString);
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

    const handleHistoryItemClick = (item: HistoryItem) => {
        setActiveHistoryId(item.id);
        setMessages([
            { role: 'user', content: item.question },
            { role: 'model', content: item.response }
        ]);
        setIsHistoryOpen(false);
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

    const handleShareHistoryItem = (e: React.MouseEvent, item: HistoryItem) => {
        e.stopPropagation();
        try {
            const jsonString = JSON.stringify(item);
            const encodedString = btoa(unescape(encodeURIComponent(jsonString)));
            navigator.clipboard.writeText(encodedString);
            showNotification('Paylaşım kodu panoya kopyalandı!');
        } catch (err) {
            showNotification('Kod oluşturulurken bir hata oluştu.', 'error');
        }
    };
    
    const handleImportHistory = () => {
        if (!importCode.trim()) return;
        try {
            const decodedString = decodeURIComponent(escape(atob(importCode)));
            const importedItem = JSON.parse(decodedString);

            if (!importedItem.question || !importedItem.response || !importedItem.response.summary) {
                throw new Error('Invalid code format');
            }

            const newHistoryItem: HistoryItem = {
                ...importedItem,
                id: Date.now().toString(),
            };
            
            setHistory(prev => [newHistoryItem, ...prev.filter(item => item.id !== newHistoryItem.id)]);
            setImportCode('');
            showNotification('Geçmiş başarıyla içe aktarıldı!');
        } catch (err) {
            showNotification('Geçersiz veya bozuk kod.', 'error');
        }
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
                    <h2 className="font-bold text-lg">Geçmiş Sorular</h2>
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
                        <p>Henüz soru geçmişiniz yok.</p>
                    </div>
                )}
                 <div className="p-3 border-t dark:border-gray-700 space-y-2">
                    <div className="flex items-center space-x-2">
                         <input
                            type="text"
                            value={importCode}
                            onChange={(e) => setImportCode(e.target.value)}
                            placeholder="Paylaşım kodunu yapıştırın..."
                            className="flex-1 p-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                        <button onClick={handleImportHistory} className="p-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-teal-400" disabled={!importCode.trim()}>
                            <ImportIcon className="w-5 h-5"/>
                        </button>
                    </div>
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
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Fıkıh Soru & Cevap</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Dört mezhebe göre kaynaklı cevaplar alın.</p>
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
                            <p className="text-lg">Fıkhî bir soru sorun.</p>
                            <p className="text-sm">Örn: "Seferi namazı nasıl kılınır?"</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {typeof msg.content === 'string' ? (
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
                                            onClick={() => handleCopy(msg.content as FiqhResponse, index)}
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
                                    </div>

                                    {/* Summary */}
                                    <section>
                                        <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-2">Özet</h2>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{msg.content.summary}</p>
                                    </section>
                                    
                                    {/* Madhahib */}
                                    {msg.content.madhahibPositions?.length > 0 && (
                                        <section>
                                            <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-3">Mezheplerin Görüşleri</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {msg.content.madhahibPositions.map((item, i) => (
                                                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-amber-500 flex flex-col justify-between">
                                                        <div>
                                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{item.madhab} Mezhebi</h3>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.position}</p>
                                                        </div>
                                                        {item.source && (
                                                            <div className="text-right mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                                <button
                                                                    onClick={() => setFiqhSourceModalData(item.source)}
                                                                    className="inline-block px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                                                                >
                                                                    Kaynak: {item.source.bookTitle}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Hadiths */}
                                    {msg.content.relevantHadiths?.length > 0 && (
                                        <section>
                                            <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-3">İlgili Hadisler</h2>
                                            <div className="space-y-4">
                                                {msg.content.relevantHadiths.map((hadith, i) => (
                                                    <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                        <p dir="rtl" className="font-amiri text-lg text-right leading-relaxed mb-2">{hadith.arabicText}</p>
                                                        <p className="text-gray-600 dark:text-gray-400 italic mb-3">"{hadith.turkishText}"</p>
                                                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">{hadith.source}</span>
                                                            <span className="font-semibold px-2 py-1 bg-teal-100 dark:bg-teal-900/70 text-teal-700 dark:text-teal-300 rounded-md">Sıhhat: {hadith.authenticity}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Quran Verses */}
                                    {msg.content.relevantQuranVerses?.length > 0 && (
                                        <section>
                                            <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-3">İlgili Kur'an Ayetleri</h2>
                                            <div className="space-y-4">
                                                {msg.content.relevantQuranVerses.map((verse, i) => (
                                                    <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                        <p dir="rtl" className="font-amiri text-lg text-right leading-relaxed mb-2">{verse.arabicText}</p>
                                                        <p className="text-gray-600 dark:text-gray-400 italic mb-3">"{verse.turkishText}"</p>
                                                        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">{verse.reference}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                    
                                    {/* Disclaimer */}
                                    <div className="!mt-8 flex items-start space-x-3 p-3 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 rounded-lg border border-amber-200 dark:border-amber-900/60 exclude-from-download">
                                        <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                                        <p>Bu, yapay zeka tarafından üretilmiş bir özettir. Dini konularda nihai bir karar vermeden önce sunulan kaynakları ve alimlerin eserlerini bizzat araştırmanız tavsiye edilir.</p>
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
                            placeholder="Bir fıkıh sorusu yazın..."
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
             {fiqhSourceModalData && (
                <FiqhSourceDetailModal 
                    sourceInfo={fiqhSourceModalData}
                    onClose={() => setFiqhSourceModalData(null)}
                />
            )}
        </div>
    );
};

export default FiqhChat;
