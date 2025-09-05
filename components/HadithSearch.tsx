import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { AIHadithResponse } from '../types';
import Spinner from './Spinner';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>
);
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" /><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" clipRule="evenodd" /></svg>
);

type Message = {
    role: 'user' | 'model';
    content: string | AIHadithResponse;
};

const HadithSearch: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMore, setShowMore] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const lastQueryRef = useRef<string>('');

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
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
                    systemInstruction: `Sen Hadis ilimlerinde uzman bir İslam alimisin. Görevin, kullanıcının sorgusuyla ilgili sahih hadisleri bulmaktır. Kesinlikle kendi yorumunu veya özetini ekleme. Sadece hadisleri ve kaynaklarını listele. İlk cevapta en fazla 5 hadis sun. Eğer konuyla ilgili daha fazla hadis bulursan, 'hasMore' alanını 'true' olarak ayarla. Bulduğun her hadis için şu bilgileri yapılandırılmış bir formatta sunmalısın: 1. Hadisin tam ve değiştirilmemiş Türkçe metni. 2. Kaynağı (örneğin, Sahih-i Buhari, Kitabu'l-İman, Hadis 5). Sadece tanınmış Sahih koleksiyonlardan bilgi ver. Türkçe yanıt ver.`,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            hadiths: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        text: { type: Type.STRING, description: 'Hadisin tam Türkçe metni.' },
                                        source: { type: Type.STRING, description: 'Hadisin kaynağı (örn: Sahih-i Buhari, Kitabu\'l-İman, Hadis 5).' }
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
                            <div className="max-w-lg lg:max-w-2xl px-4 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-md space-y-4">
                                <div className="space-y-3">
                                    {msg.content.hadiths.map((hadith, hIndex) => (
                                        <div key={hIndex} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <p className="leading-relaxed mb-2">{hadith.text}</p>
                                            <p className="text-xs font-medium text-teal-600 dark:text-teal-400">{hadith.source}</p>
                                        </div>
                                    ))}
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
    );
};

export default HadithSearch;