
import React from 'react';
import { Play, Pause, RefreshCcw, Shield } from 'lucide-react';

interface ControlButtonsProps {
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onShareLocation: () => void;
  themeColor: string;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isActive,
  onStart,
  onPause,
  onReset,
  onShareLocation,
  themeColor
}) => {
  return (
    <div className="flex items-center justify-center space-x-4 w-full">
      <button 
        onClick={onReset}
        className="p-3 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
        aria-label="Reset Timer"
      >
        <RefreshCcw size={24} />
      </button>

      {!isActive ? (
        <button 
          onClick={onStart} 
          className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transform active:scale-95 transition-transform"
          style={{ backgroundColor: themeColor }}
          aria-label="Start Timer"
        >
          <Play size={40} className="ml-1" />
        </button>
      ) : (
        <button 
          onClick={onPause} 
          className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transform active:scale-95 transition-transform"
          style={{ backgroundColor: themeColor }}
          aria-label="Pause Timer"
        >
          <Pause size={40} />
        </button>
      )}

      <button
        onClick={onShareLocation}
        className="p-3 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
        title="Waspada Mode: Bagikan Lokasi"
        aria-label="Share Location"
      >
        <Shield size={24} />
      </button>
    </div>
  );
};

export default ControlButtons;
