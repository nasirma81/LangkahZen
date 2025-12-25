
import React from 'react';
import { Clock, Footprints } from 'lucide-react';

interface StatsProps {
  totalMinutes: number;
  totalSteps: number;
}

const StatItem: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
    <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm p-3 rounded-lg shadow-sm w-1/2">
        <div className="p-2 bg-slate-200 rounded-full text-slate-600">
            {icon}
        </div>
        <div>
            <p className="text-xl font-bold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
        </div>
    </div>
);


const Stats: React.FC<StatsProps> = ({ totalMinutes, totalSteps }) => {
  return (
    <div className="w-full flex justify-center space-x-4">
      <StatItem 
        icon={<Clock size={20} />}
        value={totalMinutes.toLocaleString('id-ID')}
        label="Total Menit"
      />
      <StatItem
        icon={<Footprints size={20} />}
        value={totalSteps.toLocaleString('id-ID')}
        label="Total Langkah"
      />
    </div>
  );
};

export default Stats;
