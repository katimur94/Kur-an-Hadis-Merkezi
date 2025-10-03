import React, { createContext, useState, useContext, useCallback, ReactNode, useLayoutEffect, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Spinner from './Spinner';

// --- ICONS ---
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);

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
  position: { top: number; left: number };
}

interface LugatContextType {
  showLugat: (term: string, position: { x: number; y: number }) => void;
  hideLugat: () => void;
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

// --- API & COMPONENT ---
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
const model = 'gemini-2.5-flash';

const LugatPopup: React.FC = () => {
  const { state, hideLugat } = useLugat();
  const { isOpen, term, data, isLoading, error, position } = state;
  const popupRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});


  useLayoutEffect(() => {
    if (isOpen && popupRef.current) {
        const { innerWidth, innerHeight } = window;
        const { clientWidth, clientHeight } = popupRef.current;
        
        let top = position.top + 10;
        let left = position.left - (clientWidth / 2);

        if (left < 10) left = 10;
        if (left + clientWidth > innerWidth - 10) left = innerWidth - clientWidth - 10;
        if (top + clientHeight > innerHeight - 10) top = position.top - clientHeight - 10;
        
        setStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            zIndex: 100,
            opacity: 1,
        });
    } else {
        setStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [isOpen, position]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 animate-fade-in" onClick={hideLugat}></div>
      <div ref={popupRef} style={style} className="lugat-popup w-80 max-w-[90vw] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border border-gray-200 dark:border-gray-700 animate-scale-in transition-opacity duration-200">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 truncate">Lügat: "{term}"</h4>
          <button onClick={hideLugat} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Close popup"><CloseIcon className="w-5 h-5" /></button>
        </div>
        <div className="text-sm min-h-[100px] flex flex-col justify-center">
            {isLoading && <Spinner />}
            {error && <p className="text-center text-red-500">{error}</p>}
            {data && (
                <div className="space-y-3">
                    <div className="pb-2">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.definition}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Kaynak Dil: {data.sourceLanguage}</p>
                    </div>
                    {data.otherMeanings && data.otherMeanings.length > 0 && (
                         <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                            <h5 className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Diğer Mânalar</h5>
                            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                                {data.otherMeanings.map((meaning, i) => <li key={i}>{meaning}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </>
  );
};

// --- PROVIDER ---
export const LugatContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LugatPopupState>({
    isOpen: false, term: null, data: null, isLoading: false, error: null, position: { top: 0, left: 0 }
  });

  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pressPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const longPressTriggeredRef = useRef(false);

  const hideLugat = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  const getLugatDefinition = async (term: string) => {
    try {
      const prompt = `Sen, hem klasik Arapça hem de Osmanlı/Modern Türkçe konusunda uzman bir İslami terminolog ve dilbilimcisin. Şu terim için kısa ve öz bir sözlük tanımı sağla: "${term}". Cevabını JSON formatında yapılandır. Eğer terimin birden fazla farklı anlamı varsa, en yaygın olanını ana 'definition' olarak ver ve diğerlerini 'otherMeanings' dizisinde listele. Başka anlamı yoksa, dizi boş olmalıdır. Ayrıca, kelimenin köken dilinin öncelikli olarak 'Arapça', 'Türkçe' veya 'Farsça' vb. olup olmadığını belirten bir 'sourceLanguage' alanı ekle. TÜM CEVAPLARIN VE AÇIKLAMALARIN TÜRKÇE OLMALIDIR.`;
      
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
      setState(prev => ({...prev, isLoading: false, error: "Anlam getirilemedi."}));
    }
  };

  const showLugat = useCallback((term: string, position: { x: number; y: number }) => {
    if (state.isOpen && state.term === term) return;

    setState({
      isOpen: true,
      term,
      data: null,
      isLoading: true,
      error: null,
      position: { top: position.y, left: position.x }
    });
    getLugatDefinition(term);
  }, [state.isOpen, state.term]);
  
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
        // Only trigger for primary pointer (main finger, left mouse button)
        if (!event.isPrimary) return;

        // Don't trigger if clicking inside an already open popup
        if ((event.target as Element).closest('.lugat-popup')) return;
        
        // Store the position where the press started
        pressPositionRef.current = { x: event.clientX, y: event.clientY };
        longPressTriggeredRef.current = false;

        // Start a timer for the long press
        longPressTimeoutRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true;
            const selection = window.getSelection();
            const selectedText = selection?.toString().trim();

            if (selectedText) {
                showLugat(selectedText, pressPositionRef.current);
            }
        }, 2000); // 2-second delay
    };

    const handlePointerUp = () => {
        // If the user releases before the timeout, it's not a long press
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
        }
    };
    
    const handleContextMenu = (event: MouseEvent) => {
        // If our long press was triggered, prevent the browser's default context menu
        if (longPressTriggeredRef.current) {
            event.preventDefault();
        }
    };
    
    const handleClick = (event: MouseEvent) => {
      // If the popup is open and the click is outside, close it.
      if (state.isOpen && !(event.target as Element).closest('.lugat-popup')) {
        hideLugat();
      }
    };

    // Add event listeners to the whole document
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);

    // Cleanup listeners on component unmount
    return () => {
        document.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('click', handleClick);
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
        }
    };
  }, [showLugat, hideLugat, state.isOpen]);

  return (
    <LugatContext.Provider value={{ showLugat, hideLugat, state }}>
      {children}
      <LugatPopup />
    </LugatContext.Provider>
  );
};
