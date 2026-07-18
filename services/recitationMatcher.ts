// Live-Matching der Rezitation gegen die Mushaf-Seite.
// Aus QuranRecitationChecker extrahiert, damit die Logik testbar bleibt.

export type MatchStatus = 'correct' | 'skipped';

/**
 * Entfernt Harekat UND alle Uthmani-/Koran-Annotationen für den Vergleich.
 * Der Seitentext (quran-uthmani) enthält Zeichen, die kein ASR-Transkript je
 * liefert: Wasla (U+0671), Dagger-Alif (U+0670), kleine Hochbuchstaben und
 * Pausen-/Sajda-/Hizb-Zeichen (U+06D6–U+06ED), erweiterte Harekat
 * (U+064B–U+065F, U+0610–U+061A, U+08D3–U+08FF), Tatweel und BOM.
 * Ohne deren Entfernung scheitern v. a. kurze Wörter (بِهِۦ, لَهُۥ) am Match.
 */
export const normalizeText = (text: string): string =>
    text
        .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u08D3-\u08FF\uFEFF]/g, '')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .trim();

export const levenshtein = (a: string, b: string): number => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i += 1) { matrix[0][i] = i; }
    for (let j = 0; j <= b.length; j += 1) { matrix[j][0] = j; }
    for (let j = 1; j <= b.length; j += 1) {
        for (let i = 1; i <= a.length; i += 1) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
        }
    }
    return matrix[b.length][a.length];
};

/**
 * Längenabhängige Ähnlichkeit auf bereits normalisierten Wörtern:
 * kurze Wörter (≤2) müssen exakt stimmen, 3–4 Zeichen erlauben Distanz 1,
 * längere eine relative Distanz von max. 0.4.
 */
export const isNormalizedMatch = (spoken: string, target: string): boolean => {
    if (!spoken || !target) return false;
    if (spoken === target) return true;
    const maxLen = Math.max(spoken.length, target.length);
    if (Math.min(spoken.length, target.length) <= 2) return false; // exakter Match war nötig
    const distance = levenshtein(spoken, target);
    if (maxLen <= 4) return distance <= 1;
    return distance / maxLen <= 0.4;
};

export const isWordMatch = (spoken: string, target: string): boolean =>
    isNormalizedMatch(normalizeText(spoken), normalizeText(target));

// Kleines Fenster gegen False-Positives bei sich wiederholenden Koranphrasen.
const SEARCH_WINDOW = 6;
// Erweiterte Suche für den Resync nach Erkennungslücken (Android-Restarts):
// erst wenn zwei aufeinanderfolgende gesprochene Wörter weiter vorn im Text
// nebeneinander wiedergefunden werden, springt der Cursor dorthin.
const RESYNC_WINDOW = 30;
const RESYNC_AFTER_MISSES = 2;

export interface RecitationMatcher {
    /**
     * Verarbeitet das aktuelle Transcript und liefert die Wort-Status der Session.
     * Finale Wörter werden inkrementell konsumiert; nur wenn sich der bereits
     * verarbeitete finale Teil rückwirkend ändert, wird neu gematcht.
     * 'skipped' wird nur aus finalen (bestätigten) Results vergeben.
     */
    update(finalTranscript: string, interimTranscript: string): Record<number, MatchStatus>;
}

