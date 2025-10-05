
import React, { createContext, useState, useContext, useCallback, ReactNode, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Spinner from './Spinner';

// --- ICONS ---
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>);
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);


// --- TYPES ---
interface LugatData {
  definition: string;
  sourceLanguage: string;
  otherMeanings: string[];
}

interface LugatHistoryItem {
    term: string;
    data: LugatData;
}

interface LugatPopupState {
  isOpen: boolean;
  term: string | null;
  data: LugatData | null;
  isLoading: boolean;
  error: string | null;
}

interface LugatTooltipState {
    isOpen: boolean;
    data: LugatData | null;
    position: { top: number; left: number };
}

interface LugatContextType {
  showLugatPopup: (prefill?: string) => void;
  hideLugat: () => void;
  searchLugatTerm: (term: string) => void;
  state: LugatPopupState;
  history: LugatHistoryItem[];
  deleteFromHistory: (term: string) => void;
  clearHistory: () => void;
  showTooltip: (term: string, rect: DOMRect) => void;
  hideTooltip: () => void;
}

// --- CONTEXT ---
const LugatContext = createContext<LugatContextType | undefined>(undefined);

export const useLugat = () => {
  const context = useContext(LugatContext);
  if (!context) {
    throw new Error('useLugat must be used within a LugatContextProvider');
  }
  return context;
};

// --- API ---
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
const model = 'gemini-2.5-flash';

