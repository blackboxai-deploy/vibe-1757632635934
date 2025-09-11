"use client";

import React from 'react';
import { Track } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DraggableTrackCardProps {
  track: Track;
  onTrackSelect: (track: Track, deckId: 'A' | 'B') => void;
  selectedDeck?: 'A' | 'B';
  showLoadButtons?: boolean;
  className?: string;
}

export const DraggableTrackCard: React.FC<DraggableTrackCardProps> = ({
  track,
  onTrackSelect,
  selectedDeck = 'A',
  showLoadButtons = true,
  className = "",
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrackClick = () => {
    onTrackSelect(track, selectedDeck);
  };

  const createDragImage = (): HTMLElement => {
    const dragImg = document.createElement('div');
    dragImg.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
        border: 2px solid #3b82f6;
        border-radius: 12px;
        padding: 16px;
        color: white;
        font-family: system-ui;
        box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        min-width: 280px;
        backdrop-filter: blur(10px);
      ">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="font-size: 18px; margin-right: 8px;">🎵</div>
          <div style="font-weight: bold; font-size: 16px;">${track.title}</div>
        </div>
        <div style="color: #9ca3af; font-size: 14px; margin-bottom: 8px;">
          🎤 ${track.artist}
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="color: #60a5fa; font-size: 12px;">
            🥁 ${track.bpm} BPM • ⚡ ${track.energy.toUpperCase()}
          </div>
          <div style="
            background: #3b82f6;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
          ">
            → DECK ${selectedDeck}
          </div>
        </div>
      </div>
    `;
    return dragImg;
  };

  return (
    <Card 
      key={track.id}
      draggable={true}
      className={`p-3 bg-gray-800 border-gray-700 hover:bg-gray-700 cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${className}`}
      onClick={handleTrackClick}
      onDragStart={(e) => {
        console.log(`🎵 Starting drag: ${track.title} → Deck ${selectedDeck}`);
        
        // Set drag data
        e.dataTransfer.setData('application/json', JSON.stringify(track));
        e.dataTransfer.setData('text/plain', `${track.title} - ${track.artist}`);
        e.dataTransfer.effectAllowed = 'copy';
        
        // Create custom drag image
        const dragImg = createDragImage();
        dragImg.style.position = 'absolute';
        dragImg.style.top = '-2000px';
        dragImg.style.left = '-2000px';
        document.body.appendChild(dragImg);
        
        e.dataTransfer.setDragImage(dragImg, 140, 50);
        
        // Clean up drag image
        setTimeout(() => {
          if (document.body.contains(dragImg)) {
            document.body.removeChild(dragImg);
          }
        }, 0);
      }}
      onDragEnd={() => {
        console.log(`🎵 Drag ended: ${track.title}`);
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium truncate flex items-center space-x-2">
            <span className="cursor-grab">🎵</span>
            <span>{track.title}</span>
          </h4>
          <p className="text-gray-400 text-sm truncate">
            {track.artist}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="secondary" className="text-xs bg-gray-700">
              {track.genre}
            </Badge>
            <span className="text-gray-500 text-xs">
              {track.bpm} BPM
            </span>
            <Badge 
              className={`text-xs ${
                track.energy === 'high' ? 'bg-red-500' :
                track.energy === 'medium' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
            >
              {track.energy}
            </Badge>
          </div>
        </div>
        
        {showLoadButtons && (
          <div className="flex flex-col items-end space-y-1 ml-3">
            <span className="text-gray-400 text-sm">
              {formatTime(track.duration)}
            </span>
            <div className="flex space-x-1">
              <Button
                size="sm"
                className="h-6 px-2 text-xs bg-blue-500 hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onTrackSelect(track, 'A');
                }}
              >
                → A
              </Button>
              <Button
                size="sm"
                className="h-6 px-2 text-xs bg-blue-500 hover:bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onTrackSelect(track, 'B');
                }}
              >
                → B
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drag Instructions Tooltip */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        🖱️ Drag to deck or click to load
      </div>
    </Card>
  );
};