import React, { useState, useRef } from 'react';
import { getGeminiClient, getGeminiModel } from '../services/geminiClient';
import Spinner from './Spinner';

interface MoodAyahModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onGoToAyah: (page: number, ayahNumber: number) => void;
}

const MOODS = [
    { label: 'Üzgün', emoji: '😢', query: 'üzgün hissediyorum, teselliye ihtiyacım var' },
    { label: 'Endişeli', emoji: '😰', query: 'kaygılı ve endişeliyim, kalbimin ferahlamasına ihtiyacım var' },
    { label: 'Şükreden', emoji: '🤲', query: 'Rabbime çok şükür, şükrümü artıracak bir ayet istiyorum' },
    { label: 'Umutsuz', emoji: '🌑', query: 'umutsuzluğa kapıldım, bana umut veren bir ayet okut' },
    { label: 'Yorgun', emoji: '😮‍💨', query: 'çok yorgun ve bitkinim, bana güç ve sabır verecek bir ayet' },
    { label: 'Öfkeli', emoji: '😠', query: 'öfkeliyim, sakinleşmeme yardım edecek bir ayet' },
    { label: 'Yalnız', emoji: '🚶‍♂️', query: 'kendimi çok yalnız hissediyorum, Rabbimin benimle olduğunu hissettiren bir ayet' },
    { label: 'Pişman', emoji: '😔', query: 'günah işledim ve çok pişmanım, tövbe ile ilgili ve Allah\'ın merhametini anlatan bir ayet' },
    { label: 'Kafası Karışık', emoji: '🤔', query: 'kafam çok karışık, doğru yolu bulmam için bana rehberlik edecek bir ayet' },
    { label: 'Korkmuş', emoji: '😨', query: 'korkuyorum, bana güven verecek ve Allah\'a sığınmamı hatırlatacak bir ayet' },
    { label: 'Kararsız', emoji: '⚖️', query: 'iki şey arasında kaldım ve kararsızım, tevekkül etmemi sağlayacak bir ayet' },
    { label: 'Kırgın', emoji: '💔', query: 'insanlar kalbimi kırdı, insanlardan çok Allah\'a güvenmemi hatırlatan teselli edici bir ayet' },
    { label: 'Huzurlu', emoji: '😌', query: 'çok huzurluyum, bu huzurun kaynağının Allah olduğunu hatırlatan bir ayet' },
    { label: 'Sabırsız', emoji: '⏳', query: 'bir şeyin olmasını beklerken sabrım tükeniyor, bana sabrın mükafatını anlatan bir ayet' },
    { label: 'Çaresiz', emoji: '🆘', query: 'elimden hiçbir şey gelmiyor ve çaresiz hissediyorum, her şeye gücü yeten Allah\'ı hatırlatan bir ayet' },
    { label: 'Suçluluk Hissi', emoji: '😞', query: 'kendimi çok suçlu hissediyorum, vicdan azabı çekiyorum. Allah\'ın affediciliğini gösteren bir ayet' },
    { label: 'Sevinçli', emoji: '😄', query: 'çok mutlu ve sevinçliyim! Bu sevincimi Rabbime bağlamamı sağlayacak bir ayet' },
    { label: 'Özlem Duyan', emoji: '🕊️', query: 'sevdiğim birine veya ahirete özlem duyuyorum, kalbimi ferahlatacak bir ayet' },
    { label: 'Tembel', emoji: '🥱', query: 'hiçbir şey yapmak istemiyorum, irademi güçlendirecek ve beni ahiret için gayrete getirecek bir ayet' },
    { label: 'Şaşkın', emoji: '😲', query: 'hayattaki mucizeler veya olaylar karşısında şaşkınım, Allah\'ın yaratma sanatını ve büyüklüğünü anlatan bir ayet' },
    { label: 'Hasetten Korunma', emoji: '🧿', query: 'içimde kıskançlık (haset) duygusu var veya bundan korunmak istiyorum, kalbimi temizleyecek bir ayet' },
    { label: 'Özgüvensiz', emoji: '🥀', query: 'kendimi yetersiz ve değersiz hissediyorum, Allah katındaki değerimi hatırlatan bir ayet' }
];

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);

