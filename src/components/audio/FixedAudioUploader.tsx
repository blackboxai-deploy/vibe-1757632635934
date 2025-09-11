"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Track } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { simpleAudioPlayer } from '@/services/SimpleAudioPlayer';

interface FixedAudioUploaderProps {
  onTrackUploaded: (track: Track) => void;
  className?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export const FixedAudioUploader: React.FC<FixedAudioUploaderProps> = ({
  onTrackUploaded,
  className = "",
}) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragDepth, setDragDepth] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const supportedFormats = ['.mp3', '.wav', '.ogg', '.m4a'];
  const supportedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mp4', 'audio/x-m4a'];

  // Estimate BPM from filename keywords
  const estimateBPMFromFilename = (filename: string): number => {
    const name = filename.toLowerCase();
    
    // Look for BPM in filename first (e.g., "track_128bpm.mp3")
    const bpmMatch = name.match(/(\d+)\s*bpm/);
    if (bpmMatch) {
      const detectedBPM = parseInt(bpmMatch[1]);
      if (detectedBPM >= 60 && detectedBPM <= 200) {
        return detectedBPM;
      }
    }
    
    // Genre-based BPM estimation
    if (name.includes('ambient') || name.includes('chill')) return 85;
    if (name.includes('trap') || name.includes('hip')) return 95;
    if (name.includes('reggaeton')) return 95;
    if (name.includes('tropical')) return 100;
    if (name.includes('funk')) return 115;
    if (name.includes('house') && !name.includes('tech')) return 122;
    if (name.includes('garage')) return 130;
    if (name.includes('techno')) return 132;
    if (name.includes('trance')) return 138;
    if (name.includes('dubstep')) return 140;
    if (name.includes('hardstyle')) return 150;
    if (name.includes('drum') || name.includes('dnb')) return 174;
    
    // Default electronic music BPM
    return 128;
  };

  // Better drag and drop handling
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    // Prevent default drag behaviors on window
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const validateAndProcessFiles = (files: FileList | null) => {
    console.log('🎵 Processing files:', files?.length || 0);
    
    if (!files || files.length === 0) {
      alert('❌ No se detectaron archivos válidos.\n\nIntenta:\n• Arrastrar un archivo MP3/WAV\n• O usar el botón "Click to select"');
      return;
    }

    const file = files[0]; // Take first file only
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    processAudioFile(file);
  };

  const processAudioFile = async (file: File) => {
    console.log('🔄 Starting file processing:', file.name);

    // Enhanced validation
    const fileExtension = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    const isValidExtension = supportedFormats.includes(fileExtension);
    const isValidMimeType = supportedMimeTypes.some(type => 
      file.type.toLowerCase().includes(type.toLowerCase().replace('audio/', ''))
    );
    
    console.log('📋 Validation:', {
      extension: fileExtension,
      mimeType: file.type,
      validExt: isValidExtension,
      validMime: isValidMimeType
    });

    if (!isValidExtension && !isValidMimeType) {
      alert(`❌ Formato no soportado.\n\nArchivo: ${file.name}\nTipo detectado: ${file.type || 'Desconocido'}\nExtensión: ${fileExtension}\n\n✅ Formatos válidos:\n• MP3 (recomendado)\n• WAV\n• OGG\n• M4A\n\n💡 Tip: Convierte tu archivo a MP3 para mejor compatibilidad.`);
      return;
    }

    // Size validation (50MB max)
    const maxSizeMB = 50;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      alert(`❌ Archivo muy grande.\n\nTamaño actual: ${fileSizeMB.toFixed(1)} MB\nTamaño máximo: ${maxSizeMB} MB\n\n💡 Tip: Usa un archivo más pequeño o menor calidad.`);
      return;
    }

    const trackId = `uploaded_${Date.now()}`;
    
    setUploadProgress({
      fileName: file.name,
      progress: 10,
      status: 'uploading'
    });

    try {
      console.log('✅ File validation passed, creating audio URL...');

      // Create URL for the file
      const audioUrl = URL.createObjectURL(file);
      console.log('🔗 Audio URL created:', audioUrl);

      // Simulate upload progress
      for (let i = 20; i <= 60; i += 15) {
        setUploadProgress(prev => prev ? { ...prev, progress: i } : null);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setUploadProgress(prev => prev ? { ...prev, status: 'processing', progress: 70 } : null);

      // Test audio file validity by creating a temporary audio element
      const testAudio = new Audio();
      testAudio.src = audioUrl;
      
      await new Promise((resolve, reject) => {
        testAudio.onloadedmetadata = () => {
          console.log('✅ Audio metadata loaded:', {
            duration: testAudio.duration,
            src: testAudio.src
          });
          resolve(true);
        };
        
        testAudio.onerror = () => {
          reject(new Error('Invalid audio file'));
        };
        
        // Load the audio
        testAudio.load();
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Audio loading timeout')), 5000);
      });

      setUploadProgress(prev => prev ? { ...prev, progress: 90 } : null);

      // Extract real duration
      const duration = Math.round(testAudio.duration) || 180;

      // Create Track object
      const track: Track = {
        id: trackId,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local File',
        duration: duration,
        bpm: 120, // Default BPM for uploaded files (will be detected in real implementation)
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
        audioUrl: audioUrl,
        previewUrl: audioUrl,
      };

      setUploadProgress(prev => prev ? { ...prev, progress: 100, status: 'complete' } : null);

      // Call callback
      onTrackUploaded(track);

      // Success feedback
      setTimeout(() => {
        setUploadProgress(null);
        alert(`✅ ¡Archivo cargado exitosamente!\n\n🎵 ${track.title}\n⏱️ Duración: ${Math.floor(duration/60)}:${(duration%60).toString().padStart(2,'0')}\n📁 Tamaño: ${fileSizeMB.toFixed(1)} MB\n\n🎧 Ahora puedes cargarlo a cualquier deck y reproducirlo.`);
      }, 1000);

      console.log(`🎵 Audio file uploaded successfully: ${file.name}`);
      
    } catch (error) {
      console.error('❌ Error processing audio file:', error);
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido procesando archivo'
      });

      setTimeout(() => {
        setUploadProgress(null);
        alert(`❌ Error procesando archivo.\n\nArchivo: ${file.name}\nError: ${error instanceof Error ? error.message : 'Desconocido'}\n\n💡 Intenta:\n• Usar un archivo MP3 diferente\n• Verificar que no esté corrupto\n• Usar menor calidad/tamaño`);
      }, 2000);
    }
  };

  // Improved drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragDepth(prev => prev + 1);
    
    if (e.dataTransfer.items) {
      // Check if dragged items contain files
      const hasFiles = Array.from(e.dataTransfer.items).some(item => item.kind === 'file');
      if (hasFiles) {
        setDragOver(true);
        console.log('📁 Files detected in drag');
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragDepth(prev => {
      const newDepth = prev - 1;
      if (newDepth === 0) {
        setDragOver(false);
      }
      return newDepth;
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set dropEffect to indicate this is a valid drop zone
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Drop event triggered!');
    console.log('📁 DataTransfer:', e.dataTransfer);
    console.log('📂 Files:', e.dataTransfer.files);
    
    setDragOver(false);
    setDragDepth(0);
    
    const files = e.dataTransfer.files;
    console.log(`📂 Dropped ${files.length} files`);
    
    if (files.length === 0) {
      console.warn('⚠️ No files in drop event');
      alert('❌ No se detectaron archivos.\n\n💡 Intenta:\n• Arrastrar desde el explorador de archivos\n• Arrastrar un archivo MP3/WAV válido\n• Usar el botón "Click to select" como alternativa');
      return;
    }

    validateAndProcessFiles(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 File input changed');
    const files = e.target.files;
    validateAndProcessFiles(files);
    
    // Reset input for re-selection
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleClickToSelect = () => {
    console.log('🖱️ Click to select triggered');
    fileInputRef.current?.click();
  };

  // Generate demo audio with better feedback
  const generateDemoTrack = (demo: { name: string; freq: number; duration: number }) => {
    try {
      console.log(`🎵 Generating demo: ${demo.name} (${demo.freq}Hz)`);
      const audioUrl = simpleAudioPlayer.generateDemoAudio(demo.freq, demo.duration);
      
      if (audioUrl) {
        const track: Track = {
          id: `demo_${demo.freq}_${Date.now()}`,
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
        alert(`🎵 Demo "${demo.name}" generado!\n\n🔊 Frecuencia: ${demo.freq}Hz\n⏱️ Duración: ${demo.duration}s\n\n🎧 Carga al deck con "→ A/B" y presiona ▶️ para escuchar.`);
      } else {
        throw new Error('Audio generation failed');
      }
    } catch (error) {
      console.error('Demo generation failed:', error);
      alert(`❌ Error generando demo "${demo.name}".\n\nIntenta usar el botón "🔊 Test Inmediato" para verificar que el audio funciona.`);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Enhanced Drop Zone */}
      <Card 
        ref={dropZoneRef}
        className={`relative p-8 border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
          dragOver 
            ? 'border-blue-500 bg-blue-500/20 scale-[1.02] shadow-2xl shadow-blue-500/25' 
            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClickToSelect}
      >
        {/* Background Animation */}
        {dragOver && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 animate-pulse" />
        )}
        
        <div className="relative text-center space-y-4">
          <div className={`text-5xl transition-transform duration-300 ${
            dragOver ? 'scale-125 animate-bounce' : ''
          }`}>
            {dragOver ? '🎯' : '🎵'}
          </div>
          
          <div>
            <h3 className={`font-bold text-xl mb-3 transition-colors ${
              dragOver ? 'text-blue-300' : 'text-white'
            }`}>
              {dragOver ? '🎯 ¡Suelta Aquí Tu Música!' : '📁 Upload Archivo de Audio'}
            </h3>
            
            <p className={`text-sm transition-colors ${
              dragOver ? 'text-blue-200' : 'text-gray-400'
            }`}>
              {dragOver 
                ? '¡Perfecto! Suelta para cargar tu track' 
                : 'Arrastra MP3/WAV o haz click para seleccionar'
              }
            </p>
            
            {dragOver && (
              <div className="mt-3 space-y-1">
                <p className="text-blue-300 text-sm font-medium animate-pulse">
                  📂 Archivo detectado - procesando...
                </p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping delay-100" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping delay-200" />
                </div>
              </div>
            )}
          </div>

          {!dragOver && (
            <>
              <div className="flex flex-wrap justify-center gap-2">
                {supportedFormats.map((format) => (
                  <Badge 
                    key={format}
                    variant="outline" 
                    className="text-xs border-gray-500 text-gray-300"
                  >
                    {format.toUpperCase()}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-gray-500 text-xs">
                  Máximo 50MB • MP3 recomendado para mejor compatibilidad
                </p>
                
                <Button
                  onClick={handleClickToSelect}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  📁 Click to Select File
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Hidden file input with improved attributes */}
      <input
        ref={fileInputRef}
        type="file"
        accept={supportedFormats.join(',') + ',audio/*'}
        onChange={handleFileInputChange}
        className="hidden"
        multiple={false}
      />

      {/* Upload Progress */}
      {uploadProgress && (
        <Card className="p-4 bg-gray-800 border-gray-700">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">
                  {uploadProgress.status === 'uploading' ? '⬆️' :
                   uploadProgress.status === 'processing' ? '⚙️' :
                   uploadProgress.status === 'complete' ? '✅' : '❌'}
                </span>
                <span className={`font-medium ${
                  uploadProgress.status === 'complete' ? 'text-green-400' :
                  uploadProgress.status === 'error' ? 'text-red-400' :
                  'text-blue-400'
                }`}>
                  {uploadProgress.status === 'uploading' ? 'Subiendo archivo...' :
                   uploadProgress.status === 'processing' ? 'Procesando audio...' :
                   uploadProgress.status === 'complete' ? '¡Completado!' :
                   'Error de carga'}
                </span>
              </div>
              <span className="text-gray-400 text-sm font-mono">
                {uploadProgress.progress}%
              </span>
            </div>

            <div>
              <p className="text-white text-sm font-medium truncate">
                📄 {uploadProgress.fileName}
              </p>
              {uploadProgress.error && (
                <p className="text-red-400 text-xs mt-1 bg-red-500/10 rounded p-2">
                  ⚠️ {uploadProgress.error}
                </p>
              )}
            </div>

            <Progress 
              value={uploadProgress.progress} 
              className="w-full h-2"
            />
          </div>
        </Card>
      )}

      {/* Demo Tracks Section */}
      <Card className="p-4 bg-gray-800 border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">🎵 Tracks de Demostración</h4>
            <Badge variant="outline" className="text-xs border-blue-500 text-blue-400">
              Audio Instantáneo
            </Badge>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-green-400 text-sm font-medium mb-1">🎧 ¡Audio Inmediato!</p>
            <p className="text-gray-300 text-xs leading-relaxed">
              Estos botones generan tonos reales al instante. Perfectos para probar el sistema de audio.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Bass Test', freq: 80, duration: 10, desc: 'Graves profundos' },
              { name: 'Mid Test', freq: 440, duration: 10, desc: 'Frecuencia media' },
              { name: 'High Test', freq: 1000, duration: 10, desc: 'Agudos brillantes' },
              { name: 'Beep Test', freq: 800, duration: 5, desc: 'Beep corto' }
            ].map((demo) => (
              <Button
                key={demo.name}
                onClick={() => generateDemoTrack(demo)}
                size="sm"
                variant="outline"
                className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700 p-3 h-auto flex-col space-y-1"
              >
                <div className="font-semibold">🎵 {demo.name}</div>
                <div className="text-xs opacity-70">{demo.desc}</div>
                <div className="text-xs text-blue-400">{demo.freq}Hz • {demo.duration}s</div>
              </Button>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={async () => {
                try {
                  console.log('🔊 Testing immediate audio...');
                  const audio = new Audio();
                  const beepUrl = simpleAudioPlayer.generateDemoAudio(800, 1);
                  
                  if (beepUrl) {
                    audio.src = beepUrl;
                    audio.volume = 0.5;
                    await audio.play();
                    alert('🔊 ¡Audio test exitoso!\n\nSi escuchaste el beep, tu sistema está funcionando correctamente.\n\n✅ Ahora puedes:\n• Subir archivos MP3/WAV\n• Usar tracks de demo\n• Reproducir en los decks');
                  } else {
                    throw new Error('Audio generation failed');
                  }
                } catch (error) {
                  console.error('Audio test failed:', error);
                  alert('❌ Test de audio falló.\n\nPosibles causas:\n• Navegador bloquea auto-play\n• Audio del sistema silenciado\n• Permisos de audio denegados\n\n💡 Tip: Haz click primero en cualquier lugar de la página, luego reintenta.');
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white"
              size="sm"
            >
              🔊 Test Audio Inmediato
            </Button>
          </div>
        </div>
      </Card>

      {/* Troubleshooting Guide */}
      <Card className="p-3 bg-gray-800/50 border-gray-700">
        <details className="text-xs">
          <summary className="text-white font-medium cursor-pointer mb-2">
            🔧 Troubleshooting Drag & Drop
          </summary>
          <div className="space-y-2 text-gray-400">
            <div><strong>Si drag & drop no funciona:</strong></div>
            <div>• <strong>Navegador</strong>: Usa Chrome o Firefox (mejor compatibilidad)</div>
            <div>• <strong>Origen</strong>: Arrastra desde explorador de archivos, no de páginas web</div>
            <div>• <strong>Formato</strong>: Asegúrate que sea MP3, WAV, OGG o M4A</div>
            <div>• <strong>Alternativa</strong>: Usa "Click to Select File" como backup</div>
            <div>• <strong>Debug</strong>: Abre consola (F12) para ver mensajes de error</div>
          </div>
        </details>
      </Card>
    </div>
  );
};