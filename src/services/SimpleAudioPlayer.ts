// Simple Audio Player - Sistema de audio funcional y directo para Flowstate
// Usando HTML Audio API para máxima compatibilidad y funcionalidad inmediata

export interface CuePoint {
  time: number;
  label?: string;
  isActive: boolean;
}

export interface LoopInfo {
  start: number;
  end: number;
  isActive: boolean;
  length: number; // in beats
}

export interface DeckInfo {
  cuePoints: CuePoint[];
  currentCue: number | null;
  loop: LoopInfo | null;
  bpm: number | null;
  isSynced: boolean;
  isLooping: boolean;
}

export class SimpleAudioPlayer {
  private deckA: HTMLAudioElement | null = null;
  private deckB: HTMLAudioElement | null = null;
  private masterVolume: number = 0.8;
  private crossfaderPosition: number = 0; // -1 to 1
  
  // Professional DJ controls
  private deckInfo: { A: DeckInfo; B: DeckInfo } = {
    A: { cuePoints: [], currentCue: null, loop: null, bpm: null, isSynced: false, isLooping: false },
    B: { cuePoints: [], currentCue: null, loop: null, bpm: null, isSynced: false, isLooping: false }
  };

  constructor() {
    // Initialize only in browser
    if (typeof window !== 'undefined') {
      this.initializeDecks();
    }
  }

  private initializeDecks(): void {
    // Create audio elements for each deck
    this.deckA = new Audio();
    this.deckB = new Audio();

    // Configure audio elements
    if (this.deckA) {
      this.deckA.crossOrigin = 'anonymous';
      this.deckA.preload = 'auto';
      this.deckA.volume = 0.75;
    }

    if (this.deckB) {
      this.deckB.crossOrigin = 'anonymous';
      this.deckB.preload = 'auto';
      this.deckB.volume = 0.75;
    }

    console.log('🎵 Simple Audio Player initialized');
  }

  // Load track from URL
  loadTrack(deckId: 'A' | 'B', audioUrl: string): boolean {
    try {
      const deck = deckId === 'A' ? this.deckA : this.deckB;
      if (!deck) return false;

      deck.src = audioUrl;
      deck.load();

      console.log(`🎵 Track loaded to Deck ${deckId}: ${audioUrl}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to load track to Deck ${deckId}:`, error);
      return false;
    }
  }

  // Load track from File object
  loadTrackFromFile(deckId: 'A' | 'B', file: File): boolean {
    try {
      const deck = deckId === 'A' ? this.deckA : this.deckB;
      if (!deck) return false;

      const url = URL.createObjectURL(file);
      deck.src = url;
      deck.load();

      console.log(`🎵 File loaded to Deck ${deckId}: ${file.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to load file to Deck ${deckId}:`, error);
      return false;
    }
  }

  // Play deck
  async play(deckId: 'A' | 'B'): Promise<boolean> {
    try {
      const deck = deckId === 'A' ? this.deckA : this.deckB;
      if (!deck || !deck.src) return false;

      await deck.play();
      console.log(`▶️ Playing Deck ${deckId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to play Deck ${deckId}:`, error);
      return false;
    }
  }

  // Pause deck
  pause(deckId: 'A' | 'B'): boolean {
    try {
      const deck = deckId === 'A' ? this.deckA : this.deckB;
      if (!deck) return false;

      deck.pause();
      console.log(`⏸️ Paused Deck ${deckId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to pause Deck ${deckId}:`, error);
      return false;
    }
  }

  // Stop deck
  stop(deckId: 'A' | 'B'): boolean {
    try {
      const deck = deckId === 'A' ? this.deckA : this.deckB;
      if (!deck) return false;

      deck.pause();
      deck.currentTime = 0;
      console.log(`⏹️ Stopped Deck ${deckId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to stop Deck ${deckId}:`, error);
      return false;
    }
  }

  // Set deck volume (0-1)
  setDeckVolume(deckId: 'A' | 'B', volume: number): void {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    deck.volume = clampedVolume * this.masterVolume;
    console.log(`🔊 Deck ${deckId} volume: ${Math.round(clampedVolume * 100)}%`);
  }

  // Set master volume (0-1)
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // Update both decks with new master volume
    if (this.deckA) this.deckA.volume = this.deckA.volume * this.masterVolume;
    if (this.deckB) this.deckB.volume = this.deckB.volume * this.masterVolume;
    
