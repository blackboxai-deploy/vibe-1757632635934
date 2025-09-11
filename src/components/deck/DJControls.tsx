"use client";

import React, { useState, useEffect } from 'react';
import { Track } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { simpleAudioPlayer, CuePoint, LoopInfo } from '@/services/SimpleAudioPlayer';

interface DJControlsProps {
  deckId: 'A' | 'B';
  currentTrack: Track | null;
  isPlaying: boolean;
  realAudioEnabled: boolean;
  className?: string;
}

export const DJControls: React.FC<DJControlsProps> = ({
  deckId,
  currentTrack,
  isPlaying,
  realAudioEnabled,
  className = "",
}) => {
  const [cuePoints, setCuePoints] = useState<CuePoint[]>([]);
  const [currentCue, setCurrentCue] = useState<number | null>(null);
  const [loopInfo, setLoopInfo] = useState<LoopInfo | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);

  // Update UI with deck info
  useEffect(() => {
    if (!realAudioEnabled || !currentTrack) return;

    const interval = setInterval(() => {
      const deckInfo = simpleAudioPlayer.getDeckInfo(deckId);
      setCuePoints(deckInfo.cuePoints);
      setCurrentCue(deckInfo.currentCue);
      setLoopInfo(deckInfo.loop);
      setIsSynced(deckInfo.isSynced);
      setIsLooping(deckInfo.isLooping);
      setBpm(deckInfo.bpm);
    }, 500);

    return () => clearInterval(interval);
  }, [deckId, currentTrack, realAudioEnabled]);

  const handleCueSet = () => {
    if (!realAudioEnabled || !currentTrack) return;

    const success = simpleAudioPlayer.setCuePoint(deckId);
    if (success) {
      const currentTime = simpleAudioPlayer.getCurrentTime(deckId);
      const timeFormatted = `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`;
      alert(`🎯 Cue Point Set!\n\nDeck ${deckId}\nTiempo: ${timeFormatted}\nTrack: ${currentTrack.title}\n\nUsa "JUMP" para volver a este punto.`);
    }
  };

  const handleCueJump = () => {
    if (!realAudioEnabled) return;
    
    const success = simpleAudioPlayer.jumpToCue(deckId);
    if (success) {
      console.log(`🎯 Jumped to cue on Deck ${deckId}`);
    } else {
      alert(`❌ No hay cue point establecido en Deck ${deckId}.\n\nPrimero presiona "SET CUE" para marcar un punto.`);
    }
  };

  const handleSync = () => {
    if (!realAudioEnabled || !currentTrack) return;

    simpleAudioPlayer.detectBPM(deckId, currentTrack.bpm);
    simpleAudioPlayer.toggleSync(deckId);
    
    const deckInfo = simpleAudioPlayer.getDeckInfo(deckId);
    if (deckInfo.isSynced) {
      alert(`🔒 Sync Activado!\n\nDeck ${deckId} sincronizado\nBPM: ${currentTrack.bpm}\nPlayback rate ajustado automáticamente`);
    } else {
      alert(`🔓 Sync Desactivado\n\nDeck ${deckId} vuelve a velocidad normal`);
    }
  };

  const handleLoop = (beats: number = 4) => {
    if (!realAudioEnabled || !currentTrack) return;

    if (!loopInfo) {
      // Create new loop
      simpleAudioPlayer.detectBPM(deckId, currentTrack.bpm);
      simpleAudioPlayer.setLoop(deckId, beats);
      simpleAudioPlayer.toggleLoop(deckId);
      
      alert(`🔄 Loop Creado!\n\nDeck ${deckId}\nLongitud: ${beats} beats\nTempo: ${currentTrack.bpm} BPM\n\n⚠️ Solo funciona durante reproducción`);
    } else {
      // Toggle existing loop
      simpleAudioPlayer.toggleLoop(deckId);
      const isActive = simpleAudioPlayer.isLooping(deckId);
      
      if (isActive) {
        alert(`🔄 Loop Activado!\n\n${loopInfo.length} beats\nRepitiendo sección actual`);
      } else {
        alert(`⏹️ Loop Desactivado`);
      }
    }
  };

  const handleLoopLength = (beats: number) => {
    if (!realAudioEnabled) return;
    
    simpleAudioPlayer.adjustLoopLength(deckId, beats);
    alert(`🔄 Loop ajustado a ${beats} beats`);
  };

  const handleClearCue = () => {
    simpleAudioPlayer.clearCuePoints(deckId);
    alert(`🗑️ Todos los cue points eliminados de Deck ${deckId}`);
  };

  const handleClearLoop = () => {
    simpleAudioPlayer.clearLoop(deckId);
    alert(`🗑️ Loop eliminado de Deck ${deckId}`);
  };

  return (
    <Card className={`p-4 bg-gray-800 border-gray-700 ${className}`}>
      <div className="space-y-3">
        
        {/* CUE Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">🎯 Cue Controls</span>
            {cuePoints.length > 0 && (
              <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
                {cuePoints.length} points
              </Badge>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={!currentTrack || !realAudioEnabled}
              className={`flex-1 ${
                cuePoints.length > 0
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={handleCueSet}
            >
              SET CUE
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              disabled={cuePoints.length === 0 || !realAudioEnabled}
              className="border-blue-600 text-blue-300 hover:bg-blue-700/20"
              onClick={handleCueJump}
            >
              JUMP
            </Button>
            
            {cuePoints.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-600 text-red-300 hover:bg-red-700/20 text-xs px-2"
                onClick={handleClearCue}
              >
                CLEAR
              </Button>
            )}
          </div>
        </div>

        {/* SYNC Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">🔄 Sync Controls</span>
            {isSynced && bpm && (
              <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                {bpm} BPM
              </Badge>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={!currentTrack || !realAudioEnabled}
              className={`flex-1 ${
                isSynced
                  ? 'border-green-500 text-green-400 bg-green-500/10'
                  : 'border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={handleSync}
            >
              {isSynced ? '🔒 SYNCED' : '🔄 SYNC'}
            </Button>
            
            {isSynced && (
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-600 text-red-300 hover:bg-red-700/20 text-xs px-2"
                onClick={() => {
                  simpleAudioPlayer.toggleSync(deckId);
                  alert(`🔓 Sync desactivado en Deck ${deckId}`);
                }}
              >
                UNLOCK
              </Button>
            )}
          </div>
        </div>

        {/* LOOP Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">🔁 Loop Controls</span>
            {isLooping && loopInfo && (
              <Badge variant="outline" className="text-xs border-orange-500 text-orange-400 animate-pulse">
                {loopInfo.length} beats
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={!currentTrack || !realAudioEnabled}
                className={`flex-1 ${
                  isLooping
                    ? 'border-orange-500 text-orange-400 bg-orange-500/10 animate-pulse'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => handleLoop(4)}
              >
                {isLooping ? '🔄 LOOPING' : '🔁 LOOP'}
              </Button>
              
              {loopInfo && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-600 text-red-300 hover:bg-red-700/20 text-xs px-2"
                  onClick={handleClearLoop}
                >
                  CLEAR
                </Button>
              )}
            </div>
            
            {/* Loop Length Buttons */}
            <div className="flex space-x-1">
              <span className="text-gray-400 text-xs self-center">Beats:</span>
              {[1, 2, 4, 8].map((beats) => (
                <Button
                  key={beats}
                  variant="outline"
                  size="sm"
                  disabled={!currentTrack || !realAudioEnabled}
                  className={`h-6 w-8 text-xs ${
                    loopInfo?.length === beats && isLooping
                      ? 'border-orange-500 text-orange-400 bg-orange-500/20'
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => handleLoop(beats)}
                >
                  {beats}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="pt-2 border-t border-gray-600 text-xs text-gray-400">
          <div className="flex items-center justify-between">
            <span>
              Status: {!realAudioEnabled ? 'Simulation' : !currentTrack ? 'No Track' : 'Ready'}
            </span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                realAudioEnabled && currentTrack ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span>{realAudioEnabled && currentTrack ? 'Live' : 'Mock'}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};