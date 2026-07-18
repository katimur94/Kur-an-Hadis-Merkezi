// Live-Matching der Rezitation gegen die Mushaf-Seite.
// Aus QuranRecitationChecker extrahiert, damit die Logik testbar bleibt.

export type MatchStatus = 'correct' | 'skipped';

/** Entfernt Harekat und vereinheitlicht Buchstabenvarianten für den Vergleich. */
export const normalizeText = (text: string): string =>
    text.replace(/[\u064B-\u0652]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();

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

    let startIndex = 0;
    while (startIndex < pageWords.length && sessionWordStatuses[startIndex]) startIndex++;

    let cursor = startIndex;
    let committed: Record<number, MatchStatus> = {};
    let processedFinalWords: string[] = [];

    const matchWords = (
        words: string[],
        fromCursor: number,
        statuses: Record<number, MatchStatus>,
        markSkipped: boolean
    ): number => {
        let cur = fromCursor;
        for (const word of words) {
            if (cur >= pageWords.length) break;
            const normalized = normalizeText(word);
            if (!normalized) continue;
            for (let i = 0; i < SEARCH_WINDOW && cur + i < pageWords.length; i++) {
                if (isNormalizedMatch(normalized, normalizedPageWords[cur + i])) {
                    if (markSkipped) {
                        for (let s = 0; s < i; s++) {
                            if (statuses[cur + s] !== 'correct') statuses[cur + s] = 'skipped';
                        }
                    }
                    statuses[cur + i] = 'correct';
                    cur += i + 1;
                    break;
                }
            }
        }
        return cur;
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
                committed = {};
                processedFinalWords = [];
            }

            const newWords = finalWords.slice(processedFinalWords.length);
            cursor = matchWords(newWords, cursor, committed, true);
            processedFinalWords = finalWords;

            // Interim-Ergebnisse nur tentativ als 'correct' markieren — keine 'skipped'-Marker,
            // damit auf Android nichts flackert, bevor ein finales Result sie bestätigt.
            const tentative: Record<number, MatchStatus> = { ...committed };
            const interimWords = interimTranscript.split(/\s+/).filter(Boolean);
            matchWords(interimWords, cursor, tentative, false);
            return tentative;
        },
    };
};
