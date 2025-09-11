"use client";

import React, { useState, useRef } from 'react';
import { Track } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { simpleAudioPlayer } from '@/services/SimpleAudioPlayer';

interface AudioUploaderProps {
  onTrackUploaded: (track: Track) => void;
  className?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onTrackUploaded,
  className = "",
}) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a'];

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    processAudioFile(file);
  };

  const processAudioFile = async (file: File) => {
    console.log('🎵 Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type - check both extension and MIME type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const supportedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mp4'];
    
    const isValidExtension = supportedFormats.includes(fileExtension);
    const isValidMimeType = supportedMimeTypes.some(type => file.type.includes(type));
    
    if (!isValidExtension && !isValidMimeType) {
      alert(`❌ Formato no soportado.\n\nArchivo: ${file.name}\nTipo: ${file.type}\n\nFormatos soportados: ${supportedFormats.join(', ')}\n\nIntenta con un archivo MP3 o WAV.`);
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert(`❌ Archivo muy grande.\n\nTamaño: ${Math.round(file.size / (1024 * 1024))}MB\nMáximo: 50MB\n\nUsa un archivo más pequeño.`);
      return;
    }

    console.log('✅ File validation passed');

    const trackId = `uploaded_${Date.now()}`;
    
    setUploadProgress({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    });

    try {
      // Simulate upload progress
      for (let i = 0; i <= 50; i += 10) {
        setUploadProgress(prev => prev ? { ...prev, progress: i } : null);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setUploadProgress(prev => prev ? { ...prev, status: 'processing', progress: 60 } : null);

      // Create audio URL for the file
      const audioUrl = URL.createObjectURL(file);
      
      setUploadProgress(prev => prev ? { ...prev, progress: 80 } : null);

      // Create Track object with file data
      const track: Track = {
        id: trackId,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        artist: 'Local File',
        duration: 180, // Default duration, will be updated when loaded
        bpm: 120, // Default BPM for uploaded files
        genre: 'Uploaded',
        year: new Date().getFullYear(),
        energy: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        vocalType: ['instrumental', 'vocal', 'mixed'][Math.floor(Math.random() * 3)] as 'instrumental' | 'vocal' | 'mixed',
        key: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)],
        mode: Math.random() > 0.5 ? 'major' : 'minor' as 'major' | 'minor',
        danceability: Math.random(),
        valence: Math.random(),
        acousticness: Math.random(),
        instrumentalness: Math.random(),
        // Audio-specific fields
        audioUrl: audioUrl,
        previewUrl: audioUrl,
      };

      setUploadProgress(prev => prev ? { ...prev, progress: 100, status: 'complete' } : null);

      // Call callback
      onTrackUploaded(track);

      // Clear progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);

      console.log(`🎵 Audio file uploaded successfully: ${file.name}`);
      
    } catch (error) {
      console.error('❌ Error processing audio file:', error);
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Clear error after 3 seconds
      setTimeout(() => {
        setUploadProgress(null);
      }, 3000);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
    
    // Only hide drag over if we're actually leaving the drop zone
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
    
    const files = e.dataTransfer.files;
    console.log('🎵 Files dropped:', files.length);
    
    if (files.length > 0) {
      handleFileSelect(files);
    } else {
      alert('❌ No se detectaron archivos. Intenta arrastrar un archivo de audio.');
    }
  };

  // Utility function for file size formatting (currently unused but kept for future use)
  // const formatFileSize = (bytes: number): string => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'uploading': return '⬆️';
      case 'processing': return '⚙️';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '📁';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'uploading': return 'text-blue-400';
      case 'processing': return 'text-yellow-400';
      case 'complete': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`p-6 border-2 border-dashed transition-all duration-300 cursor-pointer ${
          dragOver 
            ? 'border-blue-500 bg-blue-500/10 scale-105' 
            : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
        }`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center space-y-4">
          <div className={`text-4xl transition-transform duration-300 ${dragOver ? 'scale-125' : ''}`}>
            {dragOver ? '⬇️' : '🎵'}
          </div>
          
          <div>
            <h3 className={`font-semibold text-lg mb-2 transition-colors ${
              dragOver ? 'text-blue-400' : 'text-white'
            }`}>
              {dragOver ? '⬇️ Suelta tu archivo aquí' : 'Subir Archivo de Audio'}
            </h3>
            <p className="text-gray-400 text-sm">
              {dragOver 
                ? '¡Suelta el archivo MP3/WAV para cargarlo!' 
                : 'Arrastra archivo de audio o haz click para seleccionar'
              }
            </p>
            {dragOver && (
              <p className="text-blue-400 text-xs mt-2 animate-pulse">
                📁 Archivo detectado - suelta para cargar
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {supportedFormats.map((format) => (
              <Badge 
                key={format}
                variant="outline" 
                className="text-xs border-gray-600 text-gray-400"
              >
                {format.toUpperCase()}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-gray-500 text-xs">
              Máximo 50MB • Calidad recomendada: 320kbps o superior
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-400 text-xs font-medium mb-1">💡 Cómo usar:</p>
              <p className="text-gray-300 text-xs leading-relaxed">
                1. Arrastra un archivo MP3/WAV aquí<br/>
                2. Espera que se cargue<br/>
                3. Haz click en "→ A" o "→ B"<br/>
                4. Presiona ▶️ para escuchar
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={supportedFormats.join(',') + ',audio/*'}
        onChange={(e) => {
          console.log('📁 File input changed:', e.target.files);
          handleFileSelect(e.target.files);
        }}
        className="hidden"
      />

      {/* Drag and Drop Status */}
      {dragOver && (
        <div className="fixed inset-0 bg-blue-500/20 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-2xl animate-pulse">
            <div className="text-2xl mb-2 text-center">⬇️</div>
            <div className="text-lg font-bold">Suelta el archivo aquí</div>
            <div className="text-sm opacity-80">Para cargar tu música</div>
          </div>
        </div>
      )}

      {/* Quick Instructions */}
      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
        <h5 className="text-white text-sm font-medium mb-2">🎵 Test Rápido de Drag & Drop</h5>
        <div className="space-y-1 text-xs text-gray-400">
          <p>• <strong>Para probar drag & drop</strong>: Arrastra cualquier archivo MP3 desde tu computadora</p>
          <p>• <strong>Si no tienes MP3</strong>: Usa los "Demo Tracks" para generar audio de prueba</p>
          <p>• <strong>Problema con drag?</strong>: Haz click en el área azul para seleccionar archivo</p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress && (
        <Card className="p-4 bg-gray-800 border-gray-700">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{getStatusIcon(uploadProgress.status)}</span>
                <span className={`font-medium ${getStatusColor(uploadProgress.status)}`}>
                  {uploadProgress.status === 'uploading' ? 'Subiendo...' :
                   uploadProgress.status === 'processing' ? 'Procesando...' :
                   uploadProgress.status === 'complete' ? 'Completado' :
                   'Error'}
                </span>
              </div>
              <span className="text-gray-400 text-sm">
                {uploadProgress.progress}%
              </span>
            </div>

            {/* File info */}
            <div>
              <p className="text-white text-sm font-medium truncate">
                {uploadProgress.fileName}
              </p>
              {uploadProgress.error && (
                <p className="text-red-400 text-xs mt-1">
                  Error: {uploadProgress.error}
                </p>
              )}
            </div>

            {/* Progress bar */}
            <Progress 
              value={uploadProgress.progress} 
              className="w-full"
            />

            {/* Status messages */}
            <div className="text-xs text-gray-400">
              {uploadProgress.status === 'uploading' && 'Cargando archivo...'}
              {uploadProgress.status === 'processing' && 'Analizando audio y extrayendo metadatos...'}
              {uploadProgress.status === 'complete' && '¡Archivo listo para usar en los decks!'}
              {uploadProgress.status === 'error' && 'Error procesando archivo. Intenta de nuevo.'}
            </div>
          </div>
        </Card>
      )}

      {/* Demo Tracks */}
      <Card className="p-4 bg-gray-800 border-gray-700">
        <h4 className="text-white font-medium mb-3">🎵 Tracks de Demostración</h4>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
          <p className="text-green-400 text-sm font-medium mb-1">🎧 ¡Prueba Audio Inmediato!</p>
          <p className="text-gray-300 text-xs leading-relaxed">
            Haz click en cualquier botón para generar un tono de prueba.<br/>
            Luego carga al deck y presiona ▶️ para escuchar audio real.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Bass Test', freq: 60, duration: 15 },
            { name: 'Mid Test', freq: 440, duration: 15 },
            { name: 'High Test', freq: 1000, duration: 15 },
            { name: 'Beep Test', freq: 800, duration: 10 }
          ].map((demo, index) => (
            <Button
              key={index}
              onClick={() => {
                const trackId = `demo_${demo.freq}_${Date.now()}`;
                const audioUrl = simpleAudioPlayer.generateDemoAudio(demo.freq, demo.duration);
                
                if (audioUrl) {
                  const track: Track = {
                    id: trackId,
                    title: demo.name,
                    artist: 'Flowstate Generator',
                    duration: demo.duration,
                    bpm: 120,
                    genre: 'Test Tone',
                    year: 2024,
                    energy: 'medium',
                    vocalType: 'instrumental',
                    key: 'C',
                    mode: 'major',
                    danceability: 0.5,
                    valence: 0.5,
                    acousticness: 0,
                    instrumentalness: 1,
                    audioUrl: audioUrl,
                    previewUrl: audioUrl,
                  };
                  
                  onTrackUploaded(track);
                  alert(`🎵 Demo track "${demo.name}" generado!\n\n🔊 Carga al deck y presiona PLAY para escuchar el tono de ${demo.freq}Hz`);
                } else {
                  alert('❌ Error generando demo track');
                }
              }}
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              🎵 {demo.name}
            </Button>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs">Prueba Audio Directo:</span>
            <Button
              onClick={async () => {
                try {
                  console.log('🔊 Testing direct audio...');
                  const audio = new Audio();
                  audio.volume = 0.5;
                  
                  // Generate immediate beep
                  const sampleRate = 22050;
                  const duration = 1;
                  const frequency = 800;
                  const samples = sampleRate * duration;
                  
                  // Simple WAV generation
                  const buffer = new ArrayBuffer(44 + samples * 2);
                  const view = new DataView(buffer);
                  
                  // Minimal WAV header
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
                    const sample = Math.sin(frequency * 2 * Math.PI * t) * 0.5;
                    const intSample = Math.max(-32767, Math.min(32767, sample * 32767));
                    view.setInt16(44 + i * 2, intSample, true);
                  }

                  const blob = new Blob([buffer], { type: 'audio/wav' });
                  const url = URL.createObjectURL(blob);
                  
                  audio.src = url;
                  await audio.play();
                  
                  alert('🔊 ¡Audio funcionando! Si escuchaste el beep, tu sistema de audio está listo.\n\nAhora puedes subir archivos MP3/WAV y escucharlos en los decks.');
                } catch (error) {
                  console.error('Direct audio test failed:', error);
                  alert('❌ Audio no disponible.\n\nPosibles causas:\n• Navegador bloquea auto-play\n• Audio silenciado\n• Permisos de audio\n\nIntenta hacer click primero en la página.');
                }
              }}
              size="sm"
              className="h-6 px-3 text-xs bg-green-500 hover:bg-green-600"
            >
              🔊 Test Inmediato
            </Button>
          </div>
          <p className="text-gray-500 text-xs">
            Los tracks de demo son tonos puros para probar el sistema de audio
          </p>
        </div>
      </Card>
    </div>
  );
};