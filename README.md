<div align="center">
  <img src="URL_ZUM_BANNER_BILD_HIER_EINFÜGEN" alt="Dijital Medrese Banner">
  <h1 align="center">Dijital Medrese</h1>
  <p align="center">
    <strong>Yapay Zeka Destekli Kişisel İlim Rehberiniz</strong>
    <br />
    <a href="https://kuranvehadiskati.netlify.app/"><strong>» Live-Demo ansehen «</strong></a>
  </p>
</div>

---

## 📖 Über das Projekt

**Dijital Medrese** ist eine moderne, webbasierte Lernplattform für islamische Studien, die auf React, Vite und TypeScript aufbaut. Die Anwendung bietet eine breite Palette an interaktiven Modulen, die stark auf die **Google Gemini AI** für intelligente Suchen und Analysen zugreifen. Der Fokus liegt darauf, dem Benutzer ein interaktives und personalisiertes Erlebnis zu bieten, indem alle Fortschritte und Einstellungen direkt im Browser gespeichert werden.

---

## ✨ Hauptfunktionen

Die Plattform ist in mehrere leistungsstarke Module unterteilt:

#### 🕋 Kur'an-ı Kerim Okuyucu
* **Zwei Ansichtsmodi:** Wähle zwischen der traditionellen Mushaf-Ansicht und einer Meal-Ansicht mit türkischer Übersetzung unter jedem Vers.
* **Fortschrittlicher Audio-Player:** Höre einzelne Verse, Seiten, Suren oder ganze Cüz. Der aktuell gelesene Vers wird live hervorgehoben und die Seite blättert automatisch um.
* **Personalisierung:** Passe den Rezitator (Kârî), die arabische Schriftart und die Schriftgröße an.

#### 🕌 Kıraat Asistanı (Tajwid & Aussprache)
* **Spracherkennung:** Nimm deine Koranrezitation direkt im Browser auf.
* **Live-Feedback:** Korrekt ausgesprochene Wörter werden in Echtzeit markiert.
* **KI-Fehleranalyse:** Nach der Aufnahme analysiert die KI deine Aussprache und identifiziert Tajwid-Fehler.
* **Detaillierte Korrekturen:** Klicke auf fehlerhafte Wörter, um eine genaue Erklärung des Fehlers und der entsprechenden Tajwid-Regel zu erhalten.

#### 📚 Yapay Zeka ile Hadith-Suche
* **Themenbasierte Suche:** Finde relevante Hadithe zu jedem Thema mit Hilfe der KI.
* **Fiqh-Analyse:** Klicke auf einen Hadith, um eine KI-generierte Analyse der vier großen Rechtsschulen (Mezhep) zu diesem spezifischen Hadith zu erhalten.

#### ⚖️ Fıkıh Soru & Cevap
* **Detaillierte Antworten:** Stelle Fiqh-Fragen und erhalte strukturierte Antworten, die eine Zusammenfassung, die Ansichten der vier Rechtsschulen sowie relevante Koranverse und Hadithe mit Quellenangaben enthalten.
* **Export-Funktion:** Lade die Antworten als ansprechende Bildkarten herunter, um sie einfach zu teilen.

#### 📜 Risale-i Nur'da Ara
* **Kontextbezogene Suche:** Erhalte KI-gestützte Antworten auf deine Fragen direkt aus dem Risale-i Nur Külliyatı.
* **Präsentations-Download:** Lade die Ergebnisse als schön formatierte Präsentationskarte herunter.

#### 🌙 Namaz Vakitleri (Gebetszeiten)
* **Automatische & Manuelle Ortung:** Finde Gebetszeiten für deinen aktuellen Standort oder suche manuell nach jedem beliebigen Ort.
* **Countdown:** Sieh auf einen Blick die verbleibende Zeit bis zum nächsten Gebet.
* **Kalender:** Anzeige des Datums nach Miladi, Rumi und Hicri.

#### 🌐 Allgemeine Funktionen
* **Lügat (Wörterbuch):** Ein schwebendes, KI-gestütztes Wörterbuch, das jederzeit verfügbar ist.
* **Dark Mode:** Ein augenschonendes dunkles Design ist verfügbar.
* **Backup & Wiederherstellung:** Exportiere alle deine Daten (Verläufe, Fortschritte, Einstellungen) und importiere sie auf einem anderen Gerät.
* **Teilen-Funktion:** Teile Suchergebnisse und Gebetszeiten einfach über einen komprimierten Link.
* **Lokale Speicherung:** Alle deine Daten werden sicher und privat in deinem Browser gespeichert, es ist kein Login erforderlich.

---

## 🛠️ Technischer Stack

* **Frontend:** React 19 & TypeScript
* **Build-Tool:** Vite
* **KI-Modell:** Google Gemini Pro
* **Styling:** TailwindCSS
* **APIs:**
    * `@google/genai` für alle KI-Funktionen
    * `api.alquran.cloud` für Koran-Daten
    * `api.aladhan.com` für Gebetszeiten
* **Bibliotheken:** `axios` für API-Anfragen, `pako` für Datenkomprimierung, `html-to-image` für den Bildexport.

---

## 🚀 Lokale Installation

Um das Projekt lokal auszuführen, befolge diese Schritte:

1.  **Repository klonen:**
    ```sh
    git clone [https://github.com/DEIN_BENUTZERNAME/dijital-medrese.git](https://github.com/DEIN_BENUTZERNAME/dijital-medrese.git)
    cd dijital-medrese
    ```

2.  **Abhängigkeiten installieren:**
    ```sh
    npm install
    ```

3.  **API-Schlüssel einrichten:**
    * Erstelle eine `.env.local`-Datei im Hauptverzeichnis des Projekts.
    * Füge deinen Google Gemini API-Schlüssel hinzu:
        ```
        VITE_API_KEY=DEIN_GEMINI_API_SCHLÜSSEL
        ```

4.  **Entwicklungsserver starten:**
    ```sh
    npm run dev
    ```
    Die Anwendung sollte nun unter `http://localhost:5173` (oder einem ähnlichen Port) erreichbar sein.

---

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Weitere Informationen findest du in der `LICENSE`-Datei.

---

## ✍️ Autor

* **Timur Kalaycı** - *Projektentwicklung*
* GitHub: [@katimur94](https://github.com/katimur94)
