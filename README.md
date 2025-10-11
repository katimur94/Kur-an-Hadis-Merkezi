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
* **Fortschrittlicher Audio-Player:** Höre einzelne Verse, Seiten, Suren oder ganze Cüz. Der aktuell gelesene Vers wird live hervorgehoben und die Seite blättert automatisch um.
* **Kişiselleştirme:** Dilediğiniz kâriyi, Arapça metin fontunu ve yazı tipi boyutunu kendi zevkinize göre ayarlayın.

#### 🕌 Kıraat Asistanı (Tecvid & Telaffuz)
* **Spracherkennung:** Nimm deine Koranrezitation direkt im Browser auf.
* **Canlı Geri Bildirim:** Doğru telaffuz ettiğiniz kelimeler okuma esnasında anlık olarak işaretlenir.
* **Yapay Zeka ile Hata Analizi:** Kayıt sonrası yapay zeka, okuyuşunuzu analiz ederek tecvid ve telaffuz hatalarını tespit eder.
* **Detaylı Düzeltmeler:** Hatalı kelimelere tıklayarak hatanın ne olduğunu, nasıl düzeltileceğini ve ilgili tecvid kuralını öğrenin.

#### 📚 Yapay Zeka ile Hadis Arama
* **Themenbasierte Suche:** Finde relevante Hadithe zu jedem Thema mit Hilfe der KI.
* **Fiqh-Analyse:** Klicke auf einen Hadith, um eine KI-generierte Analyse der vier großen Rechtsschulen (Mezhep) zu diesem spezifischen Hadith zu erhalten.

#### ⚖️ Fıkıh Soru & Cevap
* **Detaylı Cevaplar:** Fıkhî sorularınıza; özet, dört mezhebin görüşleri, ilgili ayet ve hadisler gibi bölümleri içeren, kaynaklı ve yapılandırılmış cevaplar alın.
* **Export-Funktion:** Lade die Antworten als ansprechende Bildkarten herunter, um sie einfach zu teilen.

#### 📜 Risale-i Nur'da Ara
* **Kontextbezogene Suche:** Erhalte KI-gestützte Antworten auf deine Fragen direkt aus dem Risale-i Nur Külliyatı.
* **Präsentations-Download:** Lade die Ergebnisse als schön formatierte Präsentationskarte herunter.

#### 🤲 Dua & Zikir Rehberi (Yeni!)
* **Duruma Özel Arama:** "Yemekten sonra okunacak dua" gibi duruma özel sorgularla Sünnet'ten duaları ve zikirleri yapay zeka ile bulun.
* **Kapsamlı Sonuçlar:** Her dua için Arapça metin, Latin harfleriyle okunuş, Türkçe anlam, kullanım bağlamı ve orijinal kaynaklarını (Ayet, Hadis vb.) bir arada görüntüleyin.
* **Çoklu Dışa Aktarma:** Duaları metin olarak kopyalayın, standart bir cevap kartı veya şık bir sunum kartı olarak indirin.

#### 🌙 Namaz Vakitleri (Gebetszeiten)
* **Automatische & Manuelle Ortung:** Finde Gebetszeiten für deinen aktuellen Standort oder suche manuell nach jedem beliebigen Ort.
* **Countdown:** Sieh auf einen Blick die verbleibende Zeit bis zum nächsten Gebet.
* **Kalender:** Anzeige des Datums nach Miladi, Rumi und Hicri.

#### 🌐 Ortak Özellikler
* **Lügat (Wörterbuch):** Ein schwebendes, KI-gestütztes Wörterbuch, das jederzeit verfügbar ist.
* **Karanlık Mod:** Ein augenschonendes dunkles Design ist verfügbar.
* **Backup & Wiederherstellung:** Exportiere alle deine Daten (Verläufe, Fortschritte, Einstellungen) und importiere sie auf einem anderen Gerät.
* **Teilen-Funktion:** Teile Suchergebnisse und Gebetszeiten einfach über einen komprimierten Link.
* **Lokale Speicherung:** Alle deine Daten werden sicher und privat in deinem Browser gespeichert, es ist kein Login erforderlich.

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