export const createRecitationMatcher = (
    pageWords: string[],
    sessionWordStatuses: Record<number, 'correct'>
): RecitationMatcher => {
    const normalizedPageWords = pageWords.map(normalizeText);
    // Reine Symbol-Tokens (Hizb-Zeichen ۞, Sajda ۩, alleinstehende Pausenzeichen)
    // normalisieren zu '' — sie sind "transparent": nie sprechbar, werden beim
    // Vorbeikommen automatisch als gelesen markiert und blockieren das Fenster nicht.
    const isTransparent = (idx: number): boolean => normalizedPageWords[idx] === '';

    let startIndex = 0;
    while (startIndex < pageWords.length && (sessionWordStatuses[startIndex] || isTransparent(startIndex))) startIndex++;

    const baseStatuses = (): Record<number, MatchStatus> => {
        const base: Record<number, MatchStatus> = {};
        for (let i = startIndex; i < pageWords.length; i++) {
            if (isTransparent(i)) base[i] = 'correct';
        }
        return base;
    };

    let cursor = startIndex;
    let committed: Record<number, MatchStatus> = baseStatuses();
    let processedFinalWords: string[] = [];
    // Zuletzt nicht zuordenbare (finale) Wörter — Grundlage für den Resync.
    let missBuffer: string[] = [];

    interface MatchState {
        cursor: number;
        misses: string[];
    }

    /** Sucht `word` im Fenster ab `state.cursor`; markiert Treffer und Übersprungenes. */
    const matchOne = (
        word: string,
        state: MatchState,
        statuses: Record<number, MatchStatus>,
        markSkipped: boolean,
        allowResync: boolean
    ): void => {
        const normalized = normalizeText(word);
        if (!normalized) return;
        let slots = 0;
        let p = state.cursor;
        while (p < pageWords.length && slots < SEARCH_WINDOW) {
            if (isTransparent(p)) { p++; continue; }
            if (isNormalizedMatch(normalized, normalizedPageWords[p])) {
                if (markSkipped) {
                    for (let s = state.cursor; s < p; s++) {
                        if (!isTransparent(s) && statuses[s] !== 'correct') statuses[s] = 'skipped';
                    }
                }
                statuses[p] = 'correct';
                state.cursor = p + 1;
                state.misses = [];
                return;
            }
            slots++;
            p++;
        }

        // Kein Treffer im normalen Fenster.
        state.misses.push(normalized);
        if (state.misses.length > RESYNC_AFTER_MISSES) state.misses = state.misses.slice(-RESYNC_AFTER_MISSES);

        // Resync: Durch Erkennungs-Restarts (v. a. Android) können ganze Passagen im
        // Transcript fehlen; dann liegt die aktuelle Position weiter vorn im Text, als
        // das Fenster reicht. Erst wenn zwei Miss-Wörter in Folge als benachbartes Paar
        // im erweiterten Fenster auftauchen, springen wir dorthin — die übersprungenen
        // Wörter bleiben unmarkiert (sie wurden nicht zwingend ausgelassen, sondern
        // womöglich nur nicht gehört).
        if (allowResync && state.misses.length >= RESYNC_AFTER_MISSES) {
            const [first, second] = state.misses.slice(-2);
            let q = state.cursor;
            let scanned = 0;
            while (q < pageWords.length - 1 && scanned < RESYNC_WINDOW) {
                if (!isTransparent(q)) {
                    let next = q + 1;
                    while (next < pageWords.length && isTransparent(next)) next++;
                    if (
                        next < pageWords.length &&
                        isNormalizedMatch(first, normalizedPageWords[q]) &&
                        isNormalizedMatch(second, normalizedPageWords[next])
                    ) {
                        statuses[q] = 'correct';
                        statuses[next] = 'correct';
                        state.cursor = next + 1;
                        state.misses = [];
                        return;
                    }
                    scanned++;
                }
                q++;
            }
        }
    };

    const matchWords = (
        words: string[],
        state: MatchState,
        statuses: Record<number, MatchStatus>,
        markSkipped: boolean,
        allowResync: boolean
    ): void => {
        for (const word of words) {
            if (state.cursor >= pageWords.length) break;
            matchOne(word, state, statuses, markSkipped, allowResync);
        }
    };

    return {
        update(finalTranscript: string, interimTranscript: string): Record<number, MatchStatus> {
            const finalWords = finalTranscript.split(/\s+/).filter(Boolean);
            const prefixUnchanged =
                finalWords.length >= processedFinalWords.length &&
                processedFinalWords.every((w, i) => finalWords[i] === w);

            if (!prefixUnchanged) {
                // Recognition hat rückwirkend korrigiert → ab letztem stabilem Punkt (Session-Start) neu.
                cursor = startIndex;
                committed = baseStatuses();
                processedFinalWords = [];
                missBuffer = [];
            }

            const newWords = finalWords.slice(processedFinalWords.length);
            const finalState: MatchState = { cursor, misses: missBuffer };
            matchWords(newWords, finalState, committed, true, true);
            cursor = finalState.cursor;
            missBuffer = finalState.misses;
            processedFinalWords = finalWords;

            // Interim-Ergebnisse nur tentativ als 'correct' markieren — keine 'skipped'-Marker
            // und kein Resync, damit auf Android nichts flackert oder springt, bevor ein
            // finales Result es bestätigt.
            const tentative: Record<number, MatchStatus> = { ...committed };
            const interimWords = interimTranscript.split(/\s+/).filter(Boolean);
            const interimState: MatchState = { cursor, misses: [...missBuffer] };
            matchWords(interimWords, interimState, tentative, false, false);
            return tentative;
        },
    };
};
