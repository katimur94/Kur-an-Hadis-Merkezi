import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as pako from 'pako';

// --- ICONS ---
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>);
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>);
const Spinner: React.FC = () => (<div className="flex justify-center items-center p-8"><div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>);
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" /></svg>);
const LocationMarkerIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>);
const MiniSpinner: React.FC = () => (<div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>);

// --- TYPES & CONSTANTS ---
interface PrayerTimes { [key: string]: string }
interface HijriDateInfo { date: string; day: string; month: { ar: string, en: string }; weekday: { ar: string, en: string }; year: string; }
interface GregorianDateInfo { date: string; }
interface DateInfo { hijri: HijriDateInfo; gregorian: GregorianDateInfo; }
interface LocationInfo { city: string; country: string; }
interface Countdown { nextPrayer: string; timeRemaining: string; }

const prayerNameMapping: { [key: string]: string } = {
    Imsak: 'İmsak', Fajr: 'Sabah', Sunrise: 'Güneş', Dhuhr: 'Öğle',
    Asr: 'İkindi', Maghrib: 'Akşam', Isha: 'Yatsı'
};

const formatDate = (gregorianDateStr: string) => {
    const dateObj = new Date(gregorianDateStr.split('-').reverse().join('-'));
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    return {
        miladi: `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()} ${days[dateObj.getDay()]}`,
        rumi: `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear() - 584}`
    };
};

