import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Spinner from './Spinner';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const LocationIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>);
const ImsakIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v.01M6.343 6.343l.01.01M2.25 12h.01M6.343 17.657l.01-.01M12 21v-.01M17.657 17.657l-.01-.01M21.75 12h-.01M17.657 6.343l-.01.01M3.75 12a8.25 8.25 0 0 1 8.25-8.25" /></svg>);
const GunesIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.95-4.243-1.591 1.591M5.25 12H3m4.243-4.95 6.343-6.343M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>);
const OgleIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.95-4.243-1.591 1.591M5.25 12H3m4.243-4.95 6.343-6.343" /></svg>);
const IkindiIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v.01M6.343 6.343l.01.01M2.25 12h.01M6.343 17.657l.01-.01M12 21v-.01M17.657 17.657l-.01-.01M21.75 12h-.01M17.657 6.343l-.01.01M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>);
const AksamIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v.01M6.343 6.343l.01.01M2.25 12h.01M6.343 17.657l.01-.01M12 21v-.01M17.657 17.657l-.01-.01M21.75 12h-.01M17.657 6.343l-.01.01M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" /></svg>);
const YatsiIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25c0 5.385 4.365 9.75 9.75 9.75 2.733 0 5.24-.992 7.152-2.644Z" /></svg>);
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" /></svg>);
const ImportIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>);

interface PrayerTimesData {
    timings: { [key: string]: string };
    date: {
        gregorian: { date: string };
        hijri: { date: string; month: { ar: string, en: string }; weekday: { ar: string, en: string } };
    };
}

interface LocationHistoryItem {
    id: string;
    city: string;
    country: string;
    coords?: { lat: number; lon: number };
}