// --- HIGHLIGHTER COMPONENT ---
export const HighlightableText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { history, showTooltip, hideTooltip } = useLugat();
    const text = typeof children === 'string' ? children : '';

    if (!history.length || !text) {
        return <>{children}</>;
    }
    
    // Create a case-insensitive regex from history terms
    const terms = history.map(item => item.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (terms.length === 0) {
        return <>{children}</>;
    }

    const regex = new RegExp(`(${terms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.filter(Boolean).map((part, i) => {
                const isMatch = history.some(item => item.term.toLowerCase() === part.toLowerCase());
                if (isMatch) {
                    return (
                        <span
                            key={i}
                            className="underline decoration-dotted decoration-teal-500 cursor-pointer"
                            onMouseEnter={(e) => showTooltip(part, e.currentTarget.getBoundingClientRect())}
                            onMouseLeave={hideTooltip}
                        >
                            {part}
                        </span>
                    );
                }
                return part;
            })}
        </>
    );
};


// --- COMPONENTS ---
const LugatBubble: React.FC = () => {
    const { showLugatPopup } = useLugat();
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 80 });
    const isDragging = useRef(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const initialPointerPos = useRef({ x: 0, y: 0 });
    const hasMoved = useRef(false);

    useEffect(() => {
        const savedPos = localStorage.getItem('lugatBubblePosition');
        if (savedPos) {
            setPosition(JSON.parse(savedPos));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('lugatBubblePosition', JSON.stringify(position));
    }, [position]);

    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        hasMoved.current = false;
        initialPointerPos.current = { x: e.clientX, y: e.clientY };
        dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        
        const dx = e.clientX - initialPointerPos.current.x;
        const dy = e.clientY - initialPointerPos.current.y;
        if (!hasMoved.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            hasMoved.current = true;
        }

        if (hasMoved.current) {
            let newX = e.clientX - dragStartPos.current.x;
            let newY = e.clientY - dragStartPos.current.y;
            
            // Clamp position within viewport
            newX = Math.max(10, Math.min(newX, window.innerWidth - 60));
            newY = Math.max(10, Math.min(newY, window.innerHeight - 60));

            setPosition({ x: newX, y: newY });
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        isDragging.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        if (!hasMoved.current) {
            showLugatPopup();
        }
    };
    
    return (
        <button
            style={{ 
                top: position.y, 
                left: position.x,
                touchAction: 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="fixed z-40 w-14 h-14 bg-teal-600 dark:bg-teal-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            aria-label="Lügat'ı Aç"
        >
            <BookOpenIcon className="w-7 h-7" />
        </button>
    );
};


const LugatPopup: React.FC = () => {
    const { state, hideLugat, searchLugatTerm, history, deleteFromHistory, clearHistory } = useLugat();
    const { isOpen, term, data, isLoading, error } = state;
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            searchLugatTerm(inputValue.trim());
        }
    };

    const handleHistoryClick = (item: LugatHistoryItem) => {
        // Directly show the definition from history without a new API call
        searchLugatTerm(item.term); // This sets the loading state and term correctly
    };

    useEffect(() => {
        if (!isOpen) {
            setInputValue('');
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const renderContent = () => {
        if (isLoading) return <Spinner />;
        if (error) return <p className="text-center text-red-500">{error}</p>;
        if (data) {
            return (
                <div className="space-y-3 text-sm">
                    <div className="pb-2">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.definition}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Kaynak Dil: {data.sourceLanguage}</p>
                    </div>
                    {data.otherMeanings?.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                            <h5 className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Diğer Mânalar</h5>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                                {data.otherMeanings.map((meaning, i) => <li key={i}>{meaning}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }
        return null; // Search form and history are rendered outside this function
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={hideLugat}>
            <div 
                className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border border-gray-200 dark:border-gray-700 animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">
                        {term ? `Lügat: "${term}"` : "Lügat'ta Ara"}
                    </h4>
                    <button onClick={hideLugat} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close popup"><CloseIcon className="w-5 h-5" /></button>
                </div>
                <div className="min-h-[150px]">
                    <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder="Kelime veya tabir..."
                            className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500"
                            autoFocus={!data}
                        />
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 disabled:bg-teal-400 transition-colors flex items-center justify-center" disabled={!inputValue.trim() || isLoading}>
                            <SearchIcon className="w-5 h-5"/>
                        </button>
                    </form>
                    
                    {renderContent()}

                    {!data && !isLoading && history.length > 0 && (
                        <div className="border-t dark:border-gray-700 pt-3 mt-3">
                            <div className="flex justify-between items-center mb-2">
                                <h5 className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Geçmiş</h5>
                                <button onClick={clearHistory} className="text-xs text-red-500 hover:underline">Tümünü Sil</button>
                            </div>
                            <ul className="max-h-32 overflow-y-auto space-y-1 pr-2">
                                {history.map(item => (
                                    <li key={item.term} className="flex justify-between items-center group text-sm">
                                        <button onClick={() => handleHistoryClick(item)} className="flex-1 text-left py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">{item.term}</button>
                                        <button onClick={() => deleteFromHistory(item.term)} className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LugatTooltip: React.FC<{ state: LugatTooltipState; }> = ({ state }) => {
    if (!state.isOpen || !state.data) return null;
    
    const popupStyle: React.CSSProperties = {
        position: 'fixed',
        top: `${state.position.top}px`,
        left: `${state.position.left}px`,
        transform: 'translateY(-100%) translateY(-10px)', // Position above the element
        zIndex: 100,
    };
    
    return (
        <div style={popupStyle} className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-3 border border-gray-200 dark:border-gray-700 animate-fade-in">
            <p className="text-sm text-gray-700 dark:text-gray-300">{state.data.definition}</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white dark:border-t-gray-800"></div>
        </div>
    );
};

// --- PROVIDER ---
export const LugatContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<LugatPopupState>({
        isOpen: false, term: null, data: null, isLoading: false, error: null
    });
    const [history, setHistory] = useState<LugatHistoryItem[]>([]);
    const [tooltipState, setTooltipState] = useState<LugatTooltipState>({
        isOpen: false, data: null, position: { top: 0, left: 0 }
    });
    
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('lugatHistory');
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) { console.error("Could not load lugat history", e); }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('lugatHistory', JSON.stringify(history));
        } catch (e) { console.error("Could not save lugat history", e); }
    }, [history]);

    const hideLugat = useCallback(() => {
        setState({ isOpen: false, term: null, data: null, isLoading: false, error: null });
    }, []);

    const showLugatPopup = useCallback((prefill?: string) => {
        setState(prev => ({ ...prev, isOpen: true, term: prefill || null }));
    }, []);
  
    const searchLugatTerm = useCallback(async (term: string) => {
        const historyItem = history.find(item => item.term.toLowerCase() === term.toLowerCase());
        if (historyItem) {
            setState({ isOpen: true, term: historyItem.term, data: historyItem.data, isLoading: false, error: null });
            return;
        }

        setState({ isOpen: true, isLoading: true, term, data: null, error: null });
        try {
            const prompt = `Sen hem klasik Arapça hem de Osmanlı/Modern Türkçe'ye hakim, İslami terminoloji ve dilbilim uzmanısın. Şu terim için kısa ve öz bir sözlük tanımı sağla: "${term}". Cevabını JSON formatında yapılandır. Eğer terimin birden fazla farklı anlamı varsa, en yaygın olanını ana 'definition' olarak sağla ve diğerlerini 'otherMeanings' dizisinde listele. Başka anlamı yoksa, dizi boş olmalı. Ayrıca kelimenin öncelikli olarak 'Arapça', 'Türkçe' veya 'Farsça' vb. olup olmadığını belirten bir 'sourceLanguage' alanı ekle. Cevabın tamamen Türkçe olmalıdır.`;
            
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            definition: { type: Type.STRING, description: "The primary, concise definition of the term." },
                            sourceLanguage: { type: Type.STRING, description: "The origin language of the term (e.g., Arabic, Turkish)." },
                            otherMeanings: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "An array of other significant meanings, if they exist."
                            }
                        },
                        required: ['definition', 'sourceLanguage', 'otherMeanings']
                    }
                }
            });
            const data: LugatData = JSON.parse(response.text.trim());
            setState(prev => ({ ...prev, isLoading: false, data, error: null }));
            
            // Add to history
            setHistory(prev => {
                const newHistory = [{ term, data }, ...prev.filter(item => item.term.toLowerCase() !== term.toLowerCase())];
                return newHistory.slice(0, 50); // Limit history size
            });

        } catch (err) {
            console.error("Lugat API Error:", err);
            setState(prev => ({...prev, isLoading: false, data: null, error: "Anlam getirilemedi."}));
        }
    }, [history]);

    const deleteFromHistory = useCallback((term: string) => {
        setHistory(prev => prev.filter(item => item.term !== term));
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    const showTooltip = useCallback((term: string, rect: DOMRect) => {
        const historyItem = history.find(item => item.term.toLowerCase() === term.toLowerCase());
        if (historyItem) {
            setTooltipState({
                isOpen: true,
                data: historyItem.data,
                position: { top: rect.top, left: rect.left + rect.width / 2 }
            });
        }
    }, [history]);

    const hideTooltip = useCallback(() => {
        setTooltipState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const value = { showLugatPopup, hideLugat, searchLugatTerm, state, history, deleteFromHistory, clearHistory, showTooltip, hideTooltip };

    return (
        <LugatContext.Provider value={value}>
            {children}
            <LugatBubble />
            <LugatPopup />
            <LugatTooltip state={tooltipState} />
        </LugatContext.Provider>
    );
};
