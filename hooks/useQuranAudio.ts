import { useState, useRef, useEffect, useCallback } from 'react';
import { getJuzVerses, getSurahVerses } from '../services/api';
import type { PlaylistItem, CombinedAyah } from '../types';

export type PlaybackMode = 'juz' | 'surah' | 'page' | 'none';

interface UseQuranAudioProps {
    currentPage: number;
    setCurrentPage: (page: number) => void;
    reader: string;
    pageData: CombinedAyah[];
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export function useQuranAudio({
    currentPage,
    setCurrentPage,
    reader,
    pageData,
    isLoading,
    setIsLoading,
    setError
}: UseQuranAudioProps) {
    const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('none');
    const [activePlaybackId, setActivePlaybackId] = useState<number | null>(null);

    const audioRef = useRef<HTMLAudioElement>(null);
    const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
    const isAutoNavigating = useRef(false);

    const handleStop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        setIsPlaying(false);
        setPlaylist([]);
        setCurrentTrackIndex(-1);
        setPlaybackMode('none');
        setActivePlaybackId(null);
    }, []);

    const playTrack = useCallback(async (trackIndex: number) => {
        if (trackIndex < 0 || trackIndex >= playlist.length) {
            handleStop();
            return;
        }

        const track = playlist[trackIndex];
        if (!track || !track.audioUrl) {
            if (isPlaying) setCurrentTrackIndex(i => i + 1);
            return;
        }

        if (track.pageNumber !== currentPage) {
            isAutoNavigating.current = true;
            setCurrentPage(track.pageNumber);
        } else {
            if (audioRef.current) {
                audioRef.current.src = track.audioUrl;
                try {
                    await audioRef.current.play();
                    setIsPlaying(true);

                    // Media Session API for background/lock-screen controls
                    if ('mediaSession' in navigator) {
                        navigator.mediaSession.metadata = new MediaMetadata({
                            title: `Ayet ${track.ayahNumber}`,
                            artist: reader,
                            album: 'Dijital Medrese',
                            artwork: [
                                { src: '/favicon.ico', sizes: '192x192', type: 'image/png' }
                            ]
                        });

                        navigator.mediaSession.setActionHandler('play', handleMainPlayPause);
                        navigator.mediaSession.setActionHandler('pause', handleMainPlayPause);
                        navigator.mediaSession.setActionHandler('nexttrack', () => {
                            if (currentTrackIndex < playlist.length - 1) {
                                setCurrentTrackIndex(prev => prev + 1);
                            }
                        });
                        navigator.mediaSession.setActionHandler('previoustrack', () => {
                            if (currentTrackIndex > 0) {
                                setCurrentTrackIndex(prev => prev - 1);
                            }
                        });
                    }

                } catch (err: any) {
                    if (err.name !== 'AbortError') {
                        console.error("Audio play failed:", err);
                        handleStop();
                    }
                }
            }
        }
    }, [playlist, currentPage, isPlaying, handleStop, setCurrentPage]);

    useEffect(() => {
        if (isPlaying && currentTrackIndex !== -1) {
            playTrack(currentTrackIndex);

            // Nächsten Track vorladen — über EIN wiederverwendetes Element statt
            // pro Trackwechsel ein neues Audio-Objekt zu erzeugen (Memory/Bandbreite).
            if (currentTrackIndex + 1 < playlist.length) {
                const nextTrack = playlist[currentTrackIndex + 1];
                if (nextTrack && nextTrack.audioUrl) {
                    if (!preloadAudioRef.current) preloadAudioRef.current = new Audio();
                    preloadAudioRef.current.src = nextTrack.audioUrl;
                    preloadAudioRef.current.preload = 'auto';
                }
            }
        }
    }, [currentTrackIndex]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isAutoNavigating.current && !isLoading) {
            isAutoNavigating.current = false;
            if (isPlaying && currentTrackIndex !== -1) {
                playTrack(currentTrackIndex);
            }
        }
    }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAudioEnded = () => {
        if (currentTrackIndex < playlist.length - 1) {
            setCurrentTrackIndex(prevIndex => prevIndex + 1);
        } else {
            handleStop();
        }
    };

    const startPlayback = (newPlaylist: PlaylistItem[], mode: PlaybackMode, id: number | null, startIndex = 0) => {
        if (newPlaylist && newPlaylist.length > 0) {
            setPlaylist(newPlaylist);
            setCurrentTrackIndex(startIndex);
            setIsPlaying(true);
            setPlaybackMode(mode);
            if (id) setActivePlaybackId(id);
        } else {
            setError("Bu bölüm için okunacak ayet bulunamadı.");
        }
    };

    const handlePlayJuz = async (juzNumber: number) => {
        handleStop();
        setIsLoading(true);
        try {
            const newPlaylist = await getJuzVerses(juzNumber, reader);
            startPlayback(newPlaylist, 'juz', juzNumber);
        } catch {
            setError(`Cüz ${juzNumber} yüklenemedi.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlaySurah = async (surahNumber: number) => {
        handleStop();
        setIsLoading(true);
        try {
            const newPlaylist = await getSurahVerses(surahNumber, reader);
            startPlayback(newPlaylist, 'surah', surahNumber);
        } catch {
            setError(`Sure ${surahNumber} yüklenemedi.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayPage = (startIndex = 0) => {
        handleStop();
        const pagePlaylist = pageData.map(v => ({
            ayahNumber: v.number,
            audioUrl: v.audio,
            pageNumber: v.page,
        })).filter(item => item.audioUrl);
        startPlayback(pagePlaylist, 'page', currentPage, startIndex);
    };

    const handlePlaySingleAyah = (ayah: CombinedAyah) => {
        handleStop();
        const singleItemPlaylist = [{ ayahNumber: ayah.number, audioUrl: ayah.audio || '', pageNumber: ayah.page }];
        startPlayback(singleItemPlaylist, 'none', null);
    };

    const handleMainPlayPause = () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            if (currentTrackIndex !== -1 && playlist.length > 0) {
                audioRef.current?.play();
                setIsPlaying(true);
            } else {
                handlePlayPage(0);
            }
        }
    };

    const currentlyPlayingAyahNumber = playlist[currentTrackIndex]?.ayahNumber;

    return {
        audioRef,
        isPlaying,
        playbackMode,
        activePlaybackId,
        currentlyPlayingAyahNumber,
        handleAudioEnded,
        handleStop,
        handlePlayJuz,
        handlePlaySurah,
        handlePlayPage,
        handlePlaySingleAyah,
        handleMainPlayPause,
        isAutoNavigating: isAutoNavigating.current
    };
}
