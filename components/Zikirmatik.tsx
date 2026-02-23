import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const ListIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
const ResetIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.25a3.375 3.375 0 0 0-3.375-3.375H8.25a3.375 3.375 0 0 0-3.375 3.375v2.25" /></svg>);
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>);
const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);


// --- TYPES & CONSTANTS ---
interface Dhikr {
    id: string;
    text: string;
    count: number;
    target: number;
}

const Zikirmatik: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    const [dhikrList, setDhikrList] = useState<Dhikr[]>([]);
    const [currentDhikrIndex, setCurrentDhikrIndex] = useState<number>(0);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // Form states
    const [newDhikrText, setNewDhikrText] = useState('');
    const [newDhikrTarget, setNewDhikrTarget] = useState(100);
    
    // Editing states
    const [editingDhikrId, setEditingDhikrId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const [editingTarget, setEditingTarget] = useState(100);

    // Load state from localStorage on mount
    useEffect(() => {
        try {
            const savedStateJSON = localStorage.getItem('zikirmatikState');
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                setCurrentDhikrIndex(savedState.currentDhikrIndex || 0);
                setTotalCount(savedState.totalCount || 0);
                setDhikrList(savedState.dhikrList || []);
            }
        } catch (e) {
            console.error("Failed to load Zikirmatik state:", e);
        }
    }, []);

    // Save state to localStorage on change
    useEffect(() => {
        const stateToSave = {
            dhikrList,
            currentDhikrIndex,
            totalCount
        };
        localStorage.setItem('zikirmatikState', JSON.stringify(stateToSave));
    }, [dhikrList, currentDhikrIndex, totalCount]);

    const currentDhikr = useMemo(() => dhikrList[currentDhikrIndex], [dhikrList, currentDhikrIndex]);
    const progress = useMemo(() => currentDhikr ? (currentDhikr.count / currentDhikr.target) * 100 : 0, [currentDhikr]);

    const handleIncrement = useCallback(() => {
        if (!currentDhikr) return;

        setDhikrList(prevList => {
            const newList = [...prevList];
            const newCount = newList[currentDhikrIndex].count + 1;
            newList[currentDhikrIndex] = { ...newList[currentDhikrIndex], count: newCount };
            if (newCount === newList[currentDhikrIndex].target) {
                if (navigator.vibrate) navigator.vibrate(200);
            }
            return newList;
        });
        setTotalCount(prev => prev + 1);
    }, [currentDhikr, currentDhikrIndex]);

    const handleReset = () => {
        if (!currentDhikr) return;
        setDhikrList(prevList => {
            const newList = [...prevList];
            newList[currentDhikrIndex] = { ...newList[currentDhikrIndex], count: 0 };
            return newList;
        });
    };
    
    const handleAddDhikr = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDhikrText.trim() || newDhikrTarget <= 0) return;
        const newDhikr: Dhikr = {
            id: `custom-${Date.now()}`,
            text: newDhikrText,
            count: 0,
            target: newDhikrTarget,
        };
        setDhikrList(prev => [...prev, newDhikr]);
        setNewDhikrText('');
        setNewDhikrTarget(100);
    };

    const handleDeleteDhikr = (idToDelete: string) => {
        const indexToDelete = dhikrList.findIndex(d => d.id === idToDelete);
        if (indexToDelete === -1) return;

        setDhikrList(prev => prev.filter(d => d.id !== idToDelete));
        
        if (currentDhikrIndex === indexToDelete) {
             setCurrentDhikrIndex(0);
        } else if (currentDhikrIndex > indexToDelete) {
            setCurrentDhikrIndex(prev => prev - 1);
        }
    };

    const handleStartEditing = (dhikr: Dhikr) => {
        setEditingDhikrId(dhikr.id);
        setEditingText(dhikr.text);
        setEditingTarget(dhikr.target);
    };

    const handleSaveEdit = (id: string) => {
        if (!editingText.trim() || editingTarget <= 0) return;
        setDhikrList(prev => prev.map(d => 
            d.id === id ? { ...d, text: editingText, target: editingTarget } : d
        ));
        setEditingDhikrId(null);
    };
    
    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
            <header className="flex-shrink-0 p-4 flex justify-between items-center z-20">
                <div>
                    <h1 className="text-2xl font-bold">Zikirmatik</h1>
                    <p className="text-sm text-gray-400">Toplam Zikir: {totalCount}</p>
                </div>
                <button onClick={onGoHome} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-gray-800 shadow-sm hover:bg-gray-700">
                    <HomeIcon className="w-5 h-5" />
                    <span>Anasayfa</span>
                </button>
            </header>
            
            <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
                <div className="w-80 h-80 rounded-full flex items-center justify-center relative">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" fill="transparent" />
                        <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" fill="transparent"
                            className="text-teal-400"
                            strokeDasharray={Math.PI * 108}
                            strokeDashoffset={(Math.PI * 108) * (1 - (progress > 100 ? 100 : progress) / 100)}
                            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                        />
                    </svg>
                    <button 
                        onClick={handleIncrement}
                        disabled={!currentDhikr}
                        className="absolute inset-4 bg-gray-800 rounded-full flex flex-col items-center justify-center cursor-pointer active:bg-gray-700 transition-colors shadow-inner disabled:cursor-not-allowed"
                    >
                        <span className="text-7xl font-mono font-bold">{currentDhikr?.count || 0}</span>
                        <span className="text-lg text-gray-400">/ {currentDhikr?.target || 0}</span>
                    </button>
                </div>
                <h2 className="text-4xl font-amiri text-center mt-8">{currentDhikr?.text || 'Zikir eklemek için listeyi açın.'}</h2>
            </main>

            <footer className="flex-shrink-0 p-4 flex justify-around items-center bg-gray-800/50">
                <button onClick={handleReset} className="flex flex-col items-center text-gray-400 hover:text-white disabled:opacity-50" disabled={!currentDhikr}>
                    <ResetIcon className="w-7 h-7"/>
                    <span className="text-xs mt-1">Sıfırla</span>
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="flex flex-col items-center text-gray-400 hover:text-white">
                    <ListIcon className="w-7 h-7"/>
                    <span className="text-xs mt-1">Liste & Ayarlar</span>
                </button>
            </footer>

            {isSettingsOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsSettingsOpen(false)}>
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h2 className="text-xl font-bold">Liste & Ayarlar</h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-2 rounded-full hover:bg-gray-700"><CloseIcon /></button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Zikirler</h3>
                                {dhikrList.length > 0 ? (
                                    <ul className="space-y-2">
                                        {dhikrList.map((dhikr, index) => (
                                            <li key={dhikr.id} className="bg-gray-700 rounded-lg p-2">
                                                {editingDhikrId === dhikr.id ? (
                                                    <div className="space-y-2">
                                                        <input type="text" value={editingText} onChange={e => setEditingText(e.target.value)} placeholder="Zikir metni" className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md"/>
                                                        <div className="flex items-center gap-2">
                                                          <label htmlFor="edit-target" className="text-sm">Hedef:</label>
                                                          <input type="number" id="edit-target" value={editingTarget} onChange={e => setEditingTarget(parseInt(e.target.value))} min="1" className="w-24 p-2 bg-gray-600 border border-gray-500 rounded-md"/>
                                                          <button onClick={() => handleSaveEdit(dhikr.id)} className="p-2 text-teal-400 hover:text-teal-300"><SaveIcon/></button>
                                                          <button onClick={() => setEditingDhikrId(null)} className="p-2 text-gray-400 hover:text-gray-300"><CloseIcon/></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between">
                                                        <button 
                                                            onClick={() => { setCurrentDhikrIndex(index); setIsSettingsOpen(false); }}
                                                            className={`flex-1 text-left p-2 rounded-lg transition-colors ${currentDhikrIndex === index ? 'font-bold' : ''}`}
                                                        >
                                                            <div className="flex justify-between">
                                                                <span>{dhikr.text}</span>
                                                                <span className="text-gray-400">{dhikr.count} / {dhikr.target}</span>
                                                            </div>
                                                        </button>
                                                        <div className="flex items-center">
                                                            <button onClick={() => handleStartEditing(dhikr)} className="p-2 text-blue-400 hover:text-blue-300"><EditIcon className="w-5 h-5"/></button>
                                                            <button onClick={() => handleDeleteDhikr(dhikr.id)} className="p-2 text-red-500 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-gray-500 py-4">Henüz zikir eklenmedi.</p>
                                )}
                            </div>
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Yeni Zikir Ekle</h3>
                                <form onSubmit={handleAddDhikr} className="space-y-3">
                                    <input type="text" value={newDhikrText} onChange={e => setNewDhikrText(e.target.value)} placeholder="Zikir metni" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500" />
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="target" className="text-sm text-gray-400">Hedef:</label>
                                        <input type="number" id="target" value={newDhikrTarget} onChange={e => setNewDhikrTarget(parseInt(e.target.value))} min="1" className="w-24 p-2 bg-gray-700 border border-gray-600 rounded-md"/>
                                        <button type="submit" className="flex-1 px-4 py-2 bg-teal-600 text-white font-semibold rounded-md hover:bg-teal-700 flex items-center justify-center space-x-2">
                                            <PlusIcon className="w-5 h-5"/>
                                            <span>Ekle</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Zikirmatik;
