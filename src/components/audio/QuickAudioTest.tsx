"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { simpleAudioPlayer } from '@/services/SimpleAudioPlayer';

interface QuickAudioTestProps {
  className?: string;
}

export const QuickAudioTest: React.FC<QuickAudioTestProps> = ({
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);

  const playTestSound = async () => {
    if (isPlaying) {
      // Stop current test
      if (testAudio) {
        testAudio.pause();
        testAudio.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);

      // Method 1: Direct Audio Element (most compatible)
      const audio = new Audio();
      audio.volume = 0.3;
      
      // Generate a simple beep using data URL
      const beepUrl = generateBeepDataURL();
      audio.src = beepUrl;
      
      setTestAudio(audio);

      audio.onended = () => {
        setIsPlaying(false);
        setTestAudio(null);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setTestAudio(null);
        console.error('Direct audio test failed');
        
        // Fallback: Try with generated demo audio
        tryDemoAudioFallback();
      };

      await audio.play();
      console.log('🔊 Direct audio test playing!');
      
    } catch (error) {
      console.error('Audio test failed:', error);
      setIsPlaying(false);
      
      // Try fallback method
      tryDemoAudioFallback();
    }
  };

  const tryDemoAudioFallback = async () => {
    try {
      console.log('🔄 Trying demo audio fallback...');
      const demoUrl = simpleAudioPlayer.generateDemoAudio(800, 2); // 800Hz beep for 2 seconds
      
      if (demoUrl) {
        const audio = new Audio(demoUrl);
        audio.volume = 0.5;
        setTestAudio(audio);
        
        audio.onended = () => {
          setIsPlaying(false);
          setTestAudio(null);
        };

        await audio.play();
        console.log('🔊 Demo audio fallback playing!');
      } else {
        throw new Error('Demo audio generation failed');
      }
    } catch (error) {
      console.error('All audio methods failed:', error);
      setIsPlaying(false);
      alert('❌ Audio test failed. Check browser permissions and try again.');
    }
  };

  // Generate a simple beep using data URL (most compatible method)
  const generateBeepDataURL = (): string => {
    try {
      const sampleRate = 22050;
      const duration = 1; // 1 second
      const frequency = 800; // 800Hz beep
      const samples = sampleRate * duration;
      
      // Create WAV file data
      const buffer = new ArrayBuffer(44 + samples * 2);
      const view = new DataView(buffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples * 2, true);
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
      view.setUint32(40, samples * 2, true);

      // Generate sine wave
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const sample = Math.sin(frequency * 2 * Math.PI * t) * 0.3; // 30% volume
        const intSample = Math.max(-32767, Math.min(32767, sample * 32767));
        view.setInt16(44 + i * 2, intSample, true);
      }

      // Convert to data URL
      const blob = new Blob([buffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to generate beep:', error);
      return '';
    }
  };

  return (
    <Button
      onClick={playTestSound}
      variant={isPlaying ? 'destructive' : 'outline'}
      size="sm"
      className={`${className} ${
        isPlaying 
          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
          : 'border-green-500 text-green-400 hover:bg-green-500 hover:text-white'
      }`}
    >
      {isPlaying ? (
        <div className="flex items-center space-x-1">
          <span>🔊</span>
          <span>Stop Test</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1">
          <span>🎵</span>
          <span>Test Audio</span>
        </div>
      )}
    </Button>
  );
};