const MoodAyahModal: React.FC<MoodAyahModalProps> = ({ isOpen, setIsOpen, onGoToAyah }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'result' | 'error'>('idle');
    const [result, setResult] = useState<any>(null);
    const [selectedMood, setSelectedMood] = useState<string>('');
    const ai = useRef(getGeminiClient());

    const fetchAyahForMood = async (moodQuery: string, label: string) => {
        if (!ai.current) {
            setStatus('error');
            return;
        }

        setSelectedMood(label);
        setStatus('loading');
        try {
            const prompt = `Kullanıcı şu anki ruh halini şöyle ifade ediyor: "${moodQuery}". Lütfen bu ruh haline en uygun, teselli verici SADECE BİR Kur'an ayeti seç.
Cevabını SADECE aşağıdaki JSON formatında, hiçbir ek yorum eklemeden döndür:
{
    "surahNumber": (sayısal),
    "ayahInSurah": (sayısal),
    "surahName": "Sure Adı",
    "arabicText": "Arapça Orjinal Metni",
    "turkishTranslation": "Türkçe Meali",
    "explanation": "Bu ayet, hissettiğin duyguya karşı..."
}`;

            const response = await ai.current.models.generateContent({
                model: await getGeminiModel(),
                contents: prompt,
                config: { temperature: 0.7 }
            });

            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("JSON bulunamadı.");

            const data = JSON.parse(jsonMatch[0]);

            // To navigate, we need the page. We'll fetch it via api later if user clicks "Oku", but we can also require it in JSON if needed. 
            // For now, let's just show it.
            setResult(data);
            setStatus('result');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 min-h-[100dvh]" onClick={() => setIsOpen(false)}>
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700/50" onClick={e => e.stopPropagation()}>

                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800/50 bg-gray-50 dark:bg-[#0f172a] sticky top-0 z-10">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent">Ruh Halime Göre Ayet</h3>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-colors"><CloseIcon /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {status === 'idle' && (
                        <div>
                            <p className="text-center text-gray-600 dark:text-gray-300 mb-6 text-lg font-medium">Şu an tam olarak nasıl hissediyorsun?</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {MOODS.map(mood => (
                                    <button
                                        key={mood.label}
                                        onClick={() => fetchAyahForMood(mood.query, mood.label)}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all group shadow-sm hover:shadow-md h-28"
                                    >
                                        <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{mood.emoji}</span>
                                        <span className="font-medium text-xs text-center text-gray-700 dark:text-gray-200">{mood.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Spinner />
                            <p className="mt-6 text-xl text-teal-600 dark:text-teal-500 font-bold animate-pulse">{selectedMood} kalbine şifa aranıyor...</p>
                        </div>
                    )}

                    {status === 'result' && result && (
                        <div className="animate-fade-in text-center space-y-6 max-w-2xl mx-auto py-4">
                            <div className="inline-block px-4 py-1.5 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                                Senin İçin Seçildi: {selectedMood}
                            </div>

                            <h4 className="text-2xl font-black text-amber-600 dark:text-amber-500">
                                {result.surahName} Suresi, {result.ayahInSurah}. Ayet
                            </h4>

                            <div className="bg-orange-50/50 dark:bg-gray-800/40 p-6 rounded-2xl border border-orange-100 dark:border-gray-700 shadow-inner">
                                <p dir="rtl" className="font-amiri text-3xl text-gray-800 dark:text-gray-100 leading-normal mb-6">
                                    {result.arabicText}
                                </p>
                                <div className="h-px w-1/3 bg-gray-300 dark:bg-gray-600 mx-auto my-6"></div>
                                <p className="text-gray-800 dark:text-gray-200 font-medium text-xl leading-relaxed italic">
                                    "{result.turkishTranslation}"
                                </p>
                            </div>

                            <div className="bg-teal-50 dark:bg-teal-900/20 p-5 rounded-2xl border border-teal-100 dark:border-teal-800/50 text-left shadow-sm">
                                <div className="flex items-start">
                                    <div className="text-2xl mr-3">💡</div>
                                    <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                                        {result.explanation}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 flex flex-col sm:flex-row gap-3">
                                <button onClick={() => setStatus('idle')} className="flex-1 py-3 px-6 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm">
                                    Başka Bir Duygu Seç
                                </button>
                                <button onClick={() => {
                                    setIsOpen(false);
                                    onGoToAyah(1, 1);
                                }}
                                    className="flex-1 py-3 px-6 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-md shadow-teal-500/30">
                                    Okuyucuya Git (Sayfa 1)
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="text-5xl mb-4">⚠️</div>
                            <p className="text-red-500 font-bold text-lg mb-6">Bir hata oluştu veya yapay zeka bağlantısı kurulamadı.</p>
                            <button onClick={() => setStatus('idle')} className="px-8 py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-colors shadow-sm">Geri Git ve Yeniden Dene</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MoodAyahModal;
