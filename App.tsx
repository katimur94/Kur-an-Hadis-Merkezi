import React, { useState } from 'react';
import QuranReader from './components/QuranReader';
import HadithSearch from './components/HadithSearch';
import QuranRecitationChecker from './components/QuranRecitationChecker';
import FiqhChat from './components/FiqhChat';
import RisaleSearch from './components/RisaleSearch';
import NamazVakitleri from './components/NamazVakitleri';
import { LugatContextProvider } from './components/Lugat';

type View = 'home' | 'quran' | 'hadith' | 'recitation' | 'fiqh' | 'risale' | 'namaz';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m9.375 0-9.375 0" /></svg>);
const SunIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.95-4.243-1.591 1.591M5.25 12H3m4.243-4.95L6.343 6.343M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>);
const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25c0 5.385 4.365 9.75 9.75 9.75 2.733 0 5.24-.992 7.152-2.644Z" /></svg>);


const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [isInfoModalOpen, setInfoModalOpen] = useState(false);
    const [isBackupModalOpen, setBackupModalOpen] = useState(false);
    const [backupTab, setBackupTab] = useState<'create' | 'restore'>('create');
    const [backupCode, setBackupCode] = useState('');
    const [restoreCode, setRestoreCode] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [theme, setTheme] = useState(() => {
        if (localStorage.getItem('theme') === 'dark') return 'dark';
        if (localStorage.getItem('theme') === 'light') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const navigateTo = (view: View) => {
        setCurrentView(view);
    };

    const goHome = () => {
        setCurrentView('home');
    };

    const handleCreateBackup = () => {
        try {
            const backupData: Record<string, any> = {};
            const keysToBackup = [
                'hadithSearchHistory',
                'fiqhChatHistory',
                'risaleSearchHistory',
                'recitationProgressV2',
                'quranViewMode',
                'quranLastPage',
                'quranReader',
                'quranFontSize',
                'quranFontFamily',
                'recitationLastPage',
                'recitationFontSize',
                'recitationFontFamily',
            ];

            keysToBackup.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    try {
                        backupData[key] = JSON.parse(item);
                    } catch (e) {
                        backupData[key] = item; // Store as is if not JSON
                    }
                }
            });

            const jsonString = JSON.stringify(backupData);
            const encodedString = btoa(unescape(encodeURIComponent(jsonString)));
            setBackupCode(encodedString);
            showNotification('Yedek kodu başarıyla oluşturuldu!', 'success');
        } catch (error) {
            console.error("Backup creation failed:", error);
            showNotification('Yedek oluşturulurken bir hata oluştu.', 'error');
        }
    };

    const handleRestoreBackup = () => {
        if (!restoreCode.trim()) {
            showNotification('Lütfen geri yüklenecek kodu girin.', 'error');
            return;
        }

        const confirmed = window.confirm(
            "UYARI: Bu işlem, bu cihazdaki mevcut tüm geçmişinizi ve ilerlemenizi geri yüklenen verilerle DEĞİŞTİRECEKTİR. Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?"
        );

        if (confirmed) {
            try {
                const decodedString = decodeURIComponent(escape(atob(restoreCode)));
                const backupData = JSON.parse(decodedString);

                Object.keys(backupData).forEach(key => {
                    const value = backupData[key];
                    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
                });

                showNotification('Veriler başarıyla geri yüklendi! Değişikliklerin etkili olması için sayfa yenilenecek.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (error) {
                console.error("Restore failed:", error);
                showNotification('Geri yükleme başarısız oldu. Kod geçersiz veya bozuk olabilir.', 'error');
            }
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(backupCode).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    
    let content;

    if (currentView === 'quran') {
        content = <QuranReader onGoHome={goHome} />;
    } else if (currentView === 'hadith') {
        content = <HadithSearch onGoHome={goHome} />;
    } else if (currentView === 'recitation') {
        content = <QuranRecitationChecker onGoHome={goHome} />;
    } else if (currentView === 'fiqh') {
        content = <FiqhChat onGoHome={goHome} />;
    } else if (currentView === 'risale') {
        content = <RisaleSearch onGoHome={goHome} />;
    } else if (currentView === 'namaz') {
        content = <NamazVakitleri onGoHome={goHome} />;
    } else {
        content = (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-gray-800 dark:text-gray-200">
                 {notification && (
                    <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white z-[100] animate-fade-in ${notification.type === 'success' ? 'bg-teal-500' : 'bg-red-500'}`}>
                        {notification.message}
                    </div>
                )}
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-2">Dijital Medrese</h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400">Yapay Zeka Destekli Kişisel İlim Rehberiniz</p>
                </header>
                <main className="w-full max-w-6xl flex flex-col items-center">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                        <button onClick={() => navigateTo('quran')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Kur'an-ı Kerim Okuyucu</h2>
                            <p className="text-gray-600 dark:text-gray-300">Kur'an'ı Kerim'i farklı kârilerle okuyun, dinleyin ve mealini inceleyin.</p>
                        </button>
                        <button onClick={() => navigateTo('hadith')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Yapay Zeka ile Hadis Ara</h2>
                            <p className="text-gray-600 dark:text-gray-300">İlgilendiğiniz konulardaki hadisleri yapay zeka yardımıyla bulun ve fıkhi analizlerini inceleyin.</p>
                        </button>
                        <button onClick={() => navigateTo('recitation')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Kuran Okuma ve Hata Tespiti</h2>
                            <p className="text-gray-600 dark:text-gray-300">Ayetleri okuyun ve yapay zeka ile telaffuz hatalarınızı tespit edin.</p>
                        </button>
                        <button onClick={() => navigateTo('fiqh')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Fıkıh Soru & Cevap</h2>
                            <p className="text-gray-600 dark:text-gray-300">Fıkhi sorularınıza dört mezhebe göre kaynaklarıyla birlikte, yapay zeka destekli cevaplar alın.</p>
                        </button>
                         <button onClick={() => navigateTo('risale')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Risale-i Nur'da Ara</h2>
                            <p className="text-gray-600 dark:text-gray-300">Sorularınıza Risale-i Nur külliyatından yapay zeka destekli, kaynaklı cevaplar bulun.</p>
                        </button>
                         <button onClick={() => navigateTo('namaz')} className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
                            <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Namaz Vakitleri</h2>
                            <p className="text-gray-600 dark:text-gray-300">Bulunduğunuz konuma göre günlük namaz vakitlerini ve kalan süreyi öğrenin.</p>
                        </button>
                    </div>
                    <div className="mt-8 flex space-x-4 items-center">
                         <button onClick={() => setInfoModalOpen(true)} className="px-6 py-3 bg-transparent text-teal-600 dark:text-teal-400 font-semibold rounded-lg border-2 border-teal-600 dark:border-teal-400 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-400 dark:hover:text-gray-900 transition-colors duration-300">
                            Uygulamayı Tanı
                        </button>
                        <button onClick={() => setBackupModalOpen(true)} className="px-6 py-3 bg-transparent text-amber-600 dark:text-amber-400 font-semibold rounded-lg border-2 border-amber-600 dark:border-amber-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-400 dark:hover:text-gray-900 transition-colors duration-300">
                            Yedekle & Geri Yükle
                        </button>
                        <button onClick={toggleTheme} title="Temayı Değiştir" className="p-3 bg-transparent text-gray-600 dark:text-gray-400 font-semibold rounded-full border-2 border-gray-400 dark:border-gray-500 hover:bg-gray-400 hover:text-white dark:hover:bg-gray-500 dark:hover:text-gray-900 transition-colors duration-300">
                            {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                        </button>
                    </div>
                </main>
                <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                   <p>&copy; 2025 - Timur Kalaycı. Hayır dualarınızı beklerim. Rabbim bu Site vesilesiyle ilminizi artırsın.</p>
                </footer>

                {isBackupModalOpen && (
                     <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setBackupModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl">
                                <h2 className="text-2xl font-bold">Veri Yönetimi</h2>
                                <button onClick={() => setBackupModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                    <CloseIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex border-b dark:border-gray-700">
                                <button onClick={() => setBackupTab('create')} className={`flex-1 p-3 font-medium ${backupTab === 'create' ? 'border-b-2 border-teal-500 text-teal-600' : ''}`}>Yedek Oluştur</button>
                                <button onClick={() => setBackupTab('restore')} className={`flex-1 p-3 font-medium ${backupTab === 'restore' ? 'border-b-2 border-amber-500 text-amber-600' : ''}`}>Yedekten Geri Yükle</button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                {backupTab === 'create' ? (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold">Tüm Uygulama Verilerinizi Yedekleyin</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Bu işlem, tüm arama geçmişlerinizi (Hadis, Fıkıh, Risale) ve Kur'an okuma ilerlemenizi/ayarlarınızı tek bir koda dönüştürür. Bu kodu güvenli bir yere kaydedin ve başka bir cihaza verilerinizi aktarmak için kullanın.</p>
                                        <button onClick={handleCreateBackup} className="w-full px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                                            Yedekleme Kodu Oluştur
                                        </button>
                                        {backupCode && (
                                            <div className="mt-4 space-y-2">
                                                <textarea readOnly value={backupCode} className="w-full h-40 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-xs" />
                                                <button onClick={handleCopyCode} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                                                    {isCopied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                                                    <span>{isCopied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                         <h3 className="text-lg font-semibold">Yedekten Verilerinizi Geri Yükleyin</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Daha önce oluşturduğunuz yedekleme kodunu aşağıya yapıştırarak tüm verilerinizi bu cihaza aktarabilirsiniz. <strong className="text-red-500">Bu işlem, bu cihazdaki mevcut verilerin üzerine yazılacaktır.</strong></p>
                                        <textarea
                                            value={restoreCode}
                                            onChange={(e) => setRestoreCode(e.target.value)}
                                            placeholder="Yedekleme kodunu buraya yapıştırın..."
                                            className="w-full h-40 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <button onClick={handleRestoreBackup} className="w-full px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors">
                                            Verileri Geri Yükle
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                )}
                
                {isInfoModalOpen && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setInfoModalOpen(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl">
                                <h2 className="text-2xl font-bold">Uygulama Rehberi</h2>
                                <button onClick={() => setInfoModalOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><CloseIcon className="w-6 h-6" /></button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-6">
                                 <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Namaz Vakitleri</h3>
                                    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                        <li><strong>Otomatik Konum:</strong> Tarayıcınızdan izin alarak bulunduğunuz yere göre namaz vakitlerini otomatik olarak getirir.</li>
                                        <li><strong>Manuel Arama:</strong> İzin vermezseniz veya konum bulunamazsa, şehir ve ülke girerek vakitleri arayabilirsiniz.</li>
                                        <li><strong>Geri Sayım:</strong> Bir sonraki namaz vaktine ne kadar süre kaldığını anlık olarak gösterir.</li>
                                        <li><strong>Tarih Bilgisi:</strong> Hem Miladi hem de Hicri takvime göre güncel tarihi gösterir.</li>
                                    </ul>
                                </section>
                                <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Kur'an-ı Kerim Okuyucu</h3>
                                    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                        <li><strong>İki Farklı Görünüm:</strong> "Kur'an Görünümü" (sadece Arapça) ve "Meal Görünümü" (Arapça ve Türkçe meal) arasında geçiş yapın.</li>
                                        <li><strong>Dinamik Dinleme Modları:</strong> Cüz, Sure, sayfa veya tek ayet bazında dinleme yapın.</li>
                                        <li><strong>Canlı Takip ve Otomatik Sayfa Geçişi:</strong> Cüz veya Sure dinlerken okunan ayet vurgulanır ve sayfa otomatik olarak ilerler.</li>
                                        <li><strong>Ayarlar & İlerleme Kaydı:</strong> Farklı kâriler seçin, yazı tipini ayarlayın. Kaldığınız sayfa otomatik kaydedilir.</li>
                                    </ul>
                                </section>
                                 <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Kuran Okuma ve Hata Tespiti</h3>
                                    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                        <li><strong>Canlı Takip & Kalıcı İlerleme:</strong> Okuduğunuz kelimeler mavi ile işaretlenir ve bu ilerleme cihazınıza kaydedilir.</li>
                                        <li><strong>Akıllı Devam Etme:</strong> Sistem kaldığınız ilk okunmamış kelimeden devam etmenizi sağlar.</li>
                                        <li><strong>İsteğe Bağlı Analiz:</strong> "Analiz Et" butonu ile okumanızdaki tecvid hatalarını yapay zeka ile tespit edin.</li>
                                        <li><strong>İnteraktif Hata Detayları:</strong> Kırmızı işaretli hatalı kelimelere tıklayarak hatanın açıklamasını ve tecvid kuralını öğrenin.</li>
                                    </ul>
                                </section>
                                <section>
                                    <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Yapay Zeka Destekli Araştırma Araçları</h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">Hadis, Fıkıh ve Risale-i Nur modülleri, aradığınız bilgiye kaynaklarıyla birlikte ulaşmanızı sağlar.</p>
                                    <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">Geçmiş Yönetimi ve Paylaşım</h4>
                                    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                        <li><strong>Kişiselleştirme:</strong> Her bir geçmiş arama öğesini daha sonra hatırlamak için yeniden adlandırabilir veya tek tek silebilirsiniz.</li>
                                        <li><strong>Paylaşma:</strong> Her aramanın yanında bulunan 'Paylaş' ikonu ile o aramanın sonucunu içeren özel bir kod oluşturup panonuza kopyalayabilirsiniz.</li>
                                        <li><strong>İçe Aktarma:</strong> Başkasından aldığınız bir paylaşım kodunu, geçmiş panelindeki ilgili alana yapıştırarak o kişinin aldığı cevabın aynısını kendi geçmişinize ekleyebilirsiniz.</li>
                                    </ul>
                                </section>
                                <section>
                                     <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Genel Özellikler</h3>
                                    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                        <li><strong>Dahili Lügat (Sözlük):</strong> Okuma ve araştırma sayfalarında, anlamını bilmediğiniz bir kelimenin üzerine mobil cihazda basılı tutarak veya masaüstünde fare ile seçerek yapay zeka destekli lügatı açabilir, kelimenin tanımını, kökenini ve diğer anlamlarını öğrenebilirsiniz.</li>
                                        <li><strong>Karanlık Mod:</strong> Göz yormayan bir okuma deneyimi için aydınlık ve karanlık mod arasında geçiş yapabilirsiniz. Seçiminiz kaydedilir.</li>
                                        <li><strong>Mobil Uyumluluk:</strong> Hem masaüstü hem de mobil cihazlarda rahat bir kullanım için tasarlanmıştır.</li>
                                        <li><strong>Veri Yedekleme:</strong> Ana menüdeki "Yedekle & Geri Yükle" özelliği ile tüm geçmişinizi ve ilerlemenizi başka bir cihaza kolayca aktarabilirsiniz.</li>
                                    </ul>
                                </section>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <LugatContextProvider>
            {content}
        </LugatContextProvider>
    );
};

export default App;
