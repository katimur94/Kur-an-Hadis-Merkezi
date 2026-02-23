import React, { useState, useEffect } from 'react';

// --- ICONS ---
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.375 0-9.375 0" /></svg>);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>);
const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>);
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>);

interface Note {
    id: string;
    text: string;
    date: string;
    sourceModule?: string;
}

interface Bookmark {
    ayahNumber: number;
    surahName: string;
    numberInSurah: number;
    page: number;
}

interface GlobalNotesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GlobalNotesModal: React.FC<GlobalNotesModalProps> = ({ isOpen, onClose }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [newNoteText, setNewNoteText] = useState("");
    const [newNoteCategory, setNewNoteCategory] = useState("");
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editNoteText, setEditNoteText] = useState("");
    const [editNoteCategory, setEditNoteCategory] = useState("");

    const loadData = () => {
        const existingNotesStr = localStorage.getItem('dijitalMedreseNotes');
        if (existingNotesStr) {
            try {
                setNotes(JSON.parse(existingNotesStr));
            } catch (e) {
                console.error("Failed to parse notes");
            }
        } else {
            setNotes([]);
        }

        const existingBmStr = localStorage.getItem('quranBookmarks');
        if (existingBmStr) {
            try {
                setBookmarks(JSON.parse(existingBmStr));
            } catch (e) {
                console.error("Failed to parse bookmarks");
            }
        } else {
            setBookmarks([]);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadData();
        }

        const handleDataUpdated = () => {
            if (isOpen) loadData();
        };

        window.addEventListener('notesUpdated', handleDataUpdated);
        // We'll also listen for local storage changes so if they bookmarked in quran view it updates
        window.addEventListener('storage', handleDataUpdated);
        return () => {
            window.removeEventListener('notesUpdated', handleDataUpdated);
            window.removeEventListener('storage', handleDataUpdated);
        };
    }, [isOpen]);

    const handleDeleteNote = (id: string) => {
        const updatedNotes = notes.filter(n => n.id !== id);
        setNotes(updatedNotes);
        localStorage.setItem('dijitalMedreseNotes', JSON.stringify(updatedNotes));
    };

    const handleDeleteBookmark = (ayahNumber: number) => {
        const updatedBm = bookmarks.filter(b => b.ayahNumber !== ayahNumber);
        setBookmarks(updatedBm);
        localStorage.setItem('quranBookmarks', JSON.stringify(updatedBm));
    };

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleNavigateToQuran = (page: number, ayahNumber: number) => {
        onClose();
        // Dispatch custom event to App.tsx
        window.dispatchEvent(new CustomEvent('navigateToQuran', { detail: { page, ayahNumber } }));
    };

    const clearAll = () => {
        if (window.confirm("Tüm notları ve Kur'an yer imlerini silmek istediğinize emin misiniz?")) {
            setNotes([]);
            setBookmarks([]);
            localStorage.removeItem('dijitalMedreseNotes');
            localStorage.removeItem('quranBookmarks');
        }
    };

    const handleAddNote = () => {
        if (!newNoteText.trim()) return;
        const note: Note = {
            id: Date.now().toString(),
            text: newNoteText.trim(),
            date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            sourceModule: newNoteCategory.trim() || 'Kendi Notlarım'
        };
        const updatedNotes = [note, ...notes];
        setNotes(updatedNotes);
        localStorage.setItem('dijitalMedreseNotes', JSON.stringify(updatedNotes));
        setNewNoteText("");
        setNewNoteCategory("");
        setIsAddingNote(false);
    };

    const startEditing = (note: Note) => {
        setEditingNoteId(note.id);
        setEditNoteText(note.text);
        setEditNoteCategory(note.sourceModule || "Genel");
    };

    const handleSaveEdit = (id: string) => {
        if (!editNoteText.trim()) return;
        const updatedNotes = notes.map(n =>
            n.id === id ? { ...n, text: editNoteText.trim(), sourceModule: editNoteCategory.trim() || 'Kendi Notlarım' } : n
        );
        setNotes(updatedNotes);
        localStorage.setItem('dijitalMedreseNotes', JSON.stringify(updatedNotes));
        setEditingNoteId(null);
    };

    if (!isOpen) return null;

    // Group text notes by module
    const groupedNotes = notes.reduce((acc, note) => {
        const category = note.sourceModule || "Genel";
        if (!acc[category]) acc[category] = [];
        acc[category].push(note);
        return acc;
    }, {} as Record<string, Note[]>);

    return (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h2 className="text-xl font-bold flex items-center text-gray-800 dark:text-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2 text-amber-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>
                        Notlarım & Yer İmleri
                    </h2>
                    <div className="flex space-x-2 items-center">
                        <button onClick={() => setIsAddingNote(!isAddingNote)} className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition">
                            {isAddingNote ? 'İptal' : '+ Yeni Not'}
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {isAddingNote && (
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-teal-200 dark:border-teal-700 animate-scale-in">
                            <h3 className="font-semibold text-teal-800 dark:text-teal-300 mb-3">Yeni Not Ekle</h3>
                            <textarea
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                                placeholder="Notunuzu buraya yazın..."
                                className="w-full h-24 p-3 border border-teal-200 dark:border-teal-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100 mb-3 resize-none"
                            />
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    list="categoryList"
                                    value={newNoteCategory}
                                    onChange={(e) => setNewNoteCategory(e.target.value)}
                                    placeholder="Kategori (örn: Fıkıh, Tefekkür...)"
                                    className="flex-1 p-2 border border-teal-200 dark:border-teal-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
                                />
                                <datalist id="categoryList">
                                    {Object.keys(groupedNotes).map(cat => <option key={cat} value={cat} />)}
                                </datalist>
                                <button
                                    onClick={handleAddNote}
                                    disabled={!newNoteText.trim()}
                                    className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    )}

                    {notes.length === 0 && bookmarks.length === 0 && !isAddingNote ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 py-10">
                            <p className="text-lg">Henüz hiç not almadınız.</p>
                            <p className="text-sm mt-2 text-center max-w-md">Yukarıdaki "Yeni Not" butonunu kullanarak kendi notlarınızı ekleyebilir veya metinlerin üzerini seçtiğinizde çıkan menüden buraya kaydedebilirsiniz.</p>
                        </div>
                    ) : (
                        <>
                            {/* QURAN BOOKMARKS */}
                            {bookmarks.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 border-b border-teal-200 dark:border-teal-900 pb-1">
                                        Kur'an Yer İmleri ({bookmarks.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {bookmarks.map(bm => (
                                            <div key={`bm-${bm.ayahNumber}`} className="bg-teal-50 dark:bg-teal-900/10 rounded-lg p-3 border border-teal-100 dark:border-teal-900/50 shadow-sm flex items-center justify-between group">
                                                <div>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                                                        {bm.surahName} {bm.numberInSurah}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Sayfa: {bm.page}
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleNavigateToQuran(bm.page, bm.ayahNumber)}
                                                        className="p-1.5 text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/50 bg-white dark:bg-gray-800 shadow-sm rounded-md transition-colors"
                                                        title="Ayet'e Git"
                                                    >
                                                        <ArrowRightIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCopy(`bm-${bm.ayahNumber}`, `${bm.surahName} Suresi ${bm.numberInSurah}. Ayet (Sayfa ${bm.page})`)}
                                                        className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 bg-white dark:bg-gray-800 shadow-sm rounded-md transition-colors"
                                                        title="Kopyala"
                                                    >
                                                        {copiedId === `bm-${bm.ayahNumber}` ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBookmark(bm.ayahNumber)}
                                                        className="p-1.5 text-red-400 hover:text-red-600 bg-white dark:bg-gray-800 shadow-sm rounded-md transition-colors"
                                                        title="Sil"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* OTHER MODULE NOTES */}
                            {Object.keys(groupedNotes).map(category => (
                                <div key={category} className="space-y-3 pt-2">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 border-b border-amber-200 dark:border-amber-900/50 pb-1">
                                        {category} ({groupedNotes[category].length})
                                    </h3>
                                    <div className="space-y-3">
                                        {groupedNotes[category].map(note => (
                                            <div key={note.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700 shadow-sm relative group">
                                                {editingNoteId === note.id ? (
                                                    <div className="space-y-3">
                                                        <textarea
                                                            value={editNoteText}
                                                            onChange={(e) => setEditNoteText(e.target.value)}
                                                            placeholder="Notunuzu düzenleyin..."
                                                            className="w-full min-h-[100px] p-3 border border-amber-300 dark:border-amber-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100 resize-y"
                                                        />
                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                            <input
                                                                type="text"
                                                                list="categoryList"
                                                                value={editNoteCategory}
                                                                onChange={(e) => setEditNoteCategory(e.target.value)}
                                                                placeholder="Kategori"
                                                                className="flex-1 p-2 border border-amber-300 dark:border-amber-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
                                                            />
                                                            <div className="flex space-x-2">
                                                                <button onClick={() => setEditingNoteId(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">İptal</button>
                                                                <button onClick={() => handleSaveEdit(note.id)} disabled={!editNoteText.trim()} className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors">Kaydet</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-medium">
                                                            "{note.text}"
                                                        </p>
                                                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-600">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {note.date}
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => startEditing(note)}
                                                                    className="p-1.5 text-blue-500 hover:text-blue-700 bg-white dark:bg-gray-800 shadow-sm rounded-md transition-colors"
                                                                    title="Düzenle"
                                                                >
                                                                    <EditIcon className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCopy(note.id, note.text)}
                                                                    className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 bg-white dark:bg-gray-800 shadow-sm rounded-md transition-colors"
                                                                    title="Kopyala"
                                                                >
                                                                    {copiedId === note.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteNote(note.id)}
                                                                    className="p-1.5 text-red-400 hover:text-red-600 bg-white dark:bg-gray-800 shadow-sm rounded-md transition-colors"
                                                                    title="Sil"
                                                                >
                                                                    <TrashIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {(notes.length > 0 || bookmarks.length > 0) && (
                    <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
                        <button
                            onClick={clearAll}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            <span>Tümünü Temizle</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
