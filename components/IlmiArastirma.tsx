import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import * as htmlToImage from 'html-to-image';
import * as pako from 'pako';
import Spinner from './Spinner';
import { HighlightableText } from './Lugat';
import type { ArastirmaRaporu, IlmiArastirmaHistoryItem as HistoryItem } from '../types';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" /><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949a.75.75 0 0 0 .596.596l4.95 1.414a.75.75 0 0 0 .949-.826L10.11 3.105a.75.75 0 0 0-.826-.95L3.105 2.289Z" clipRule="evenodd" /></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.375 0-9.375 0" /></svg>);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>);
const FileIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>);
const MiniSpinner: React.FC = () => <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>;
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>);
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" /></svg>);

const loadingMessages = [
    "Kur'an-ı Kerim'den ilgili ayetler taranıyor...",
    "Hadis-i Şerif kaynakları inceleniyor...",
    "Şu anda Fıkıh hükümlerini dört mezhepten topluyoruz...",
    "Risale-i Nur Külliyatı'ndan perspektifler alınıyor...",
    "Konuyla ilgili dualar derleniyor...",
    "Raporun son hali oluşturuluyor..."
];

type Message = { role: 'user', content: string } | { role: 'model', content: ArastirmaRaporu };

const IlmiArastirma: React.FC<{ onGoHome: () => void; }> = ({ onGoHome }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
    const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [sharingId, setSharingId] = useState<string | null>(null);
    const [exportingState, setExportingState] = useState<{ index: number; type: 'copy' | 'png' | 'pdf' } | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const raporRefs = useRef<(HTMLDivElement | null)[]>([]);
    const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });

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
        try {
            const storedHistory = localStorage.getItem('ilmiArastirmaHistory');
            if (storedHistory) setHistory(JSON.parse(storedHistory));

            const importedDataString = sessionStorage.getItem('importedDataFor_ilmi-arastirma');
            if (importedDataString) {
                sessionStorage.removeItem('importedDataFor_ilmi-arastirma');
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
        localStorage.setItem('ilmiArastirmaHistory', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (isLoading) {
            let messageIndex = 0;
            setCurrentLoadingMessage(loadingMessages[0]);
            loadingIntervalRef.current = setInterval(() => {
                messageIndex = (messageIndex + 1) % loadingMessages.length;
                setCurrentLoadingMessage(loadingMessages[messageIndex]);
            }, 2500);
        } else if (loadingIntervalRef.current) {
            clearInterval(loadingIntervalRef.current);
        }
        return () => {
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        };
    }, [isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;
        
        setActiveHistoryId(null);
        const newUserMessage: Message = { role: 'user', content: userInput };
        setMessages([newUserMessage]);
        
        await getAIResponse(userInput);
        setUserInput('');
    };

    const getAIResponse = async (query: string) => {
        setIsLoading(true);
        setError(null);

        const prompt = `Sen kapsamlı bir İslam alimi ve araştırmacısısın. Kullanıcının sorduğu "${query}" konusunu, İslam'ın temel kaynakları olan Kur'an, Sünnet, Fıkıh (Dört Mezhep), Risale-i Nur ve dua literatürünü kullanarak derinlemesine analiz et. Amacın, tüm bu kaynaklardan elde edilen bilgileri birleştirerek tek, bütüncül ve son derece detaylı bir rapor oluşturmak. Raporun bölümlerini DOLDURMAK ZORUNDADIR. Eğer bir bölüm için yeterli bilgi bulamazsan, o bölüm için boş bir dizi [] veya boş bir obje {} döndür ama anahtarı (key) asla yanıttan çıkarma. Cevabını SADECE JSON formatında ver.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema: { /* Schema from previous version */ type: Type.OBJECT, properties: { konuBasligi: { type: Type.STRING }, girisOzeti: { type: Type.STRING }, adimAdimAnlatim: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { adim: { type: Type.STRING }, aciklama: { type: Type.STRING } } } }, kuranDelilleri: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { referans: { type: Type.STRING }, arapca: { type: Type.STRING }, meal: { type: Type.STRING } } } }, hadisDelilleri: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { kaynak: { type: Type.STRING }, arapca: { type: Type.STRING }, turkce: { type: Type.STRING } } } }, fikihHukumleri: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { mezhep: { type: Type.STRING }, hukum: { type: Type.STRING }, kaynak: { type: Type.STRING } } } }, risaleINurPerspektifi: { type: Type.OBJECT, properties: { ozet: { type: Type.STRING }, iktibaslar: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { metin: { type: Type.STRING }, kaynak: { type: Type.STRING } } } } } }, ilgiliDualar: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { arapca: { type: Type.STRING }, okunus: { type: Type.STRING }, anlam: { type: Type.STRING }, kaynak: { type: Type.STRING } } } } } } }
            });
            const data: ArastirmaRaporu = JSON.parse(response.text.trim());
            const newAiMessage: Message = { role: 'model', content: data };
            setMessages(prev => [...prev, newAiMessage]);
            
            const newHistoryItem: HistoryItem = { id: Date.now().toString(), question: query, response: data };
            setHistory(prev => [newHistoryItem, ...prev]);
            setActiveHistoryId(newHistoryItem.id);

        } catch (err) {
            setError("Araştırma yapılırken bir hata oluştu. Lütfen daha spesifik bir soruyla tekrar deneyin.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // History Management
    const handleClearHistory = () => { setHistory([]); setMessages([]); setActiveHistoryId(null); };
    const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setHistory(prev => prev.filter(i => i.id !== id)); if (activeHistoryId === id) { setMessages([]); setActiveHistoryId(null); } };
    const handleEditHistoryItem = (e: React.MouseEvent, item: HistoryItem) => { e.stopPropagation(); setEditingHistoryId(item.id); setEditingTitle(item.customTitle || item.question); };
    const handleSaveHistoryTitle = (id: string) => { setHistory(prev => prev.map(i => i.id === id ? { ...i, customTitle: editingTitle } : i)); setEditingHistoryId(null); };
    const handleShareHistoryItem = async (e: React.MouseEvent, item: HistoryItem) => {
        e.stopPropagation();
        setSharingId(item.id);
        try {
            const jsonString = JSON.stringify(item);
            const compressed = pako.deflate(jsonString);
            let binaryString = '';
            for (let i = 0; i < compressed.length; i++) binaryString += String.fromCharCode(compressed[i]);
            const encodedData = btoa(binaryString);
            const shareUrl = `${window.location.origin}${window.location.pathname}#/?module=ilmi-arastirma&v=2&data=${encodeURIComponent(encodedData)}`;
            navigator.clipboard.writeText(shareUrl);
            showNotification('Paylaşım linki kopyalandı!');
        } catch (err) {
            showNotification('Link oluşturulurken hata oluştu.', 'error');
        } finally {
            setSharingId(null);
        }
    };
    
    // Export Functions
    const handleExport = async (index: number, type: 'copy' | 'png' | 'pdf') => {
        setExportingState({ index, type });
        const message = messages[index];
        if (message.role !== 'model') return;
        const rapor = message.content;

        if (type === 'copy') {
             let text = `KONU: ${rapor.konuBasligi}\n\n== ÖZET ==\n${rapor.girisOzeti}\n\n`;
            if (rapor.adimAdimAnlatim?.length) { text += `== ADIM ADIM UYGULAMA ==\n`; rapor.adimAdimAnlatim.forEach(i => text += `* ${i.adim}:\n${i.aciklama}\n\n`); }
            if (rapor.kuranDelilleri?.length) { text += `== KUR'AN'DAN DELİLLER ==\n`; rapor.kuranDelilleri.forEach(i => text += `- ${i.meal} (${i.referans})\n`); text += `\n`; }
            if (rapor.hadisDelilleri?.length) { text += `== HADİS-İ ŞERİFLERDEN DELİLLER ==\n`; rapor.hadisDelilleri.forEach(i => text += `- ${i.turkce} (Kaynak: ${i.kaynak})\n`); text += `\n`; }
            if (rapor.fikihHukumleri?.length) { text += `== FIKIH HÜKÜMLERİ (MEZHEPLERE GÖRE) ==\n`; rapor.fikihHukumleri.forEach(i => text += `* ${i.mezhep}:\n${i.hukum} (Kaynak: ${i.kaynak})\n\n`); }
            if (rapor.risaleINurPerspektifi) { text += `== RİSALE-İ NUR PERSPEKTİFİ ==\n${rapor.risaleINurPerspektifi.ozet}\n`; rapor.risaleINurPerspektifi.iktibaslar.forEach(i => text += `\n> "${i.metin}" (${i.kaynak})\n`); text += `\n`; }
            if (rapor.ilgiliDualar?.length) { text += `== İLGİLİ DUALAR ==\n`; rapor.ilgiliDualar.forEach(i => text += `- ${i.anlam} (Okunuşu: ${i.okunus})\n`); }
            navigator.clipboard.writeText(text).then(() => { setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); }).finally(() => setExportingState(null));
        } else if (type === 'png') {
            const node = raporRefs.current[index];
            if (!node) { setExportingState(null); return; }
            try {
                const dataUrl = await htmlToImage.toPng(node, { quality: 0.98, pixelRatio: 2 });
                const link = document.createElement('a');
                link.download = `ilmi-arastirma-${rapor.konuBasligi.replace(/\s/g, '_')}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) { setError("PNG oluşturulamadı."); } finally { setExportingState(null); }
        } else if (type === 'pdf') {
             const node = raporRefs.current[index];
            if (!node) { setExportingState(null); return; }
            try {
                const canvas = await html2canvas(node, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = pdf.internal.pageSize.getHeight();
                const ratio = canvas.width / pdfWidth; const imgHeight = canvas.height / ratio;
                let heightLeft = imgHeight; let position = 0;
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight); heightLeft -= pdfHeight;
                while (heightLeft > 0) { position = heightLeft - imgHeight; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight); heightLeft -= pdfHeight; }
                pdf.save(`ilmi-arastirma-${rapor.konuBasligi.replace(/\s/g, '_')}.pdf`);
            } catch (err) { setError("PDF oluşturulamadı."); } finally { setExportingState(null); }
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
            {notification && (<div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 animate-fade-in ${notification.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>{notification.message}</div>)}
            
            <aside className={`absolute top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out z-30 flex flex-col ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '320px' }}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center"><h2 className="font-bold text-lg">Geçmiş Aramalar</h2><button onClick={() => setIsHistoryOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button></div>
                {history.length > 0 ? (<ul className="flex-1 overflow-y-auto p-2 space-y-1">{history.map(item => (<li key={item.id} className={`rounded-md group relative ${activeHistoryId === item.id ? 'bg-teal-100 dark:bg-teal-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>{editingHistoryId === item.id ? (<div className="p-2.5"><input type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveHistoryTitle(item.id)} className="w-full text-sm p-1 border rounded dark:bg-gray-800 dark:border-gray-600" autoFocus /><div className="flex justify-end space-x-2 mt-2"><button onClick={() => setEditingHistoryId(null)} className="text-xs px-2 py-1">İptal</button><button onClick={() => handleSaveHistoryTitle(item.id)} className="text-xs px-2 py-1 bg-teal-600 text-white rounded">Kaydet</button></div></div>) : (<div className="flex items-center justify-between"><button onClick={() => handleHistoryItemClick(item)} className="flex-1 text-left p-2.5 text-sm truncate" title={item.customTitle || item.question}>{item.customTitle || item.question}</button><div className="flex items-center space-x-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => handleEditHistoryItem(e, item)} title="Yeniden Adlandır" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><EditIcon className="w-4 h-4 text-gray-500" /></button><button onClick={(e) => handleShareHistoryItem(e, item)} title="Paylaş" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" disabled={sharingId === item.id}>{sharingId === item.id ? <MiniSpinner /> : <ShareIcon className="w-4 h-4 text-gray-500" />}</button><button onClick={(e) => handleDeleteHistoryItem(e, item.id)} title="Sil" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><TrashIcon className="w-4 h-4 text-red-500" /></button></div></div>)}</li>))}</ul>) : (<div className="flex-1 flex items-center justify-center text-center p-4 text-gray-500"><p>Henüz arama geçmişiniz yok.</p></div>)}
                <div className="p-3 border-t dark:border-gray-700">{history.length > 0 && (<button onClick={handleClearHistory} className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white shadow-sm hover:bg-red-700"><TrashIcon className="w-4 h-4" /><span>Tüm Geçmişi Temizle</span></button>)}</div>
            </aside>

            <div className="flex flex-col flex-1 h-screen">
                <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center z-20">
                    <div className="flex items-center space-x-2"><button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><HistoryIcon className="w-5 h-5" /></button><div><h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">İlmî Araştırma</h1><p className="text-sm text-gray-500 dark:text-gray-400">Tüm kaynaklardan kapsamlı cevaplar.</p></div></div>
                    <button onClick={onGoHome} className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"><HomeIcon className="w-5 h-5" /><span>Anasayfa</span></button>
                </header>

                <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {messages.length === 0 && !isLoading && (<div className="text-center text-gray-500 dark:text-gray-400 pt-16"><p className="text-lg">Kapsamlı bir araştırma yapmak için soru sorun.</p><p className="text-sm">Örn: "Abdest nasıl alınır?"</p></div>)}
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'user' ? (<div className="max-w-lg lg:max-w-2xl px-4 py-3 rounded-xl bg-teal-500 text-white shadow-md">{msg.content}</div>
                            ) : (<div className="max-w-4xl w-full mx-auto">
                                <div className="sticky top-2 z-10 mb-4 flex flex-wrap gap-2 justify-center p-2 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border dark:border-gray-700">
                                    <button onClick={() => handleExport(index, 'copy')} disabled={!!exportingState} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">{exportingState?.index === index && exportingState.type === 'copy' ? <MiniSpinner /> : copiedIndex === index ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />} {copiedIndex === index ? 'Kopyalandı' : 'Kopyala'}</button>
                                    <button onClick={() => handleExport(index, 'png')} disabled={!!exportingState} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">{exportingState?.index === index && exportingState.type === 'png' ? <MiniSpinner /> : <DownloadIcon className="w-5 h-5" />} PNG İndir</button>
                                    <button onClick={() => handleExport(index, 'pdf')} disabled={!!exportingState} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">{exportingState?.index === index && exportingState.type === 'pdf' ? <MiniSpinner /> : <FileIcon className="w-5 h-5" />} PDF İndir</button>
                                </div>
                                <div ref={el => raporRefs.current[index] = el} className="p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg"><h1 className="text-4xl font-bold text-center mb-8 text-teal-600 dark:text-teal-400">{msg.content.konuBasligi}</h1><section className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><h2 className="text-2xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">Özet</h2><p className="text-lg leading-relaxed"><HighlightableText>{msg.content.girisOzeti}</HighlightableText></p></section>{msg.content.adimAdimAnlatim?.length && <section className="mb-8"><h2 className="text-2xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">Adım Adım Uygulama</h2><ol className="list-decimal list-inside space-y-4">{msg.content.adimAdimAnlatim.map((item, i) => (<li key={i} className="text-lg"><strong className="font-semibold">{item.adim}:</strong> <HighlightableText>{item.aciklama}</HighlightableText></li>))}</ol></section>}{msg.content.kuranDelilleri?.length && <section className="mb-8"><h2 className="text-2xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">Kur'an'dan Deliller</h2>{msg.content.kuranDelilleri.map((item, i) => (<div key={i} className="p-4 mb-4 border-r-4 border-green-500 bg-green-50 dark:bg-gray-700/50 rounded-r-lg"><p dir="rtl" className="font-amiri text-2xl text-right mb-2">{item.arapca}</p><p className="italic">"<HighlightableText>{item.meal}</HighlightableText>"</p><p className="text-right text-sm font-semibold mt-2">{item.referans}</p></div>))}</section>}{msg.content.hadisDelilleri?.length && <section className="mb-8"><h2 className="text-2xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">Hadis-i Şeriflerden Deliller</h2>{msg.content.hadisDelilleri.map((item, i) => (<div key={i} className="p-4 mb-4 border-r-4 border-blue-500 bg-blue-50 dark:bg-gray-700/50 rounded-r-lg">{item.arapca && <p dir="rtl" className="font-amiri text-xl text-right mb-2">{item.arapca}</p>}<p className="italic">"<HighlightableText>{item.turkce}</HighlightableText>"</p><p className="text-right text-sm font-semibold mt-2">{item.kaynak}</p></div>))}</section>}{msg.content.fikihHukumleri?.length && <section className="mb-8"><h2 className="text-2xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">Fıkıh Hükümleri (Mezheplere Göre)</h2><div className="grid md:grid-cols-2 gap-4">{msg.content.fikihHukumleri.map((item, i) => (<div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><h3 className="font-bold text-lg text-teal-600 dark:text-teal-400">{item.mezhep}</h3><p className="mt-2"><HighlightableText>{item.hukum}</HighlightableText></p><p className="text-right text-xs font-mono text-gray-500 dark:text-gray-400 mt-2">Kaynak: {item.kaynak}</p></div>))}</div></section>}{msg.content.risaleINurPerspektifi && <section className="mb-8"><h2 className="text-2xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">Risale-i Nur Perspektifi</h2><p className="italic mb-4"><HighlightableText>{msg.content.risaleINurPerspektifi.ozet}</HighlightableText></p>{msg.content.risaleINurPerspektifi.iktibaslar.map((item, i) => (<div key={i} className="p-4 border-r-4 border-purple-500 bg-purple-50 dark:bg-gray-700/50 rounded-r-lg"><p className="leading-relaxed">"<HighlightableText>{item.metin}</HighlightableText>"</p><p className="text-right text-sm font-semibold mt-2">{item.kaynak}</p></div>))}</section>}{msg.content.ilgiliDualar?.length && <section><h2 className="text-2xl font-semibold mb-4 border-b-2 border-teal-500 pb-2">İlgili Dualar</h2>{msg.content.ilgiliDualar.map((item, i) => (<div key={i} className="p-4 mb-4 border-r-4 border-amber-500 bg-amber-50 dark:bg-gray-700/50 rounded-r-lg"><p dir="rtl" className="font-amiri text-2xl text-right mb-2">{item.arapca}</p><p className="italic text-sm text-gray-500 dark:text-gray-400 text-right mb-2">{item.okunus}</p><p className="italic">"<HighlightableText>{item.anlam}</HighlightableText>"</p><p className="text-right text-sm font-semibold mt-2">{item.kaynak}</p></div>))}</section>}</div>
                            </div>)}
                        </div>
                    ))}
                    {isLoading && (<div className="flex justify-start"><div className="max-w-md w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 shadow-md"><div className="flex items-center space-x-4"><Spinner /><p className="text-gray-600 dark:text-gray-400">{currentLoadingMessage}</p></div></div></div>)}
                    {error && <p className="text-center text-red-500">{error}</p>}
                </main>

                <footer className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-20">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3 max-w-4xl mx-auto">
                        <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Bir konu araştırın (örn: Abdest nasıl alınır?)..." className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" disabled={isLoading} />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="p-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-colors"><SendIcon className="w-6 h-6" /></button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default IlmiArastirma;
