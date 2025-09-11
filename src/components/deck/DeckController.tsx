"use client";

import React, { useEffect, useState } from 'react';
import { DeckState, Track } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { simpleAudioPlayer } from '@/services/SimpleAudioPlayer';
import { DJControls } from './DJControls';

interface DeckControllerProps {
  deck: DeckState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onPositionChange: (position: number) => void;
  onTrackLoad: (track: Track) => void;
  realAudioEnabled?: boolean;
  onSyncToggle?: () => void; // Callback to update both decks
  otherDeckSynced?: boolean; // State of the other deck
}

export const DeckController: React.FC<DeckControllerProps> = ({
  deck,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  onPositionChange,
  onTrackLoad,
  realAudioEnabled = true,
  onSyncToggle,
  otherDeckSynced = false,
}) => {
  const [realPosition, setRealPosition] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  // DJ Controls state
  const [cuePoints, setCuePoints] = useState<any[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [loopInfo, setLoopInfo] = useState<any>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  
  // Drag and Drop state
  const [dragOver, setDragOver] = useState(false);

  // Update real audio position
  useEffect(() => {
    if (!realAudioEnabled || !deck.currentTrack) return;

    const interval = setInterval(() => {
      const currentPos = simpleAudioPlayer.getCurrentTime(deck.id);
      setRealPosition(currentPos);
      onPositionChange(currentPos);
    }, 100);

    return () => clearInterval(interval);
  }, [deck.id, deck.currentTrack, realAudioEnabled, onPositionChange]);

  // Check audio readiness and set up event listeners
  useEffect(() => {
    if (!realAudioEnabled || !deck.currentTrack) return;

    setIsAudioReady(simpleAudioPlayer.isTrackLoaded(deck.id));

    // Set up audio event callbacks
    simpleAudioPlayer.setEventCallbacks(deck.id, {
      onTimeUpdate: (currentTime: number, duration: number) => {
        setRealPosition(currentTime);
        onPositionChange(currentTime);
      },
      onEnded: () => {
        onStop(); // Track ended, stop the deck
      },
      onCanPlay: () => {
        setIsAudioReady(true);
      },
      onError: (error: string) => {
        console.error(`Audio error on Deck ${deck.id}:`, error);
        setIsAudioReady(false);
      }
    });

  }, [deck.id, deck.currentTrack, realAudioEnabled, onPositionChange, onStop]);

  // Update DJ controls state
  useEffect(() => {
    if (!realAudioEnabled || !deck.currentTrack) return;

    const interval = setInterval(() => {
      const deckInfo = simpleAudioPlayer.getDeckInfo(deck.id);
      setCuePoints(deckInfo.cuePoints);
      setIsSynced(deckInfo.isSynced);
      setIsLooping(deckInfo.isLooping);
      setLoopInfo(deckInfo.loop);
      setBpm(deckInfo.bpm);
    }, 500);

    return () => clearInterval(interval);
  }, [deck.id, deck.currentTrack, realAudioEnabled]);

  // Drag and Drop handlers for deck
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're really leaving the deck area
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    try {
      // Try to get track data from drag
      const trackData = e.dataTransfer.getData('application/json');
      
      if (trackData) {
        const track = JSON.parse(trackData) as Track;
        console.log(`🎵 Track dropped on Deck ${deck.id}:`, track.title);
        onTrackLoad(track);
        alert(`🎵 Track cargado en Deck ${deck.id}!\n\n${track.title}\n${track.artist}\n${track.bpm} BPM`);
        return;
      }
      
      // Check for files (for audio upload directly to deck)
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileDropOnDeck(files[0]);
        return;
      }
      
      console.log('❌ No track data or files found in drop');
    } catch (error) {
      console.error('❌ Error handling drop on deck:', error);
    }
  };

  const handleFileDropOnDeck = async (file: File) => {
    const supportedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    const isAudioFile = supportedTypes.some(type => file.type.includes(type));
    
    if (!isAudioFile) {
      alert(`❌ Solo archivos de audio.\n\nArchivo: ${file.name}\nTipo: ${file.type}\n\nArrastra archivos MP3, WAV, OGG.`);
      return;
    }

    try {
      console.log(`🎵 Audio file dropped on Deck ${deck.id}:`, file.name);
      
      // Create audio URL
      const audioUrl = URL.createObjectURL(file);
      
      // Create track object
      const track: Track = {
        id: `deck_${deck.id}_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Dropped File',
        duration: 180, // Default, will update when loaded
        bpm: 120, // Default BPM for files dropped directly
        genre: 'Uploaded',
        year: new Date().getFullYear(),
        energy: 'medium',
        vocalType: 'mixed',
        key: 'C',
        mode: 'major',
        danceability: 0.7,
        valence: 0.6,
        acousticness: 0.3,
        instrumentalness: 0.5,
        audioUrl: audioUrl,
        previewUrl: audioUrl,
      };

      // Load directly to this deck
      onTrackLoad(track);
      
      // Pre-load audio
      if (realAudioEnabled) {
        simpleAudioPlayer.loadTrack(deck.id, audioUrl);
      }
      
      alert(`🎵 ¡Archivo cargado directamente!\n\n📁 ${file.name}\n🎛️ Deck ${deck.id}\n▶️ ¡Listo para reproducir!`);
      
    } catch (error) {
      console.error('Error processing dropped file:', error);
      alert(`❌ Error procesando archivo.\n\n${file.name}\n\nIntenta usar el uploader en la tab Upload.`);
    }
  };

  // Handle real audio controls
  const handleRealPlay = async () => {
    if (!realAudioEnabled || !deck.currentTrack) {
      onPlay(); // Fallback to simulation
      return;
    }

    try {
      // Check if we need to load the audio first
      if (!simpleAudioPlayer.isTrackLoaded(deck.id)) {
        // Try to load from audioUrl or previewUrl if available
        if (deck.currentTrack.audioUrl) {
          simpleAudioPlayer.loadTrack(deck.id, deck.currentTrack.audioUrl);
        } else if (deck.currentTrack.previewUrl) {
          simpleAudioPlayer.loadTrack(deck.id, deck.currentTrack.previewUrl);
        } else {
          // Generate a demo tone for tracks without audio
          const demoUrl = simpleAudioPlayer.generateDemoAudio(440, 30); // 440Hz for 30 seconds
          if (demoUrl) {
            simpleAudioPlayer.loadTrack(deck.id, demoUrl);
          }
        }
        
        // Wait a moment for loading
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const success = await simpleAudioPlayer.play(deck.id);
      if (success) {
        onPlay(); // Update UI state
        console.log(`🎵 Real audio playing on Deck ${deck.id}`);
      } else {
        console.warn(`⚠️ Audio failed, using simulation for Deck ${deck.id}`);
        onPlay(); // Fallback to simulation
      }
    } catch (error) {
      console.error('Error playing real audio:', error);
      onPlay(); // Fallback to simulation
    }
  };

  const handleRealPause = () => {
    if (!realAudioEnabled || !deck.currentTrack) {
      onPause();
      return;
    }

    simpleAudioPlayer.pause(deck.id);
    onPause();
  };

  const handleRealStop = () => {
    if (!realAudioEnabled || !deck.currentTrack) {
      onStop();
      return;
    }

    simpleAudioPlayer.stop(deck.id);
    onStop();
  };

  const handleRealVolumeChange = (volume: number) => {
    if (realAudioEnabled) {
      simpleAudioPlayer.setDeckVolume(deck.id, volume / 100);
    }
    onVolumeChange(volume);
  };

  // BPM visualization helpers
  const getBPMColor = (bpm: number): string => {
    if (bpm < 90) return 'text-blue-400'; // Chill/Ambient
    if (bpm < 110) return 'text-green-400'; // Hip Hop/Reggaeton
    if (bpm < 130) return 'text-yellow-400'; // House/Techno
    if (bpm < 150) return 'text-orange-400'; // Trance/Dubstep
    return 'text-red-400'; // Hardstyle/DnB
  };

  const getBPMCategory = (bpm: number): string => {
    if (bpm < 90) return 'Chill';
    if (bpm < 110) return 'Hip Hop';
    if (bpm < 130) return 'House';
    if (bpm < 150) return 'Trance';
    return 'Hard';
  };
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Use real position if available, otherwise use simulated position
  const currentPosition = realAudioEnabled && deck.currentTrack ? realPosition : deck.position;
  const progressPercentage = deck.currentTrack 
    ? (currentPosition / deck.currentTrack.duration) * 100
    : 0;

  return (
    <Card 
      className={`p-4 transition-all duration-300 ${
        dragOver 
          ? 'bg-blue-500/20 border-blue-500 border-2 scale-[1.02] shadow-xl shadow-blue-500/25' 
          : 'bg-gray-900 border-gray-700 hover:border-gray-600'
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Deck Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xl font-bold border-blue-500 text-blue-400">
            DECK {deck.id}
          </Badge>
          {deck.isPlaying && (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          )}
          {realAudioEnabled && isAudioReady && (
            <Badge variant="outline" className="text-xs border-green-500 text-green-400">
              🎵 REAL
            </Badge>
          )}
          {realAudioEnabled && !isAudioReady && (
            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-400">
              ⏳ LOADING
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="secondary" 
            className={`bg-gray-800 ${
              deck.currentTrack ? getBPMColor(deck.currentTrack.bpm) : 'text-gray-400'
            }`}
          >
            {deck.currentTrack?.bpm || '--'} BPM
          </Badge>
          {deck.currentTrack && (
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
              {getBPMCategory(deck.currentTrack.bpm)}
            </Badge>
          )}
        </div>
      </div>

      {/* Track Info with Drag & Drop Zone */}
      <div className={`mb-4 min-h-[80px] p-3 rounded-lg transition-all duration-300 ${
        dragOver 
          ? 'bg-blue-500/30 border-2 border-blue-400 border-dashed' 
          : 'bg-gray-800'
      }`}>
        {dragOver ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-2xl mb-2 animate-bounce">🎯</div>
              <p className="text-blue-300 font-semibold">
                Drop Track Here!
              </p>
              <p className="text-blue-400 text-sm">
                Loading to Deck {deck.id}
              </p>
            </div>
          </div>
        ) : deck.currentTrack ? (
          <div>
            <h3 className="text-white font-semibold text-lg truncate">
              {deck.currentTrack.title}
            </h3>
            <p className="text-gray-400 truncate">{deck.currentTrack.artist}</p>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="outline" className="text-xs">
                {deck.currentTrack.genre}
              </Badge>
              <span className="text-gray-500 text-sm">
                {formatTime(deck.currentTrack.duration)}
              </span>
              {deck.currentTrack.audioUrl && (
                <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                  🔊 Audio Ready
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-2xl mb-2">🎵</div>
              <p className="text-gray-500">
                <strong>Drag track here</strong><br />
                or select from search
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Drop zone for Deck {deck.id}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-white text-sm w-12">
            {formatTime(currentPosition)}
          </span>
          <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="text-white text-sm w-12">
            {deck.currentTrack ? formatTime(deck.currentTrack.duration) : '0:00'}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-3 mb-4">
        <Button
          onClick={deck.isPlaying ? handleRealPause : handleRealPlay}
          disabled={!deck.currentTrack || (realAudioEnabled && !isAudioReady)}
          size="lg"
          className={`w-16 h-16 rounded-full text-xl font-bold ${
            deck.isPlaying 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          } ${(!isAudioReady && realAudioEnabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {deck.isPlaying ? '⏸' : '▶'}
        </Button>
        <Button
          onClick={handleRealStop}
          disabled={!deck.currentTrack}
          size="lg"
          variant="outline"
          className="w-12 h-12 rounded-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
        >
          ⏹
        </Button>
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm">Volume</span>
          <span className="text-gray-400 text-sm">{deck.volume}%</span>
        </div>
        <Slider
          value={[deck.volume]}
          onValueChange={(value) => handleRealVolumeChange(value[0])}
          max={100}
          min={0}
          step={1}
          className="w-full"
        />
      </div>

      {/* Professional DJ Controls */}
      <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
        
        {/* CUE Controls */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={!deck.currentTrack}
            className={`${
              simpleAudioPlayer.hasCuePoints(deck.id)
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => {
              if (realAudioEnabled && deck.currentTrack) {
                simpleAudioPlayer.setCuePoint(deck.id);
                alert(`🎯 Cue point set at ${formatTime(simpleAudioPlayer.getCurrentTime(deck.id))}`);
              }
            }}
          >
            🎯 CUE
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            disabled={!simpleAudioPlayer.hasCuePoints(deck.id)}
            className="border-blue-600 text-blue-300 hover:bg-blue-700/20 text-xs px-2"
            onClick={() => {
              if (realAudioEnabled) {
                simpleAudioPlayer.jumpToCue(deck.id);
              }
            }}
          >
            JUMP
          </Button>
        </div>

        {/* SYNC Controls */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={!deck.currentTrack}
            className={`${
              isSynced || otherDeckSynced
                ? 'border-green-500 text-green-400 bg-green-500/10'
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => {
              if (realAudioEnabled && deck.currentTrack) {
                // Set BPM first for both decks
                simpleAudioPlayer.detectBPM(deck.id, deck.currentTrack.bpm);
                
                // Toggle dual sync (affects both decks)
                const syncActive = simpleAudioPlayer.toggleDualSync();
                
                // Notify parent to update both deck states
                onSyncToggle?.();
                
                if (syncActive) {
                  alert(`🔒 SYNC ACTIVADO EN AMBOS DECKS!\n\n🎵 Ambos decks ahora están sincronizados\n⚡ Las velocidades se ajustaron automáticamente\n🎚️ Usa el crossfader para mezclar sin problemas de tempo`);
                } else {
                  alert(`🔓 SYNC DESACTIVADO\n\n🎵 Ambos decks vuelven a velocidad normal\n⚡ Sincronización deshabilitada`);
                }
              }
            }}
          >
            {(isSynced || otherDeckSynced) ? '🔒 SYNCED' : '🔄 SYNC'}
          </Button>
          
          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
            {deck.currentTrack?.bpm || '--'} BPM
          </Badge>
        </div>

        {/* LOOP Controls */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={!deck.currentTrack}
            className={`${
              simpleAudioPlayer.isLooping(deck.id)
                ? 'border-orange-500 text-orange-400 bg-orange-500/10 animate-pulse'
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => {
              if (realAudioEnabled && deck.currentTrack) {
                // Set BPM and create loop if needed
                if (!simpleAudioPlayer.getDeckInfo(deck.id).loop) {
                  simpleAudioPlayer.detectBPM(deck.id, deck.currentTrack.bpm);
                  simpleAudioPlayer.setLoop(deck.id, 4); // 4-beat loop
                }
                
                simpleAudioPlayer.toggleLoop(deck.id);
                const isLooping = simpleAudioPlayer.isLooping(deck.id);
                const deckInfo = simpleAudioPlayer.getDeckInfo(deck.id);
                
                alert(isLooping 
                  ? `🔄 Loop activado: ${deckInfo.loop?.length} beats`
                  : `⏹️ Loop desactivado`
                );
              }
            }}
          >
            {simpleAudioPlayer.isLooping(deck.id) ? '🔄 LOOPING' : '🔁 LOOP'}
          </Button>
          
          {simpleAudioPlayer.isLooping(deck.id) && (
            <div className="flex space-x-1">
              {[1, 2, 4, 8].map((beats) => (
                <Button
                  key={beats}
                  variant="outline"
                  size="sm"
                  className="h-6 w-8 text-xs border-orange-600 text-orange-300 hover:bg-orange-700/20"
                  onClick={() => {
                    if (realAudioEnabled) {
                      simpleAudioPlayer.adjustLoopLength(deck.id, beats);
                      alert(`🔄 Loop ajustado a ${beats} beats`);
                    }
                  }}
                >
                  {beats}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex space-x-2">
            {simpleAudioPlayer.hasCuePoints(deck.id) && (
              <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs">
                {simpleAudioPlayer.getDeckInfo(deck.id).cuePoints.length} Cues
              </Badge>
            )}
            {simpleAudioPlayer.isSynced(deck.id) && (
              <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                Synced
              </Badge>
            )}
            {simpleAudioPlayer.isLooping(deck.id) && (
              <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs animate-pulse">
                Loop {simpleAudioPlayer.getDeckInfo(deck.id).loop?.length}B
              </Badge>
            )}
          </div>
          
          {realAudioEnabled && isAudioReady && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-400">Live</span>
            </div>
          )}
        </div>

        {/* Advanced DJ Controls Info */}
        <div className="bg-gray-800/50 rounded p-2 mt-2">
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>CUE:</span>
              <span>{cuePoints.length > 0 ? `${cuePoints.length} points` : 'Set position marker'}</span>
            </div>
            <div className="flex justify-between">
              <span>SYNC:</span>
              <span>{isSynced ? `Locked ${bpm} BPM` : 'Match tempo with other deck'}</span>
            </div>
            <div className="flex justify-between">
              <span>LOOP:</span>
              <span>{isLooping && loopInfo ? `${loopInfo.length}B active` : 'Repeat section'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Professional DJ Controls */}
      {realAudioEnabled && deck.currentTrack && (
        <div className="mt-4">
          <DJControls
            deckId={deck.id}
            currentTrack={deck.currentTrack}
            isPlaying={deck.isPlaying}
            realAudioEnabled={realAudioEnabled}
          />
        </div>
      )}
    </Card>
  );
};