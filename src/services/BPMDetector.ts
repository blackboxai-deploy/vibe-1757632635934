// BPM Detection Service - Análisis de tempo real para archivos de audio
// Implementación básica usando Web Audio API para detección de BPM

export class BPMDetector {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
    }
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('BPM Detector: AudioContext initialization failed', error);
    }
  }

  // Detect BMP from audio file (simplified implementation)
  async detectBPMFromFile(file: File): Promise<number> {
    if (!this.audioContext) {
      console.warn('BPM Detector: No audio context, using genre-based estimation');
      return this.estimateBPMFromFilename(file.name);
    }

    try {
      // Load and decode audio file
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Simplified BPM detection using basic peak analysis
      const bpm = this.analyzeBPM(audioBuffer);
      console.log(`🎵 Detected BPM: ${bpm} for ${file.name}`);
      
      return bpm;
    } catch (error) {
      console.warn('BPM detection failed, using estimation:', error);
      return this.estimateBPMFromFilename(file.name);
    }
  }

  // Simplified BPM analysis (real implementation would be much more complex)
  private analyzeBPM(audioBuffer: AudioBuffer): number {
    try {
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      // Analyze first 30 seconds for performance
      const analyzeLength = Math.min(channelData.length, sampleRate * 30);
      const chunkSize = 1024;
      
      // Find peaks and calculate intervals
      const peaks: number[] = [];
      let maxAmplitude = 0;
      
      // Find maximum amplitude first
      for (let i = 0; i < analyzeLength; i++) {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
      }
      
      const threshold = maxAmplitude * 0.3; // 30% of max as threshold
      
      // Find peaks
      for (let i = chunkSize; i < analyzeLength - chunkSize; i += chunkSize) {
        let chunkMax = 0;
        for (let j = i; j < i + chunkSize; j++) {
          chunkMax = Math.max(chunkMax, Math.abs(channelData[j]));
        }
        
        if (chunkMax > threshold) {
          peaks.push(i / sampleRate); // Convert to seconds
        }
      }
      
      // Calculate intervals between peaks
      const intervals: number[] = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i - 1]);
      }
      
      if (intervals.length === 0) {
        return 120; // Default fallback
      }
      
      // Find most common interval (simplified clustering)
      intervals.sort((a, b) => a - b);
      const medianInterval = intervals[Math.floor(intervals.length / 2)];
      
      // Convert interval to BPM
      const bpm = Math.round(60 / medianInterval);
      
      // Clamp to reasonable BPM range
      return Math.max(60, Math.min(200, bpm));
      
    } catch (error) {
      console.warn('BPM analysis failed:', error);
      return 120;
    }
  }

  // Estimate BPM based on genre hints in filename
  private estimateBPMFromFilename(filename: string): number {
    const name = filename.toLowerCase();
    
    // Genre-based BPM estimation
    if (name.includes('ambient') || name.includes('chill')) return 85;
    if (name.includes('hip') || name.includes('trap')) return 95;
    if (name.includes('reggaeton')) return 95;
    if (name.includes('house')) return 122;
    if (name.includes('techno')) return 132;
    if (name.includes('trance')) return 138;
    if (name.includes('dubstep')) return 140;
    if (name.includes('dnb') || name.includes('drum')) return 174;
    if (name.includes('hardstyle')) return 150;
    if (name.includes('psytrance')) return 145;
    
    // Default electronic music BPM
    return 128;
  }

  // Quick BPM estimation based on genre
  static estimateBPMByGenre(genre: string): number {
    switch (genre.toLowerCase()) {
      case 'ambient': return 85;
      case 'chillwave': return 85;
      case 'chill trap': return 75;
      case 'hip hop': return 90;
      case 'reggaeton': return 95;
      case 'tropical house': return 100;
      case 'future funk': return 115;
      case 'deep house': return 120;
      case 'minimal techno': return 120;
      case 'house': return 122;
      case 'french house': return 123;
      case 'afro house': return 124;
      case 'acid house': return 125;
      case 'synthwave': return 128;
      case 'progressive house': return 128;
      case 'big room': return 128;
      case 'electro swing': return 128;
      case 'uk garage': return 130;
      case 'techno': return 132;
      case 'industrial': return 135;
      case 'trance': return 138;
      case 'dubstep': return 140;
      case 'melodic dubstep': return 140;
      case 'psytrance': return 145;
      case 'hardstyle': return 150;
      case 'future bass': return 150;
      case 'breakbeat': return 160;
      case 'drum & bass': return 174;
      case 'liquid dnb': return 172;
      case 'neurofunk': return 174;
      default: return 128; // Standard electronic
    }
  }

  // Validate BPM accuracy
  static validateBPM(detectedBPM: number, expectedGenre: string): { isAccurate: boolean; suggestion: number } {
    const expectedBPM = this.estimateBPMByGenre(expectedGenre);
    const tolerance = 10; // ±10 BPM tolerance
    
    const isAccurate = Math.abs(detectedBPM - expectedBPM) <= tolerance;
    
    return {
      isAccurate,
      suggestion: expectedBPM
    };
  }
}

// Global instance
export const bpmDetector = new BPMDetector();