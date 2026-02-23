import React from 'react';
import { FONT_LIST } from '../hooks/useQuranSettings';
import type { Reciter } from '../types';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);

interface QuranSettingsModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    reader: string;
    setReader: (reader: string) => void;
    reciterList: Reciter[];
    fontFamily: string;
    setFontFamily: (font: string) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
}

const QuranSettingsModal: React.FC<QuranSettingsModalProps> = ({
    isOpen, setIsOpen, reader, setReader, reciterList, fontFamily, setFontFamily, fontSize, setFontSize
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center animate-fade-in" onClick={() => setIsOpen(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Ayarlar</h3>
                    <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
                </div>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Okuyucu (Kârî)</label>
                        <select value={reader} onChange={e => setReader(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500">
                            {reciterList.length > 0 ? (
                                reciterList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)
                            ) : (
                                <option disabled>Yükleniyor...</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yazı Tipi (Arapça)</label>
                        <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500">
                            {FONT_LIST.map(font => <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>{font.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yazı Tipi Boyutu (Kur'an Görünümü)</label>
                        <div className="flex items-center space-x-4">
                            <input type="range" min="16" max="48" step="2" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full accent-teal-500" />
                            <span className="font-bold w-12 text-right">{fontSize}px</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuranSettingsModal;