const hijriMonthMap: { [key: string]: string } = { "Muharram": "Muharrem", "Safar": "Safer", "Rabīʿ al-awwal": "Rebiülevvel", "Rabīʿ al-ākhir": "Rebiülahir", "Jumādá al-ūlá": "Cemaziyelevvel", "Jumādá al-ākhirah": "Cemaziyelahir", "Rajab": "Recep", "Shaʿbān": "Şaban", "Ramaḍān": "Ramazan", "Shawwāl": "Şevval", "Dhū al-Qaʿdah": "Zilkade", "Dhū al-Ḥijjah": "Zilhicce" };
const toArabicNumeral = (n: number | string) => { const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']; return String(n).split('').map(digit => arabicNumerals[parseInt(digit, 10)]).join(''); };
const prayerNameMapping: { [key: string]: { name: string; icon: React.FC } } = { Imsak: { name: "İmsak", icon: ImsakIcon }, Sunrise: { name: "Güneş", icon: GunesIcon }, Dhuhr: { name: "Öğle", icon: OgleIcon }, Asr: { name: "İkindi", icon: IkindiIcon }, Maghrib: { name: "Akşam", icon: AksamIcon }, Isha: { name: "Yatsı", icon: YatsiIcon }, };
const prayerOrder = ["Imsak", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

const NamazVakitleri: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
    const [activeLocation, setActiveLocation] = useState<LocationHistoryItem | null>(null);
    const [history, setHistory] = useState<LocationHistoryItem[]>([]);
    const [countdown, setCountdown] = useState<{ nextPrayer: string; time: string } | null>(null);
    const [activePrayer, setActivePrayer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [manualCity, setManualCity] = useState('');
    const [manualCountry, setManualCountry] = useState('Turkey');

    // History UI state
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [importCode, setImportCode] = useState('');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const calculateCountdown = useCallback(() => {
        if (!prayerData) return;
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        let nextPrayerTime: Date | null = null;
        let nextPrayerName: string | null = null;
        for (const prayer of prayerOrder) {
            const prayerTimeStr = prayerData.timings[prayer];
            if (prayerTimeStr) {
                const prayerDateTime = new Date(`${todayStr}T${prayerTimeStr}:00`);
                if (prayerDateTime > now) {
                    nextPrayerTime = prayerDateTime;
                    nextPrayerName = prayer;
                    break;
                }
            }
        }
        if (!nextPrayerTime) {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const imsakTimeStr = prayerData.timings['Imsak'];
            if (imsakTimeStr) {
                nextPrayerTime = new Date(`${tomorrowStr}T${imsakTimeStr}:00`);
                nextPrayerName = "Imsak";
            }
        }
        if (nextPrayerTime && nextPrayerName) {
            const diff = nextPrayerTime.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setCountdown({ nextPrayer: prayerNameMapping[nextPrayerName].name, time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` });
            let currentActive: string | null = null;
            for (let i = prayerOrder.length - 1; i >= 0; i--) {
                const prayer = prayerOrder[i];
                const prayerTimeStr = prayerData.timings[prayer];
                if (prayerTimeStr) {
                    const prayerDateTime = new Date(`${todayStr}T${prayerTimeStr}:00`);
                    if(prayerDateTime <= now) {
                        currentActive = prayer;
                        break;
                    }
                }
            }
            if(!currentActive) currentActive = "Isha";
            setActivePrayer(currentActive);
        }
    }, [prayerData]);
    
    useEffect(() => {
        const timer = setInterval(calculateCountdown, 1000);
        return () => clearInterval(timer);
    }, [calculateCountdown]);
    
    useEffect(() => {
        try { localStorage.setItem('namazVakitleriHistory', JSON.stringify(history)); } catch(e) { console.error("Failed to save history", e); }
    }, [history]);

    const saveLocationToHistory = (location: Omit<LocationHistoryItem, 'id'>) => {
        setHistory(prev => {
            const existingIndex = prev.findIndex(item => item.city.toLowerCase() === location.city.toLowerCase() && item.country.toLowerCase() === location.country.toLowerCase());
            let newHistory = [...prev];
            const newItem: LocationHistoryItem = { id: Date.now().toString(), ...location };

            if (existingIndex > -1) {
                newHistory.splice(existingIndex, 1);
            }
            newHistory.unshift(newItem);
            if(newHistory.length > 20) newHistory.pop(); // Limit history size
            
            setActiveLocation(newHistory[0]);
            return newHistory;
        });
    };

    const fetchPrayerTimes = async (url: string, locationDataForSave: Omit<LocationHistoryItem, 'id'>) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(url);
            if (response.data.code === 200) {
                setPrayerData(response.data.data);
                saveLocationToHistory(locationDataForSave);
            } else {
                throw new Error("API'den geçerli veri alınamadı.");
            }
        } catch (err) {
            setError("Namaz vakitleri alınamadı. Lütfen konumu kontrol edin veya daha sonra tekrar deneyin.");
            setPrayerData(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchByCoords = async (lat: number, lon: number) => {
        const url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=3`;
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const city = res.data.address.city || res.data.address.town || res.data.address.village || 'Bilinmeyen Şehir';
            const country = res.data.address.country;
            fetchPrayerTimes(url, { city, country, coords: { lat, lon } });
        } catch {
            fetchPrayerTimes(url, { city: 'Konum Bulundu', country: '', coords: { lat, lon } });
        }
    };

    const fetchByCity = (city: string, country: string) => {
        const url = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=3`;
        fetchPrayerTimes(url, { city, country });
    };

    useEffect(() => {
        const storedHistory = localStorage.getItem('namazVakitleriHistory');
        const initialHistory = storedHistory ? JSON.parse(storedHistory) : [];
        setHistory(initialHistory);

        if (initialHistory.length > 0) {
            const lastLocation = initialHistory[0];
            setActiveLocation(lastLocation);
            if(lastLocation.coords) {
                fetchByCoords(lastLocation.coords.lat, lastLocation.coords.lon);
            } else {
                fetchByCity(lastLocation.city, lastLocation.country);
            }
        } else {
             navigator.geolocation.getCurrentPosition(
                (position) => { fetchByCoords(position.coords.latitude, position.coords.longitude); },
                () => { setError("Konum izni reddedildi. Lütfen manuel olarak bir şehir girin."); setIsLoading(false); }
            );
        }
    }, []);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCity) {
            fetchByCity(manualCity, manualCountry);
        }
    };

    const handleHistoryItemClick = (item: LocationHistoryItem) => {
        setActiveLocation(item);
        if(item.coords) {
            fetchByCoords(item.coords.lat, item.coords.lon);
        } else {
            fetchByCity(item.city, item.country);
        }
        setIsHistoryOpen(false);
    };

    const handleDeleteHistoryItem = (e: React.MouseEvent, idToDelete: string) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== idToDelete));
        if (activeLocation?.id === idToDelete) {
            setActiveLocation(null);
            setPrayerData(null);
        }
    };

    const handleShareHistoryItem = (e: React.MouseEvent, item: LocationHistoryItem) => {
        e.stopPropagation();
        const shareData = { city: item.city, country: item.country, coords: item.coords };
        try {
            const jsonString = JSON.stringify(shareData);
            const encodedString = btoa(unescape(encodeURIComponent(jsonString)));
            navigator.clipboard.writeText(encodedString);
            showNotification('Konum kodu panoya kopyalandı!');
        } catch (err) { showNotification('Kod oluşturulurken bir hata oluştu.', 'error'); }
    };

    const handleImportHistory = () => {
        if (!importCode.trim()) return;
        try {
            const decodedString = decodeURIComponent(escape(atob(importCode)));
            const importedItem = JSON.parse(decodedString);
            if (!importedItem.city || !importedItem.country) throw new Error('Invalid code format');
            
            const newLocation: Omit<LocationHistoryItem, 'id'> = {
                city: importedItem.city,
                country: importedItem.country,
                coords: importedItem.coords
            };
            saveLocationToHistory(newLocation);
            setImportCode('');
            showNotification('Konum başarıyla içe aktarıldı!');
            if (newLocation.coords) {
                fetchByCoords(newLocation.coords.lat, newLocation.coords.lon);
            } else {
                fetchByCity(newLocation.city, newLocation.country);
            }
        } catch (err) { showNotification('Geçersiz veya bozuk kod.', 'error'); }
    };
    
    const handleClearHistory = () => {
        setHistory([]);
        setActiveLocation(null);
        setPrayerData(null);
    };

    const renderContent = () => {
        if (isLoading) return <Spinner />;
        if (error && !prayerData) {
            return (
                <div className="text-center p-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    <form onSubmit={handleManualSubmit} className="max-w-sm mx-auto flex flex-col space-y-4">
                         <input type="text" value={manualCity} onChange={(e) => setManualCity(e.target.value)} placeholder="Şehir (örn: Istanbul)" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                         <input type="text" value={manualCountry} onChange={(e) => setManualCountry(e.target.value)} placeholder="Ülke (örn: Turkey)" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                        <button type="submit" className="p-3 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 disabled:bg-teal-400">Vakitleri Getir</button>
                    </form>
                </div>
            );
        }
        if (prayerData) {
            const { timings, date } = prayerData;
            const [day, month, year] = date.gregorian.date.split('-');
            const gregorianDateObj = new Date(`${year}-${month}-${day}T12:00:00Z`);
            const formattedGregorianDate = gregorianDateObj.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            const [hijriDay, , hijriYear] = date.hijri.date.split('-');
            const hijriMonthTurkish = hijriMonthMap[date.hijri.month.en] || date.hijri.month.en;
            const formattedHijriDateTurkish = `${hijriDay} ${hijriMonthTurkish} ${hijriYear}`;
            const arabicHijriDay = toArabicNumeral(hijriDay);
            const arabicHijriYear = toArabicNumeral(hijriYear);
            const formattedHijriDateArabic = `${date.hijri.weekday.ar}، ${arabicHijriDay} ${date.hijri.month.ar} ${arabicHijriYear}`;
            return (
                <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
                    <div className="text-center mb-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        {countdown ? (<> <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{countdown.nextPrayer} Vaktine Kalan Süre</h2> <p className="text-5xl font-mono font-bold my-2 tracking-wider">{countdown.time}</p> </>) : (<h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400">Vakitler Yüklendi</h2>)}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                                <div><p className="font-semibold text-gray-700 dark:text-gray-300">Miladi Takvim</p><p className="text-sm text-gray-600 dark:text-gray-400">{formattedGregorianDate}</p></div>
                                <div><p className="font-semibold text-gray-700 dark:text-gray-300">Hicri Takvim</p><p className="text-sm text-gray-600 dark:text-gray-400">{formattedHijriDateTurkish}</p><p className="text-lg text-gray-500 dark:text-gray-400 font-amiri" dir="rtl">{formattedHijriDateArabic}</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {prayerOrder.map(key => {
                            const prayerInfo = prayerNameMapping[key];
                            if (!prayerInfo) return null;
                            const isActive = activePrayer === key;
                            return (
                                <div key={key} className={`p-4 rounded-lg text-center transition-all duration-300 ${isActive ? 'bg-teal-500 text-white shadow-2xl transform scale-105' : 'bg-white dark:bg-gray-800 shadow-md'}`}>
                                    <div className={`mx-auto mb-2 w-10 h-10 flex items-center justify-center rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}><prayerInfo.icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-teal-500'}`} /></div>
                                    <p className={`font-semibold ${isActive ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{prayerInfo.name}</p>
                                    <p className={`text-2xl font-bold font-mono mt-1 ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{timings[key]}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
             {notification && (<div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 animate-fade-in ${notification.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>{notification.message}</div>)}
             <aside className={`absolute top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out z-30 flex flex-col ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '320px' }}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center"><h2 className="font-bold text-lg">Geçmiş Konumlar</h2><button onClick={() => setIsHistoryOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button></div>
                {history.length > 0 ? (
                    <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                        {history.map(item => (<li key={item.id} className={`rounded-md group relative ${activeLocation?.id === item.id ? 'bg-teal-100 dark:bg-teal-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                            <div className="flex items-center justify-between"><button onClick={() => handleHistoryItemClick(item)} className="flex-1 text-left p-2.5 text-sm truncate" title={`${item.city}, ${item.country}`}>{item.city}, {item.country}</button>
                            <div className="flex items-center space-x-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleShareHistoryItem(e, item)} title="Paylaş" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><ShareIcon className="w-4 h-4 text-gray-500" /></button>
                                <button onClick={(e) => handleDeleteHistoryItem(e, item.id)} title="Sil" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><TrashIcon className="w-4 h-4 text-red-500" /></button>
                            </div></div></li>))}
                    </ul>
                ) : (<div className="flex-1 flex items-center justify-center text-center p-4 text-gray-500"><p>Henüz konum geçmişiniz yok.</p></div>)}
                <div className="p-3 border-t dark:border-gray-700 space-y-2">
                    <div className="flex items-center space-x-2"><input type="text" value={importCode} onChange={(e) => setImportCode(e.target.value)} placeholder="Konum kodunu yapıştırın..." className="flex-1 p-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-1 focus:ring-teal-500 focus:outline-none" /><button onClick={handleImportHistory} className="p-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-teal-400" disabled={!importCode.trim()}><ImportIcon className="w-5 h-5"/></button></div>
                    {history.length > 0 && (<button onClick={handleClearHistory} className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white shadow-sm hover:bg-red-700"><TrashIcon className="w-4 h-4" /><span>Tüm Geçmişi Temizle</span></button>)}
                </div>
            </aside>
            <div className="flex flex-col flex-1 h-screen">
                <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center z-20">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setIsHistoryOpen(true)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><HistoryIcon className="w-5 h-5"/></button>
                        <LocationIcon className="w-6 h-6 text-gray-500"/>
                        <div><h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Namaz Vakitleri</h1><p className="text-sm text-gray-500 dark:text-gray-400">{activeLocation ? `${activeLocation.city}, ${activeLocation.country}` : 'Konum Belirleniyor...'}</p></div>
                    </div>
                    <button onClick={onGoHome} className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"><HomeIcon className="w-5 h-5" /><span>Anasayfa</span></button>
                </header>
                <main className="flex-1 overflow-y-auto flex items-center justify-center">
                   {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default NamazVakitleri;