    console.log(`🔊 Master volume: ${Math.round(this.masterVolume * 100)}%`);
  }

  // Set crossfader (-1 to 1)
  setCrossfader(position: number): void {
    this.crossfaderPosition = Math.max(-1, Math.min(1, position));
    
    if (this.deckA && this.deckB) {
      // Calculate volume for each deck based on crossfader
      const volumeA = position <= 0 ? 1 : Math.max(0, 1 - position);
      const volumeB = position >= 0 ? 1 : Math.max(0, 1 + position);
      
      this.deckA.volume = volumeA * this.masterVolume * 0.75;
      this.deckB.volume = volumeB * this.masterVolume * 0.75;
    }
    
    console.log(`🎚️ Crossfader: ${Math.round(this.crossfaderPosition * 100)}`);
  }

  // Get current time
  getCurrentTime(deckId: 'A' | 'B'): number {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    return deck?.currentTime || 0;
  }

  // Get duration
  getDuration(deckId: 'A' | 'B'): number {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    return deck?.duration || 0;
  }

  // Check if playing
  isPlaying(deckId: 'A' | 'B'): boolean {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    return deck ? !deck.paused && !deck.ended : false;
  }

  // Check if track is loaded
  isTrackLoaded(deckId: 'A' | 'B'): boolean {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    return deck ? deck.readyState >= 2 && !!deck.src : false;
  }

  // Seek to position
  seekTo(deckId: 'A' | 'B', time: number): void {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (deck && deck.duration) {
      deck.currentTime = Math.max(0, Math.min(deck.duration, time));
    }
  }

  // Set callbacks for events
  setEventCallbacks(
    deckId: 'A' | 'B',
    callbacks: {
      onTimeUpdate?: (currentTime: number, duration: number) => void;
      onEnded?: () => void;
      onError?: (error: string) => void;
      onCanPlay?: () => void;
    }
  ): void {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck) return;

    if (callbacks.onTimeUpdate) {
      deck.ontimeupdate = () => callbacks.onTimeUpdate!(deck.currentTime, deck.duration);
    }

    if (callbacks.onEnded) {
      deck.onended = callbacks.onEnded;
    }

    if (callbacks.onError) {
      deck.onerror = () => callbacks.onError!('Audio playback error');
    }

    if (callbacks.onCanPlay) {
      deck.oncanplay = callbacks.onCanPlay;
    }
  }

  // Generate demo audio (simple tone)
  generateDemoAudio(frequency: number, duration: number): string {
    // Create a simple sine wave using Web Audio API and return blob URL
    if (typeof window === 'undefined') return '';

    try {
      const sampleRate = 44100;
      const numSamples = sampleRate * duration;
      const buffer = new ArrayBuffer(44 + numSamples * 2); // WAV header + data
      const view = new DataView(buffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      // Generate sine wave data
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const sample = Math.sin(frequency * 2 * Math.PI * t) * 0.5;
        const intSample = Math.max(-32767, Math.min(32767, sample * 32767));
        view.setInt16(44 + i * 2, intSample, true);
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to generate demo audio:', error);
      return '';
    }
  }

  // CUE FUNCTIONALITY
  
  // Set cue point at current position
  setCuePoint(deckId: 'A' | 'B', label?: string): boolean {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const deckInfo = this.deckInfo[deckId];
    
    if (!deck || !deck.duration) return false;

    const cuePoint: CuePoint = {
      time: deck.currentTime,
      label: label || `Cue ${deckInfo.cuePoints.length + 1}`,
      isActive: true
    };

    deckInfo.cuePoints.push(cuePoint);
    deckInfo.currentCue = deckInfo.cuePoints.length - 1;

    console.log(`🎯 Cue point set on Deck ${deckId} at ${cuePoint.time.toFixed(2)}s`);
    return true;
  }

  // Jump to cue point
  jumpToCue(deckId: 'A' | 'B', cueIndex?: number): boolean {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const deckInfo = this.deckInfo[deckId];
    
    if (!deck || deckInfo.cuePoints.length === 0) return false;

    const targetCue = cueIndex !== undefined ? cueIndex : deckInfo.currentCue;
    if (targetCue === null || !deckInfo.cuePoints[targetCue]) return false;

    const cuePoint = deckInfo.cuePoints[targetCue];
    deck.currentTime = cuePoint.time;
    
    console.log(`🎯 Jumped to cue on Deck ${deckId}: ${cuePoint.label} (${cuePoint.time.toFixed(2)}s)`);
    return true;
  }

  // Preview cue point (play from cue while button held)
  async previewCue(deckId: 'A' | 'B'): Promise<boolean> {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const deckInfo = this.deckInfo[deckId];
    
    if (!deck || deckInfo.currentCue === null || !deckInfo.cuePoints[deckInfo.currentCue]) {
      // If no cue set, set one at current position and preview
      this.setCuePoint(deckId);
      return this.previewCue(deckId);
    }

    const cuePoint = deckInfo.cuePoints[deckInfo.currentCue];
    const originalTime = deck.currentTime;
    const wasPlaying = !deck.paused;

    try {
      deck.currentTime = cuePoint.time;
      deck.volume = deck.volume * 0.7; // Lower volume for preview
      await deck.play();
      
      console.log(`🎧 Previewing cue on Deck ${deckId}`);
      return true;
    } catch (error) {
      console.error(`❌ Cue preview failed on Deck ${deckId}:`, error);
      deck.currentTime = originalTime;
      if (wasPlaying) deck.play();
      return false;
    }
  }

  // Stop cue preview
  stopCuePreview(deckId: 'A' | 'B'): void {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    if (!deck) return;

    deck.pause();
    deck.volume = deck.volume / 0.7; // Restore original volume
    console.log(`🎧 Stopped cue preview on Deck ${deckId}`);
  }

  // SYNC FUNCTIONALITY

  // Detect BPM (simplified - in real app would use audio analysis)
  detectBPM(deckId: 'A' | 'B', bpm?: number): boolean {
    const deckInfo = this.deckInfo[deckId];
    
    if (bpm) {
      deckInfo.bpm = bpm;
    } else {
      // Use provided BPM or default for detection
      deckInfo.bpm = bpm || 128; // Standard electronic music BPM as default
    }
    
    console.log(`🎵 BPM detected on Deck ${deckId}: ${deckInfo.bpm}`);
    return true;
  }

  // Sync both decks together (master/slave relationship)
  syncBothDecks(): { success: boolean; masterDeck: 'A' | 'B' | null; slaveDeck: 'A' | 'B' | null } {
    const deckAInfo = this.deckInfo.A;
    const deckBInfo = this.deckInfo.B;
    const audioA = this.deckA;
    const audioB = this.deckB;
    
    // Check if both decks have audio and BPM
    if (!audioA || !audioB || !deckAInfo.bpm || !deckBInfo.bpm) {
      return { success: false, masterDeck: null, slaveDeck: null };
    }

    // Determine master (deck with lower BPM becomes slave to avoid extreme pitch changes)
    let masterDeck: 'A' | 'B';
    let slaveDeck: 'A' | 'B';
    
    if (deckAInfo.bpm <= deckBInfo.bpm) {
      masterDeck = 'B'; // Higher BPM is master
      slaveDeck = 'A';
    } else {
      masterDeck = 'A';
      slaveDeck = 'B';
    }

    const masterInfo = this.deckInfo[masterDeck];
    const slaveInfo = this.deckInfo[slaveDeck];
    const slaveAudio = slaveDeck === 'A' ? audioA : audioB;

    // Calculate playback rate for slave deck
    const playbackRate = masterInfo.bpm! / slaveInfo.bpm!;
    const clampedRate = Math.max(0.5, Math.min(2.0, playbackRate));
    
    // Apply sync
    slaveAudio.playbackRate = clampedRate;
    
    // Mark both as synced
    masterInfo.isSynced = true;
    slaveInfo.isSynced = true;
    
    console.log(`🔄 DUAL SYNC: Master=${masterDeck}(${masterInfo.bpm}), Slave=${slaveDeck}(${slaveInfo.bpm}→${masterInfo.bpm}), Rate=${clampedRate.toFixed(2)}`);
    
    return { success: true, masterDeck, slaveDeck };
  }

  // Toggle sync for both decks
  toggleDualSync(): boolean {
    const deckAInfo = this.deckInfo.A;
    const deckBInfo = this.deckInfo.B;
    
    // Check if any deck is currently synced
    const anyDeckSynced = deckAInfo.isSynced || deckBInfo.isSynced;
    
    if (anyDeckSynced) {
      // Disable sync on both decks
      if (this.deckA) this.deckA.playbackRate = 1.0;
      if (this.deckB) this.deckB.playbackRate = 1.0;
      
      deckAInfo.isSynced = false;
      deckBInfo.isSynced = false;
      
      console.log('🔓 Dual sync disabled - both decks at normal speed');
      return false; // Sync is now OFF
    } else {
      // Enable sync on both decks
      const result = this.syncBothDecks();
      return result.success; // Sync is now ON
    }
  }

  // Legacy method for single deck sync (now uses dual sync)
  toggleSync(deckId: 'A' | 'B'): boolean {
    return this.toggleDualSync();
  }

  // LOOP FUNCTIONALITY

  // Set loop at current position
  setLoop(deckId: 'A' | 'B', lengthInBeats: number = 4): boolean {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const deckInfo = this.deckInfo[deckId];
    
    if (!deck || !deck.duration || !deckInfo.bpm) return false;

    const secondsPerBeat = 60 / deckInfo.bpm;
    const loopLengthSeconds = lengthInBeats * secondsPerBeat;
    
    const loopStart = deck.currentTime;
    const loopEnd = Math.min(deck.duration, loopStart + loopLengthSeconds);

    deckInfo.loop = {
      start: loopStart,
      end: loopEnd,
      length: lengthInBeats,
      isActive: false
    };

    console.log(`🔄 Loop set on Deck ${deckId}: ${loopStart.toFixed(2)}s - ${loopEnd.toFixed(2)}s (${lengthInBeats} beats)`);
    return true;
  }

  // Toggle loop on/off
  toggleLoop(deckId: 'A' | 'B'): boolean {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const deckInfo = this.deckInfo[deckId];
    
    if (!deck || !deckInfo.loop) return false;

    deckInfo.isLooping = !deckInfo.isLooping;
    deckInfo.loop.isActive = deckInfo.isLooping;

    if (deckInfo.isLooping) {
      this.startLooping(deckId);
      console.log(`🔄 Loop activated on Deck ${deckId}`);
    } else {
      console.log(`⏹️ Loop deactivated on Deck ${deckId}`);
    }

    return true;
  }

  // Start looping mechanism
  private startLooping(deckId: 'A' | 'B'): void {
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    const deckInfo = this.deckInfo[deckId];
    
    if (!deck || !deckInfo.loop || !deckInfo.isLooping) return;

    const checkLoop = () => {
      if (!deckInfo.isLooping || !deckInfo.loop || deck.paused) return;
      
      if (deck.currentTime >= deckInfo.loop.end) {
        deck.currentTime = deckInfo.loop.start;
        console.log(`🔄 Loop jumped back on Deck ${deckId}`);
      }
      
      // Continue checking if still looping
      if (deckInfo.isLooping) {
        setTimeout(checkLoop, 50); // Check every 50ms for precision
      }
    };

    checkLoop();
  }

  // Adjust loop length
  adjustLoopLength(deckId: 'A' | 'B', newLengthInBeats: number): boolean {
    const deckInfo = this.deckInfo[deckId];
    
    if (!deckInfo.loop || !deckInfo.bpm) return false;

    const secondsPerBeat = 60 / deckInfo.bpm!;
    const newLoopLength = newLengthInBeats * secondsPerBeat;
    
    deckInfo.loop.end = deckInfo.loop.start + newLoopLength;
    deckInfo.loop.length = newLengthInBeats;

    console.log(`🔄 Loop length adjusted on Deck ${deckId}: ${newLengthInBeats} beats`);
    return true;
  }

  // Get deck info for UI
  getDeckInfo(deckId: 'A' | 'B'): DeckInfo {
    return this.deckInfo[deckId];
  }

  // Check if deck has cue points
  hasCuePoints(deckId: 'A' | 'B'): boolean {
    return this.deckInfo[deckId].cuePoints.length > 0;
  }

  // Check if deck is synced
  isSynced(deckId: 'A' | 'B'): boolean {
    return this.deckInfo[deckId].isSynced;
  }

  // Check if deck is looping
  isLooping(deckId: 'A' | 'B'): boolean {
    return this.deckInfo[deckId].isLooping;
  }

  // Clear all cue points
  clearCuePoints(deckId: 'A' | 'B'): void {
    this.deckInfo[deckId].cuePoints = [];
    this.deckInfo[deckId].currentCue = null;
    console.log(`🗑️ Cleared cue points on Deck ${deckId}`);
  }

  // Clear loop
  clearLoop(deckId: 'A' | 'B'): void {
    this.deckInfo[deckId].loop = null;
    this.deckInfo[deckId].isLooping = false;
    console.log(`🗑️ Cleared loop on Deck ${deckId}`);
  }

  // Cleanup
  cleanup(): void {
    if (this.deckA) {
      this.deckA.pause();
      this.deckA = null;
    }
    if (this.deckB) {
      this.deckB.pause();
      this.deckB = null;
    }
    
    // Reset deck info
    this.deckInfo.A = { cuePoints: [], currentCue: null, loop: null, bpm: null, isSynced: false, isLooping: false };
    this.deckInfo.B = { cuePoints: [], currentCue: null, loop: null, bpm: null, isSynced: false, isLooping: false };
  }
}

// Global instance
export const simpleAudioPlayer = new SimpleAudioPlayer();