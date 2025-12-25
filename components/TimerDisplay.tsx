
import React from 'react';
import { WalkState } from '../types';

interface TimerDisplayProps {
  timeLeft: number;
  walkState: WalkState;
  duration: number;
  color: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft, walkState, duration, color }) => {
  const radius = 120;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = ((duration - timeLeft) / duration);
  const strokeDashoffset = circumference - progress * circumference;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, strokeLinecap: 'round' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tabular-nums" style={{color: color}}>{formattedTime}</span>
        <span className="text-lg font-medium text-slate-600 mt-2">{walkState}</span>
      </div>
    </div>
  );
};

export default TimerDisplay;
