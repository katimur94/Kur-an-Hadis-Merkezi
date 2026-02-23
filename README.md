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

**Dijital Medrese**, React, Vite ve TypeScript kullanılarak geliştirilmiş, modern bir İslami ilimler öğrenme platformudur. Uygulama, akıllı arama ve analiz yetenekleri için **Google Gemini 2.5 Flash / Pro AI**'dan yoğun bir şekilde faydalanan çeşitli interaktif modüller sunar. Kullanıcının tüm ilerlemesini ve ayarlarını doğrudan tarayıcıda saklayarak (Local Storage), giriş gerektirmeyen tamamen kişiselleştirilmiş ve gizlilik odaklı bir deneyim sunmayı hedefler.

---

## ✨ Devrim Niteligindeki Yeni Özellikler

Uygulama baştan aşağıya yenilendi ve birçok eşsiz zeka özelliği eklendi:

*   ✍️ **Global Not Defteri:** Gördüğünüz herhangi bir faydalı cümleyi text içerisinde fare ile seçin ve tek tıkla "Notlarım" köşesine atın. Tüm notlarınız ve Kur'an yer imleriniz tek bir menüden yönetilir.
*   📸 **Cevapları Resim Yap (PNG İhracı):** Yapay zekanın verdiği uzun, fıkhi ve tarihi cevapları artık kopyalamak yerine, şık bir PNG resim kartı olarak galerinize indirebilir ve WhatsApp'ta direkt paylaşabilirsiniz.
*   📷 **QR Kod ile Süper Hızlı Yedekleme:** Yeni veri yönetim sistemi "Pako" ile tüm verilerinizi (sohbet geçmişleri, notlar, ayarlar) tek bir Base64 stringine sıkıştırır. Verilerinizi dışa aktarırken ekrana çıkan QR Kodu başka bir cihazla okutarak saniyeler içinde devasa verileri aktarabilirsiniz!
*   🎙️ **Sesle Ayet Bulma:** Ezberinizde olan ama yerini unuttuğunuz ayeti mikrofon butonuna basarak okuyun. Sistem ayeti anında bulur ve Kur'an okuyucuda ilgili sayfaya atlar.
*   🎭 **Ruh Halime Göre Ayet (22 Farklı Duygu):** Üzgün, endişeli, pişman, yalnız, şaşkın... 22 farklı insan psikolojisine göre özel olarak seçilen teselli verici ayetler, arapça/türkçe metinleri ve yapay zekanın "Neden bu ayeti seçtim?" açıklamasıyla birlikte sunulur.
*   📑 **İnteraktif Fıkıh Listeleri:** "İslam'ın şartları nelerdir?" gibi madde madde fıkhi konularda yapay zeka artık metin yerine tıklanabilir, açılır-kapanır özel Akordeon Listeler oluşturur.

---

## 🧩 Temel Modüller

#### 🕋 Gelişmiş Kur'an Okuyucu
*   **İki Farklı Görünüm:** Geleneksel Mushaf düzeni ile her ayetin altında Türkçe mealinin yer aldığı "Meal Görünümü" arasında geçiş.
*   **Sensitif Sesli Okuma:** Cüz, Sure veya sayfa bazlı sesli dinleyin. Kelimeler hocanın okuyuş hızına göre anlık olarak renklenerek takip etmenizi sağlar.
*   **Tam Ekran Modu:** "Tam Ekran" butonuna basıp uygulamayı dijital bir kitaba dönüştürerek abdesthane / mescit ortamında odaklanarak okuyun.

#### 🕌 Kıraat Asistanı (Tecvid & Telaffuz Eğitmeni)
*   **Yapay Zeka Destekli Mikrafon Analizi:** Kur'an okuyuşunuzu mikrofona kaydedin. Sistem tecvid ve telaffuz hatalarınızı kırmızıyla işaretler.
*   **Tam Çözümleme:** Hatanın üzerine basarak, doğrusunun ne olduğunu ve hangi tecvid kuralını ihlal ettiğinizi öğrenin.

#### 📚 Dua, Hadis & Fıkıh Motoru
*   **Sentezlenmiş Araştırma:** Hadisleri ve fıkhi soruları aratın. Yapay zeka, 4 büyük mezhep imamının hükümlerini (Hanefi, Şafii, Maliki, Hanbeli), Kur'an ve Sünnet delilleriyle analiz ederek karşınıza getirsin.

#### 🕰️ Tarih & Risale
*   **Akıllı Zaman Çizelgesi:** Peygamberler tarihinde yüzyıllık interaktif zaman çizelgesiyle (Timeline) gezin.
*   **Risale-i Nur:** Risale-i Nur Okyanusunda kavramsal aramalar yapın.

#### ⏰ Namaz Vakitleri & Zikirmatik
*   **Canlı Vakitler:** Konumunuza göre vakitleri canlı izleyin ve sıradaki vakte kalan süreyi görün.
*   **Akıllı Sayaç:** Kendi zikir listenizi oluşturup sayaçlarıyla akıllı Zikirmatik'te virdinize devam edin.

#### 🔍 Sihirli Lügat
*   Ekrandaki yüzen Lügat ikonunda aradığınız (veya veritabanında olan) Osmanlıca/İslami kelimeler tüm uygulamadaki cevap metinlerinde **altı noktalı çizili** olarak işaretlenir. Üzerine geldiğinizde anında manasını hatırlatan bir baloncuk çıkar.

---

## 🛠️ Kullanılan Teknolojiler

*   **Frontend Çatısı:** React 19 & TypeScript
*   **Derleyici (Bundler):** Vite
*   **Yapay Zeka Beyni:** Google Gemini Pro & Flash (`@google/genai`)
*   **Tasarım & UI:** TailwindCSS, Headless UI
*   **Gelişmiş Kütüphaneler:** 
    *   Sıkıştırma algoritmaları için `pako`
    *   Görsel oluşturma için `html2canvas` ve `html-to-image`
    *   QR yönetimi için `qrcode.react` ve `html5-qrcode`
    *   API İstekleri için `axios`

---

## 🚀 Yerel Kurulum (Local Setup)

Projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Repository'yi Klonlayın:**
    ```sh
    git clone https://github.com/katimur94/Kur-an-Hadis-Merkezi.git
    cd Kur-an-Hadis-Merkezi
    ```

2.  **Gerekli Paketleri Yükleyin:**
    ```sh
    npm install
    ```

3.  **API Anahtarını Ayarlayın:**
    *   Projenin ana dizininde `.env.local` adında bir dosya oluşturun.
    *   Dosyanın içine Google Gemini API anahtarınızı aşağıdaki gibi ekleyin:
        ```env
        VITE_API_KEY=SIZIN_GEMINI_API_ANAHTARINIZ
        ```

4.  **Geliştirme Sunucusunu Başlatın:**
    ```sh
    npm run dev
    ```
    Uygulama artık `http://localhost:5173` adresinde çalışıyor olacaktır.

---

## 📄 Lisans
Bu proje MIT Lisansı altında lisanslanmıştır.

## ✍️ Geliştirici
*   **Timur Kalaycı** - *Proje Sahibi / Sistem Mimarı*
*   GitHub: [@katimur94](https://github.com/katimur94)
