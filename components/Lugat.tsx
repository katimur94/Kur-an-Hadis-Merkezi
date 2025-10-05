
import React, { createContext, useState, useContext, useCallback, ReactNode, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Spinner from './Spinner';

// --- ICONS ---
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const BookOpenIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>);
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>);


// --- TYPES ---
interface LugatData {
  definition: string;
  sourceLanguage: string;
  otherMeanings: string[];
}

interface LugatPopupState {
  isOpen: boolean;
  term: string | null;
  data: LugatData | null;
  isLoading: boolean;
  error: string | null;
}

interface LugatContextType {
  showLugatPopup: () => void;
  hideLugat: () => void;
  searchLugatTerm: (term: string) => void;
  state: LugatPopupState;
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

// --- COMPONENTS ---

const LugatBubble: React.FC = () => {
    const { showLugatPopup } = useLugat();
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 80 });
    const isDragging = useRef(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
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
        dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        hasMoved.current = true;
        let newX = e.clientX - dragStartPos.current.x;
        let newY = e.clientY - dragStartPos.current.y;
        
        // Clamp position within viewport
        newX = Math.max(10, Math.min(newX, window.innerWidth - 60));
        newY = Math.max(10, Math.min(newY, window.innerHeight - 60));

        setPosition({ x: newX, y: newY });
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
            style={{ top: position.y, left: position.x }}
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
  const { state, hideLugat, searchLugatTerm } = useLugat();
  const { isOpen, term, data, isLoading, error } = state;
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim()) {
          searchLugatTerm(inputValue.trim());
      }
  };

  useEffect(() => {
    // When the popup is closed, clear the input field for the next time it opens.
    if (!isOpen) {
        setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

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
        <div className="min-h-[150px] flex flex-col justify-center">
            {isLoading ? <Spinner /> :
             error ? <p className="text-center text-red-500">{error}</p> :
             data ? (
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
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <label htmlFor="lugat-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">Anlamını öğrenmek istediğiniz kelimeyi veya tabiri yazın.</label>
                    <div className="flex space-x-2">
                        <input
                            id="lugat-input"
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            placeholder="Örn: İhlas, Takva..."
                            className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500"
                            autoFocus
                        />
                         <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 disabled:bg-teal-400 transition-colors flex items-center justify-center" disabled={!inputValue.trim()}>
                            <SearchIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};

// --- PROVIDER ---
export const LugatContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LugatPopupState>({
    isOpen: false, term: null, data: null, isLoading: false, error: null
  });

  const hideLugat = useCallback(() => {
    setState({ isOpen: false, term: null, data: null, isLoading: false, error: null });
  }, []);

  const showLugatPopup = useCallback(() => {
      setState(prev => ({ ...prev, isOpen: true }));
  }, []);
  
  const searchLugatTerm = useCallback(async (term: string) => {
    setState(prev => ({ ...prev, isLoading: true, term, data: null, error: null }));
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
    } catch (err) {
      console.error("Lugat API Error:", err);
      setState(prev => ({...prev, isLoading: false, data: null, error: "Anlam getirilemedi."}));
    }
  }, []);

  const value = { showLugatPopup, hideLugat, searchLugatTerm, state };

  return (
    <LugatContext.Provider value={value}>
      {children}
      <LugatBubble />
      <LugatPopup />
    </LugatContext.Provider>
  );
};
