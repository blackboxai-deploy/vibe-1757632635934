"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DragDropInstructionsProps {
  className?: string;
}

export const DragDropInstructions: React.FC<DragDropInstructionsProps> = ({
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-20 right-4 border-blue-500 text-blue-400 hover:bg-blue-500/10 z-30"
      >
        💡 Show Drag & Drop Tips
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-20 right-4 w-80 bg-gray-900 border-blue-500/50 z-30 ${className}`}>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-semibold flex items-center space-x-2">
            <span>🎯</span>
            <span>Drag & Drop Guide</span>
          </h4>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            ✕
          </Button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
            <h5 className="text-blue-400 font-medium mb-2">🎵 Track to Deck</h5>
            <div className="text-gray-300 space-y-1 text-xs">
              <div>• <strong>Busca track</strong> en cualquier tab</div>
              <div>• <strong>Arrastra el track</strong> 🎵</div>
              <div>• <strong>Suelta en Deck A/B</strong> 🎛️</div>
              <div>• <strong>¡Auto-carga!</strong> Listo para reproducir</div>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
            <h5 className="text-green-400 font-medium mb-2">📁 File to Deck</h5>
            <div className="text-gray-300 space-y-1 text-xs">
              <div>• <strong>Arrastra MP3/WAV</strong> desde computadora</div>
              <div>• <strong>Directo al deck</strong> (sin uploader)</div>
              <div>• <strong>Carga inmediata</strong> al deck</div>
              <div>• <strong>Auto-configuración</strong> de audio</div>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded p-3">
            <h5 className="text-orange-400 font-medium mb-2">🎯 Visual Feedback</h5>
            <div className="text-gray-300 space-y-1 text-xs">
              <div>• <strong>Deck se ilumina</strong> en azul durante drag</div>
              <div>• <strong>Mensaje "Drop Here!"</strong> aparece</div>
              <div>• <strong>Confirmación</strong> con alert</div>
              <div>• <strong>Auto-setup</strong> para reproducir</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
          💡 Si drag & drop no funciona, usa los botones → A/B
        </div>
      </div>
    </Card>
  );
};