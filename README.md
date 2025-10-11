<div align="center">
  
  <h1 align="center">Dijital Medrese</h1>
  <p align="center">
    <strong>Yapay Zeka Destekli Kişisel İlim Rehberiniz</strong>
    <br />
    <a href="https://kuranvehadiskati.netlify.app/"><strong>» Uygulamayı Ziyaret Et «</strong></a>
  </p>
</div>

---

## 📖 Proje Hakkında

**Dijital Medrese**, React, Vite ve TypeScript kullanılarak geliştirilmiş, modern bir İslami ilimler öğrenme platformudur. Uygulama, akıllı arama ve analiz yetenekleri için **Google Gemini AI**'dan yoğun bir şekilde faydalanan çeşitli interaktif modüller sunar. Kullanıcının tüm ilerlemesini ve ayarlarını doğrudan tarayıcıda saklayarak, giriş gerektirmeyen kişiselleştirilmiş bir deneyim sunmayı hedefler.

---

## ✨ Temel Özellikler

Platform, her biri güçlü yeteneklere sahip modüllerden oluşur:

#### 🕋 Kur'an-ı Kerim Okuyucu
* **İki Farklı Görünüm:** Geleneksel Mushaf düzeni ile her ayetin altında Türkçe mealinin yer aldığı "Meal Görünümü" arasında geçiş yapın.
* **Gelişmiş Ses Oynatıcı:** Tek bir ayeti, sayfayı, sureyi veya bütün bir cüzü dinleyin. Okunan ayet canlı olarak vurgulanır ve sayfa otomatik olarak ilerler.
* **Kişiselleştirme:** Dilediğiniz kâriyi, Arapça metin fontunu ve yazı tipi boyutunu kendi zevkinize göre ayarlayın.

#### 🕌 Kıraat Asistanı (Tecvid & Telaffuz)
* **Ses Tanıma:** Kur'an okumanızı doğrudan tarayıcı üzerinden kaydedin.
* **Canlı Geri Bildirim:** Doğru telaffuz ettiğiniz kelimeler okuma esnasında anlık olarak işaretlenir.
* **Yapay Zeka ile Hata Analizi:** Kayıt sonrası yapay zeka, okuyuşunuzu analiz ederek tecvid ve telaffuz hatalarını tespit eder.
* **Detaylı Düzeltmeler:** Hatalı kelimelere tıklayarak hatanın ne olduğunu, nasıl düzeltileceğini ve ilgili tecvid kuralını öğrenin.

#### 📚 Yapay Zeka ile Hadis Arama
* **Konu Odaklı Arama:** Merak ettiğiniz bir konuyla ilgili hadisleri yapay zeka yardımıyla bulun.
* **Fıkıh Analizi:** Bulunan bir hadise tıklayarak, o hadis özelinde dört büyük mezhebin fıkhî yorumlarını ve hükümlerini kaynaklarıyla birlikte inceleyin.

#### ⚖️ Fıkıh Soru & Cevap
* **Detaylı Cevaplar:** Fıkhî sorularınıza; özet, dört mezhebin görüşleri, ilgili ayet ve hadisler gibi bölümleri içeren, kaynaklı ve yapılandırılmış cevaplar alın.
* **Cevabı Dışa Aktarma:** Aldığınız cevapları kolayca paylaşmak için resim formatında (.png) indirin.

#### 📜 Risale-i Nur'da Ara
* **Bağlamsal Arama:** Sorularınıza doğrudan Risale-i Nur Külliyatı'ndan, yapay zeka destekli ve kaynaklı cevaplar bulun.
* **Sunum Olarak İndirme:** Arama sonuçlarını görsel olarak zengin bir sunum kartı olarak indirin.

#### 🌙 Namaz Vakitleri
* **Otomatik ve Manuel Konum:** Bulunduğunuz konuma göre veya manuel olarak aradığınız herhangi bir yer için namaz vakitlerini görüntüleyin.
* **Geri Sayım:** Bir sonraki namaz vaktine kalan süreyi anlık olarak takip edin.
* **Takvim:** Miladi, Rumi ve Hicri takvim bilgilerini bir arada görün.

#### 🌐 Ortak Özellikler
* **Lügat (Sözlük):** Ekranın köşesinde sürekli duran, sürükle-bırak özellikli yapay zeka destekli bir sözlük aracı.
* **Karanlık Mod:** Göz yormayan bir arayüz için karanlık tema seçeneği.
* **Yedekle & Geri Yükle:** Tüm uygulama verilerinizi (geçmiş, ayarlar, ilerleme) tek bir kod ile yedekleyin ve başka bir cihaza kolayca aktarın.
* **Paylaşım Özelliği:** Arama sonuçlarını ve namaz vakitlerini sıkıştırılmış özel bir link ile arkadaşlarınızla paylaşın.
* **Lokal Depolama:** Tüm verileriniz güvenli ve gizli bir şekilde tarayıcınızda saklanır, herhangi bir üyelik gerektirmez.

---

## 🛠️ Kullanılan Teknolojiler

* **Frontend:** React 19 & TypeScript
* **Build Aracı:** Vite
* **Yapay Zeka Modeli:** Google Gemini Pro
* **Stil:** TailwindCSS
* **API'lar:**
    * Tüm yapay zeka fonksiyonları için `@google/genai`
    * Kur'an verileri için `api.alquran.cloud`
    * Namaz vakitleri için `api.aladhan.com`
* **Kütüphaneler:** API istekleri için `axios`, veri sıkıştırma için `pako`, resim çıktısı için `html-to-image`.

---

## 🚀 Yerel Kurulum (Local Setup)

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Repository'yi Klonlayın:**
    ```sh
    git clone [https://github.com/katimur94/Kur-an-Hadis-Merkezi.git](https://github.com/katimur94/Kur-an-Hadis-Merkezi.git)
    cd Kur-an-Hadis-Merkezi
    ```

2.  **Gerekli Paketleri Yükleyin:**
    ```sh
    npm install
    ```

3.  **API Anahtarını Ayarlayın:**
    * Projenin ana dizininde `.env.local` adında bir dosya oluşturun.
    * Dosyanın içine Google Gemini API anahtarınızı aşağıdaki gibi ekleyin:
        ```
        VITE_API_KEY=SIZIN_GEMINI_API_ANAHTARINIZ
        ```

4.  **Geliştirme Sunucusunu Başlatın:**
    ```sh
    npm run dev
    ```
    Uygulama artık `http://localhost:5173` (veya benzer bir port) adresinde çalışıyor olacaktır.

---

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakabilirsiniz.

---

## ✍️ Geliştirici

* **Timur Kalaycı** - *Proje Sahibi*
* GitHub: [@katimur94](https://github.com/katimur94)