// --- COMPONENT ---
const NamazVakitleri: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => {
    const [times, setTimes] = useState<PrayerTimes | null>(null);
    const [date, setDate] = useState<DateInfo | null>(null);
    const [formattedDate, setFormattedDate] = useState<{ miladi: string, rumi: string } | null>(null);
    const [countdown, setCountdown] = useState<Countdown | null>(null);
    const [location, setLocation] = useState<LocationInfo | null>(null);
    const [inputLocation, setInputLocation] = useState<LocationInfo>({ city: '', country: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [history, setHistory] = useState<LocationInfo[]>([]);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [sharingIndex, setSharingIndex] = useState<number | null>(null);
    const [isGeolocating, setIsGeolocating] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };
    
    const updateHistory = (newLocation: LocationInfo) => {
        setHistory(prevHistory => {
            const normalizedCity = newLocation.city.toLowerCase().trim();
            const normalizedCountry = newLocation.country.toLowerCase().trim();

            const filteredHistory = prevHistory.filter(
                loc => loc.city.toLowerCase().trim() !== normalizedCity || loc.country.toLowerCase().trim() !== normalizedCountry
            );

            const updatedHistory = [newLocation, ...filteredHistory];
            return updatedHistory.slice(0, 15); 
        });
    };

    const fetchPrayerTimes = async (city: string, country: string) => {
        setLoading(true);
        setError(null);
        try {
            // Step 1: Geocode the city and country to get accurate coordinates
            const geoResponse = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: `${city}, ${country}`,
                    format: 'json',
                    limit: 1,
                    'accept-language': 'tr'
                }
            });

            if (!geoResponse.data || geoResponse.data.length === 0) {
                throw new Error("Konum bulunamadı.");
            }
            
            const { lat, lon } = geoResponse.data[0];

            // Step 2: Fetch prayer times using the obtained coordinates
            const response = await axios.get(`https://api.aladhan.com/v1/timings`, {
                params: { latitude: lat, longitude: lon, method: 3 } // Diyanet
            });

            if (response.data.code === 200) {
                const responseData = response.data.data;
                setTimes(responseData.timings);
                setDate(responseData.date);
                setFormattedDate(formatDate(responseData.date.gregorian.date));
                
                const currentLocation = { city, country }; // Use the original user input for consistency
                setLocation(currentLocation);
                setInputLocation(currentLocation);
                localStorage.setItem('namazVakitleriLocation', JSON.stringify(currentLocation));
                updateHistory(currentLocation);
            } else {
                 throw new Error("Namaz vakitleri alınamadı.");
            }
        } catch (err) {
            if (err instanceof Error && err.message === "Konum bulunamadı.") {
                 setError("Konum bulunamadı. Lütfen şehir ve ülke adını daha spesifik girerek deneyin (örn: 'Kreuzberg' yerine 'Berlin').");
            } else {
                setError("Namaz vakitleri alınırken bir hata oluştu. İnternet bağlantınızı kontrol edin.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGeolocate = () => {
        if (!navigator.geolocation) {
            showNotification("Tarayıcınız konum servisini desteklemiyor.", "error");
            return;
        }

        setIsGeolocating(true);
        showNotification("Konumunuz tespit ediliyor...", "success");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLoading(true);
                setError(null);
                try {
                    // Get city/country for display
                    const geoResponse = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=tr`);
                    const address = geoResponse.data.address;
                    const city = address.city || address.town || address.village || address.state;
                    const country = address.country;

                    if (!city || !country) throw new Error("Reverse geocoding failed");

                    // Get prayer times with coordinates
                    const timesResponse = await axios.get(`https://api.aladhan.com/v1/timings`, {
                        params: { latitude, longitude, method: 3 }
                    });
                    
                    if (timesResponse.data.code === 200) {
                        const responseData = timesResponse.data.data;
                        setTimes(responseData.timings);
                        setDate(responseData.date);
                        setFormattedDate(formatDate(responseData.date.gregorian.date));
                        
                        const currentLocation = { city, country };
                        setLocation(currentLocation);
                        setInputLocation(currentLocation);
                        localStorage.setItem('namazVakitleriLocation', JSON.stringify(currentLocation));
                        updateHistory(currentLocation);
                    } else {
                        throw new Error("Namaz vakitleri alınamadı.");
                    }
                } catch (e) {
                    showNotification("Konum bilgisi alınamadı, varsayılan olarak İstanbul gösteriliyor.", "error");
                    await fetchPrayerTimes('Istanbul', 'Turkey');
                } finally {
                    setIsGeolocating(false);
                    setLoading(false);
                }
            },
            async (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    showNotification("Konum izni verilmedi, varsayılan olarak İstanbul gösteriliyor.", "error");
                } else {
                    showNotification("Konumunuz tespit edilemedi, varsayılan olarak İstanbul gösteriliyor.", "error");
                }
                await fetchPrayerTimes('Istanbul', 'Turkey');
                setIsGeolocating(false);
            }
        );
    };
    
    // History & URL Import Load/Save Effects
    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('namazVakitleriHistory');
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error("Failed to load prayer time history", e);
        }

        try {
            const importedDataString = sessionStorage.getItem('importedDataFor_namaz');
            if (importedDataString) {
                sessionStorage.removeItem('importedDataFor_namaz');
                const importedLocation: LocationInfo = JSON.parse(importedDataString);
                fetchPrayerTimes(importedLocation.city, importedLocation.country);
                return; 
            }
        } catch (e) {
            console.error("Failed to import location data", e);
            showNotification('Paylaşılan konum işlenirken bir hata oluştu.', 'error');
        }

        const savedLocation = localStorage.getItem('namazVakitleriLocation');
        if (savedLocation) {
            const loc = JSON.parse(savedLocation);
            fetchPrayerTimes(loc.city, loc.country);
        } else {
            handleGeolocate();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('namazVakitleriHistory', JSON.stringify(history));
        } catch(e) {
            console.error("Failed to save prayer time history", e);
        }
    }, [history]);

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!times) return;

        timerRef.current = setInterval(() => {
            const now = new Date();
            const prayerTimesToday = Object.entries(times)
                .filter(([name]) => ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(name))
                .map(([name, time]) => {
                    // FIX: Explicitly cast 'time' to string to resolve 'unknown' type error.
                    const [h, m] = (time as string).split(':').map(Number);
                    const prayerDate = new Date();
                    prayerDate.setHours(h, m, 0, 0);
                    return { name, date: prayerDate };
                })
                .sort((a, b) => a.date.getTime() - b.date.getTime());

            let nextPrayer = prayerTimesToday.find(p => p.date > now);
            
            if (!nextPrayer) {
                const [h, m] = times.Fajr.split(':').map(Number);
                const fajrTomorrow = new Date();
                fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
                fajrTomorrow.setHours(h, m, 0, 0);
                nextPrayer = { name: 'Fajr', date: fajrTomorrow };
            }

            const diff = nextPrayer.date.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({
                nextPrayer: prayerNameMapping[nextPrayer.name],
                timeRemaining: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            });
        }, 1000);

        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [times]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputLocation.city && inputLocation.country) {
            fetchPrayerTimes(inputLocation.city, inputLocation.country);
        }
    };
    
    const handleHistoryItemClick = (loc: LocationInfo) => {
        fetchPrayerTimes(loc.city, loc.country);
        setIsHistoryOpen(false);
    };

    const handleDeleteHistoryItem = (e: React.MouseEvent, locToDelete: LocationInfo) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(loc => loc.city !== locToDelete.city || loc.country !== locToDelete.country));
    };

    const handleClearHistory = () => {
        setHistory([]);
    };
    
    const handleShareHistoryItem = async (e: React.MouseEvent, item: LocationInfo, index: number) => {
        e.stopPropagation();
        setSharingIndex(index);
        try {
            const jsonString = JSON.stringify(item);
            const compressed = pako.deflate(jsonString);
    
            let binaryString = '';
            for (let i = 0; i < compressed.length; i++) {
                binaryString += String.fromCharCode(compressed[i]);
            }
            
            const encodedData = btoa(binaryString);
            const shareUrl = `${window.location.origin}${window.location.pathname}#/?module=namaz&v=2&data=${encodeURIComponent(encodedData)}`;
    
            navigator.clipboard.writeText(shareUrl);
            showNotification('Paylaşım linki kopyalandı!');
    
        } catch (err) {
            console.error("Paylaşım başarısız:", err);
            showNotification('Link oluşturulurken bir hata oluştu.', 'error');
        } finally {
            setSharingIndex(null);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 relative overflow-hidden">
            {notification && (
                <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 animate-fade-in ${notification.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}
            <aside className={`absolute top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out z-30 flex flex-col ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '320px' }}>
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Geçmiş Konumlar</h2>
                    <button onClick={() => setIsHistoryOpen(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon /></button>
                </div>
                {history.length > 0 ? (
                    <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                        {history.map((loc, index) => (
                            <li key={index} className="rounded-md group hover:bg-gray-100 dark:hover:bg-gray-700">
                                <div className="flex items-center justify-between">
                                    <button onClick={() => handleHistoryItemClick(loc)} className="flex-1 text-left p-2.5 text-sm truncate capitalize" title={`${loc.city}, ${loc.country}`}>
                                        {loc.city}, {loc.country}
                                    </button>
                                    <div className="flex items-center space-x-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => handleShareHistoryItem(e, loc, index)} title="Paylaş" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" disabled={sharingIndex === index}>
                                            {sharingIndex === index ? <MiniSpinner /> : <ShareIcon className="w-4 h-4 text-gray-500" />}
                                        </button>
                                        <button onClick={(e) => handleDeleteHistoryItem(e, loc)} title="Sil" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><TrashIcon className="w-4 h-4 text-red-500" /></button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-4 text-gray-500">
                        <p>Henüz konum geçmişiniz yok.</p>
                    </div>
                )}
                <div className="p-3 border-t dark:border-gray-700">
                    {history.length > 0 && (
                         <button onClick={handleClearHistory} className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white shadow-sm hover:bg-red-700">
                            <TrashIcon className="w-4 h-4" />
                            <span>Tüm Geçmişi Temizle</span>
                        </button>
                    )}
                </div>
            </aside>

            <header className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center z-20">
                <div>
                    <h1 className="text-2xl font-bold">Namaz Vakitleri</h1>
                    {location && <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{location.city}, {location.country}</p>}
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={() => setIsHistoryOpen(true)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                        <HistoryIcon className="w-5 h-5" />
                        <span>Geçmiş</span>
                    </button>
                    <button onClick={onGoHome} className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                        <HomeIcon className="w-5 h-5" />
                        <span>Anasayfa</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col items-center">
                <div className="w-full max-w-3xl mx-auto">
                    <form onSubmit={handleSearch} className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input type="text" value={inputLocation.city} onChange={e => setInputLocation(prev => ({ ...prev, city: e.target.value }))} placeholder="Şehir" className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500" />
                        <input type="text" value={inputLocation.country} onChange={e => setInputLocation(prev => ({ ...prev, country: e.target.value }))} placeholder="Ülke" className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-teal-500 focus:border-teal-500" />
                        <button type="submit" className="p-2.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex-shrink-0"><SearchIcon className="w-5 h-5"/></button>
                        <button 
                            type="button" 
                            onClick={handleGeolocate} 
                            disabled={isGeolocating}
                            className="p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-shrink-0 flex items-center justify-center disabled:bg-blue-400"
                            title="Konumumu Kullan"
                        >
                            {isGeolocating ? <MiniSpinner /> : <LocationMarkerIcon className="w-5 h-5"/>}
                        </button>
                    </form>
                    
                    {loading ? <Spinner /> : error ? <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</p> : times && date && (
                        <div className="space-y-8">
                            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                                {formattedDate && (
                                    <div className="mb-6 flex flex-col md:flex-row justify-center items-center text-center md:space-x-8 text-gray-600 dark:text-gray-400">
                                        <div className="p-2">
                                            <p className="font-semibold text-sm">Miladi Takvim</p>
                                            <p>{formattedDate.miladi}</p>
                                        </div>
                                        <div className="p-2 mt-2 md:mt-0 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
                                            <p className="font-semibold text-sm">Rumi Takvim</p>
                                            <p>{formattedDate.rumi}</p>
                                        </div>
                                        <div className="p-2 mt-2 md:mt-0 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
                                            <p className="font-semibold text-sm">Hicri Takvim</p>
                                            <p>{date.hijri.day} {date.hijri.month.en} {date.hijri.year}</p>
                                            <p className="text-xs font-amiri" dir="rtl">{date.hijri.weekday.ar}، {date.hijri.day} {date.hijri.month.ar} {date.hijri.year}</p>
                                        </div>
                                    </div>
                                )}
                                {countdown && (
                                    <div>
                                        <p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">SONRAKİ VAKİT</p>
                                        <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{countdown.nextPrayer}</p>
                                        <p className="text-5xl font-mono font-bold tracking-tight mt-1">{countdown.timeRemaining}</p>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                {Object.entries(times).filter(([name]) => prayerNameMapping[name]).map(([name, time]) => {
                                    const isNext = countdown && countdown.nextPrayer === prayerNameMapping[name];
                                    const cardClasses = isNext
                                        ? 'bg-teal-500 text-white scale-105 shadow-lg dark:bg-teal-600'
                                        : 'bg-white dark:bg-gray-800';

                                    return (
                                        <div key={name} className={`p-4 rounded-lg shadow text-center transition-all duration-300 ${cardClasses}`}>
                                            <p className={`font-semibold ${isNext ? 'text-teal-100' : 'text-gray-700 dark:text-gray-300'}`}>{prayerNameMapping[name]}</p>
                                            <p className={`text-2xl font-bold font-mono mt-1 ${isNext ? 'text-white' : 'text-teal-600 dark:text-teal-400'}`}>{time}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default NamazVakitleri;
