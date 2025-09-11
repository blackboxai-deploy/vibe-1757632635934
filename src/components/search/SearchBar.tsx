"use client";

import React, { useState, useMemo } from 'react';
import { Track } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DraggableTrackCard } from '@/components/common/DraggableTrackCard';

interface SearchBarProps {
  tracks: Track[];
  onTrackSelect: (track: Track, deckId: 'A' | 'B') => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  tracks,
  onTrackSelect,
  className = "",
}) => {
  const [query, setQuery] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<'A' | 'B'>('A');

  const filteredTracks = useMemo(() => {
    if (!query.trim()) return tracks;
    
    const searchTerm = query.toLowerCase().trim();
    return tracks.filter(track => 
      track.title.toLowerCase().includes(searchTerm) ||
      track.artist.toLowerCase().includes(searchTerm) ||
      track.genre.toLowerCase().includes(searchTerm)
    );
  }, [tracks, query]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrackClick = (track: Track) => {
    onTrackSelect(track, selectedDeck);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Header */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">Track Search</h2>
        
        {/* Deck Selection */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Load to:</span>
          <Button
            onClick={() => setSelectedDeck('A')}
            size="sm"
            variant={selectedDeck === 'A' ? 'default' : 'outline'}
            className={selectedDeck === 'A' 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }
          >
            Deck A
          </Button>
          <Button
            onClick={() => setSelectedDeck('B')}
            size="sm"
            variant={selectedDeck === 'B' ? 'default' : 'outline'}
            className={selectedDeck === 'B' 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }
          >
            Deck B
          </Button>
        </div>

        {/* Search Input */}
        <Input
          placeholder="Search tracks, artists, or genres..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
        />
      </div>

      {/* Search Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            {filteredTracks.length} tracks found
          </span>
          {query && (
            <Button
              onClick={() => setQuery('')}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white h-6 px-2"
            >
              Clear
            </Button>
          )}
        </div>

        {filteredTracks.map((track) => (
          <DraggableTrackCard
            key={track.id}
            track={track}
            onTrackSelect={onTrackSelect}
            selectedDeck={selectedDeck}
            showLoadButtons={true}
          />
        ))}

        {filteredTracks.length === 0 && query && (
          <div className="text-center py-8">
            <p className="text-gray-400">
              No tracks found matching "{query}"
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Try searching by artist, title, or genre
            </p>
          </div>
        )}
      </div>
    </div>
  );
};