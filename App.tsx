import React, { useState } from 'react';
import QuranReader from './components/QuranReader';
import HadithSearch from './components/HadithSearch';
import QuranRecitationChecker from './components/QuranRecitationChecker';
import FiqhChat from './components/FiqhChat';
import RisaleSearch from './components/RisaleSearch';

type View = 'home' | 'quran' | 'hadith' | 'recitation' | 'fiqh' | 'risale';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('home');
    const [isInfoModalOpen, setInfoModalOpen] = useState(false);

    const navigateTo = (view: View) => {
        setCurrentView(view);
    };

    const goHome = () => {
        setCurrentView('home');
    };

    if (currentView === 'quran') {
        return <QuranReader onGoHome={goHome} />;
    }

    if (currentView === 'hadith') {
        return <HadithSearch onGoHome={goHome} />;
    }

    if (currentView === 'recitation') {
        return <QuranRecitationChecker onGoHome={goHome} />;
    }
    
    if (currentView === 'fiqh') {
        return <FiqhChat onGoHome={goHome} />;
    }
    
    if (currentView === 'risale') {
        return <RisaleSearch onGoHome={goHome} />;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-gray-800 dark:text-gray-200">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-bold mb-2">Dijital Medrese</h1>
                <p className="text-xl text-gray-500 dark:text-gray-400">Yapay Zeka Destekli Kişisel İlim Rehberiniz</p>
            </header>
            <main className="w-full max-w-6xl flex flex-col items-center">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                    <button
                        onClick={() => navigateTo('quran')}
                        className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                        <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Kur'an-ı Kerim Okuyucu</h2>
                        <p className="text-gray-600 dark:text-gray-300">Kur'an'ı Kerim'i farklı kârilerle okuyun, dinleyin ve mealini inceleyin.</p>
                    </button>
                    <button
                        onClick={() => navigateTo('hadith')}
                        className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                        <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Yapay Zeka ile Hadis Ara</h2>
                        <p className="text-gray-600 dark:text-gray-300">İlgilendiğiniz konulardaki hadisleri yapay zeka yardımıyla bulun ve fıkhi analizlerini inceleyin.</p>
                    </button>
                    <button
                        onClick={() => navigateTo('recitation')}
                        className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                        <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Kuran Okuma ve Hata Tespiti</h2>
                        <p className="text-gray-600 dark:text-gray-300">Ayetleri okuyun ve yapay zeka ile telaffuz hatalarınızı tespit edin.</p>
                    </button>
                    <button
                        onClick={() => navigateTo('fiqh')}
                        className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                        <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Fıkıh Soru & Cevap</h2>
                        <p className="text-gray-600 dark:text-gray-300">Fıkhi sorularınıza dört mezhebe göre kaynaklarıyla birlikte, yapay zeka destekli cevaplar alın.</p>
                    </button>
                     <button
                        onClick={() => navigateTo('risale')}
                        className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                        <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">Risale-i Nur'da Ara</h2>
                        <p className="text-gray-600 dark:text-gray-300">Sorularınıza Risale-i Nur külliyatından yapay zeka destekli, kaynaklı cevaplar bulun.</p>
                    </button>
                </div>
                <div className="mt-8">
                     <button
                        onClick={() => setInfoModalOpen(true)}
                        className="px-6 py-3 bg-transparent text-teal-600 dark:text-teal-400 font-semibold rounded-lg border-2 border-teal-600 dark:border-teal-400 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-400 dark:hover:text-gray-900 transition-colors duration-300"
                    >
                        Uygulamayı Tanı
                    </button>
                </div>
            </main>
            <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
               <p>&copy; 2025 - Timur Kalaycı. Hayır dualarınızı beklerim. Rabbim bu Site vesilesiyle ilminizi artırsın.</p>
            </footer>

            {isInfoModalOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setInfoModalOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl">
                            <h2 className="text-2xl font-bold">Uygulama Rehberi</h2>
                            <button
                                onClick={() => setInfoModalOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            <section>
                                <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Kur'an-ı Kerim Okuyucu</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">Bu bölümde Kur'an-ı Kerim'i okuyabilir, dinleyebilir ve mealini inceleyebilirsiniz. Bölüm, profesyonel bir deneyim sunmak için birçok özelliğe sahiptir:</p>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                    <li><strong>İki Farklı Görünüm:</strong> Üst menüden "Kur'an Görünümü" (sadece Arapça metin) ve "Meal Görünümü" (Arapça ve Türkçe meal) arasında geçiş yapabilirsiniz.</li>
                                    <li><strong>Dinamik Dinleme Modları:</strong>
                                        <ul className="list-['-_'] list-inside ml-4 mt-1 space-y-1">
                                             <li><strong>Cüz & Sure Modu:</strong> Sol paneldeki Cüz veya Sure listesinden herhangi birinin yanındaki 'Oynat' ikonuna basarak o bölümün tamamını kesintisiz dinleyebilirsiniz.</li>
                                              <li><strong>Sayfa Modu:</strong> Üst paneldeki ana 'Oynat' butonuna basarak sadece o an açık olan sayfayı dinleyebilirsiniz.</li>
                                             <li><strong>Tek Ayet Modu:</strong> Herhangi bir ayetin metnine tıklayarak sadece o ayeti dinleyebilirsiniz.</li>
                                        </ul>
                                    </li>
                                    <li><strong>Canlı Takip ve Otomatik Sayfa Geçişi:</strong> Cüz veya Sure dinlerken, okunan ayet canlı olarak vurgulanır. Okuma sayfanın sonuna geldiğinde, uygulama otomatik olarak bir sonraki sayfaya geçer.</li>
                                    <li><strong>Ayarlar:</strong> Sağ üstteki dişli ikonuna basarak Ayarlar menüsünü açabilirsiniz. Buradan onlarca farklı kârî (okuyucu) arasından seçim yapabilir ve "Kur'an Görünümü" için yazı tipi boyutunu ayarlayabilirsiniz.</li>
                                    <li><strong>İlerleme Kaydı:</strong> Uygulama, en son kaldığınız sayfayı ve ayarlarınızı otomatik olarak kaydeder. Geri döndüğünüzde kaldığınız yerden devam edersiniz.</li>
                                </ul>
                            </section>
                             <section>
                                <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Kuran Okuma ve Hata Tespiti</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">Bu gelişmiş bölümde, Kur'an-ı Kerim'i sayfa sayfa okuyarak kıraatinizi pratik edebilir ve yapay zeka ile tecvid hatalarınızı tespit edebilirsiniz. Sistem, okumanızı canlı olarak takip eder ve ilerlemenizi otomatik olarak kaydeder.</p>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                    <li><strong>Canlı Takip:</strong> Mikrofonu başlattığınızda, okuduğunuz kelimeler anında tespit edilir ve doğru okunanlar metin üzerinde mavi renkle vurgulanır.</li>
                                    <li><strong>Kalıcı İlerleme Kaydı:</strong> Okuduğunuz her kelime sayfa bazında kaydedilir. Uygulamayı kapatıp açsanız bile, daha önce doğru okuduğunuz yerler mavi olarak işaretli kalır.</li>
                                    <li><strong>Akıllı Devam Etme:</strong> Bir sayfada okumayı durdurup tekrar başladığınızda, sistem kaldığınız ilk okunmamış kelimeden devam etmenizi sağlar.</li>
                                    <li><strong>Detaylı Kenar Çubuğu:</strong> Sol kenar çubuğu interaktif bir menüdür. Surelere tıklayarak içerdikleri tüm sayfaları ve her bir sayfanın ilerleme durumunu (tamamlandı ✔, devam ediyor ▶, başlanmadı ○) görebilirsiniz.</li>
                                    <li><strong>İsteğe Bağlı Analiz:</strong> Okumanızı bitirdikten sonra, üst menüdeki "Analiz Et" butonuna basarak yapay zeka analizi başlatabilirsiniz.</li>
                                    <li><strong>Tecvid Hata Tespiti:</strong> Analiz sonucunda, yapay zeka tarafından tespit edilen tecvid hataları metin üzerinde kırmızı renkle işaretlenir.</li>
                                    <li><strong>İnteraktif Hata Detayları:</strong> Kırmızı ile işaretlenmiş bir kelimeye tıkladığınızda, hatanın türünü, açıklamasını ve ilgili tecvid kuralını gösteren bir pencere açılır.</li>
                                    <li><strong>Sıfırlama:</strong> "Sıfırla" butonu ile mevcut sayfanın tüm ilerlemesini (mavi ve kırmızı işaretler) temizleyerek yeniden pratik yapabilirsiniz.</li>
                                </ul>
                            </section>
                            <section>
                                <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Yapay Zeka ile Hadis Araştırma Aracı</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">Bu bölüm, Gemini yapay zeka modelini kullanan gelişmiş bir hadis araştırma ve fıkhi analiz aracıdır. Sadece bir arama motoru değil, aynı zamanda derinlemesine bir inceleme platformudur.</p>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                    <li><strong>Doğal Dilde Arama:</strong> "Namazın önemi" gibi normal bir cümle yazarak arama yapabilirsiniz.</li>
                                    <li><strong>Zenginleştirilmiş Hadis Kartları:</strong> Her hadis; orijinal Arapça metni, kimin rivayet ettiği, Türkçe tercümesi ve kaynağı ile birlikte sunulur.</li>
                                    <li><strong>İnteraktif Kaynak Detayları:</strong> Her hadisin altındaki "Kaynak" butonuna tıklayarak o hadisin ait olduğu koleksiyon, bölüm, hadis/cilt/sayfa numarası gibi tüm künye bilgilerini içeren bir pencere açabilirsiniz.</li>
                                    <li><strong>Tek Tıkla Kopyalama:</strong> "Kopyala" ikonu ile hadisin tüm bilgilerini (Arapça, Türkçe, rivayet eden, tam kaynak) düzenli bir formatta panoya kopyalayabilirsiniz.</li>
                                    <li><strong>Derinlemesine Fıkhi Analiz:</strong> Herhangi bir hadis kartının üzerine tıklayarak o hadis özelinde yeni bir yapay zeka analizi başlatabilirsiniz.</li>
                                    <li><strong>Birebir İmam Nakilleri:</strong> Açılan pencerede, Dört Büyük Mezhep İmamı'nın (Hanefi, Şafii, Maliki, Hanbeli) bu hadisten ne gibi hükümler çıkardığı veya nasıl yorumladığı, doğrudan kendi temel fıkıh eserlerinden <strong>birebir alıntılarla</strong> gösterilir.</li>
                                    <li><strong>Çift Dilli Alıntılar:</strong> İmamların görüşleri hem orijinal Arapça metinleri hem de Türkçe tercümeleri ile birlikte sunularak hem aslına sadık kalınır hem de anlaşılırlık sağlanır.</li>
                                    <li><strong>Fıkıh Kaynaklarına Erişim:</strong> Her imamın alıntısının altında, o bilginin alındığı eserin (örn: el-Mebsut) adını taşıyan bir kaynak butonu bulunur. Bu butona tıklayarak eserin yazarı, cilt ve sayfa numarası gibi detayları görebilirsiniz.</li>
                                </ul>
                            </section>
                             <section>
                                <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Fıkıh Soru & Cevap</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">Bu modül, günlük hayatta karşılaştığınız fıkhi sorulara (örn: "Oruç nasıl tutulur?", "Adetliyken Kur'an okunur mu?") yapay zeka destekli, kaynakçalı yanıtlar sunar. Her yanıtta şunları bulacaksınız:</p>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                    <li><strong>Net Özet:</strong> Sorunuzun cevabını anlaşılır bir dille özetler.</li>
                                    <li><strong>Dört Mezhebin Görüşü:</strong> Hanefi, Şafii, Maliki ve Hanbeli mezheplerinin konuya dair görüşlerini, varsa aralarındaki farkları belirterek sunar.</li>
                                    <li><strong>Delil Niteliğinde Hadisler:</strong> Konuyla ilgili hadislerin Arapça metni, güvenilir tercümesi, kaynağı (örn: Sahih-i Müslim, 1151) ve sıhhat derecesi (sahih, hasan vb.) ile birlikte verilir.</li>
                                    <li><strong>İlgili Kur'an Ayetleri:</strong> Varsa, konuyla ilgili ayetler referanslarıyla birlikte sunulur.</li>
                                    <li><strong>Önemli Uyarı:</strong> Her cevabın altında, bunun bir yapay zeka özeti olduğu ve nihai kararlar için sunulan kaynakların bizzat araştırılması gerektiği belirtilir.</li>
                                </ul>
                            </section>
                            <section>
                                <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Risale-i Nur'da Arama</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">Bu modül, Bediüzzaman Said Nursi'nin Risale-i Nur külliyatı üzerine sorularınıza yapay zeka destekli, kaynakçalı yanıtlar sunar. Her yanıtta şunları bulacaksınız:</p>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                    <li><strong>Özet Cevap:</strong> Sorunuzun cevabını Risale-i Nur temelinde anlaşılır bir dille özetler.</li>
                                    <li><strong>Orijinal Metin:</strong> Cevabın dayandığı Risale-i Nur'dan orijinal alıntıyı sunar.</li>
                                    <li><strong>Kaynak Bilgisi:</strong> Alıntının yapıldığı eserin adını, bölümünü ve sayfa numarasını net bir şekilde belirtir.</li>
                                </ul>
                            </section>
                            <section>
                                 <h3 className="text-xl font-semibold text-teal-600 dark:text-teal-400 mb-2">Genel Özellikler</h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                    <li><strong>Karanlık Mod:</strong> Uygulama, cihazınızın temasına otomatik olarak uyum sağlar.</li>
                                    <li><strong>Mobil Uyumluluk:</strong> Hem masaüstü hem de mobil cihazlarda rahat bir kullanım için tasarlanmıştır.</li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
