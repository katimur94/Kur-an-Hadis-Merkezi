
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { AIHadithResponse, HadithResult, SourceInfo, ImamCommentary, FiqhSourceInfo } from '../types';
import Spinner from './Spinner';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>
);
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" /><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" clipRule="evenodd" /></svg>
);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.375 0-9.375 0" /></svg>
);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
);

type Message = {
    role: 'user' | 'model';
    content: string | AIHadithResponse;
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
    
    // State for modals
    const [hadithSourceModalData, setHadithSourceModalData] = useState<SourceInfo | null>(null);
    const [fiqhSourceModalData, setFiqhSourceModalData] = useState<FiqhSourceInfo | null>(null);
    const [commentaryModalData, setCommentaryModalData] = useState<{ hadith: HadithResult; commentaries: ImamCommentary[]; error?: string; } | null>(null);
    const [isFetchingCommentary, setIsFetchingCommentary] = useState(false);
    const [copiedHadithIdentifier, setCopiedHadithIdentifier] = useState<string | null>(null);


    const chatContainerRef = useRef<HTMLDivElement>(null);
    const lastQueryRef = useRef<string>('');
    const ai = new GoogleGenerativeAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY as string,});
    const model = 'gemini-2.5-flash';

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const getAIResponse = async (prompt: string) => {
        setIsLoading(true);
        setError(null);
        setShowMore(false);

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
            setMessages(prev => [...prev, newAiMessage]);
            setShowMore(aiResponse.hasMore);

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
        const newUserMessage: Message = { role: 'user', content: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        await getAIResponse(userInput);
    };
    
    const handleShowMore = async () => {
        if (!lastQueryRef.current || isLoading) return;
        const morePrompt = `${lastQueryRef.current} (lütfen devamını getir)`;
        await getAIResponse(morePrompt);
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
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Yapay Zeka ile Hadis Ara</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Konu belirterek hadisleri keşfedin.</p>
                </div>
                <button onClick={onGoHome} className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                    <HomeIcon className="w-5 h-5" />
                    <span>Anasayfa</span>
                </button>
            </header>

            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
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

            <footer className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
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
