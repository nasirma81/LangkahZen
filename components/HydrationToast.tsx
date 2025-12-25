
import React from 'react';
import { Droplets } from 'lucide-react';

interface HydrationToastProps {
  isVisible: boolean;
}

const HydrationToast: React.FC<HydrationToastProps> = ({ isVisible }) => {
  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center w-11/12 max-w-xs p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'
      }`}
      role="alert"
    >
      <div className="text-blue-500">
        <Droplets size={24} />
      </div>
      <div className="pl-4 text-sm font-normal">Waktunya Minum! Jaga hidrasi di cuaca tropis.</div>
    </div>
  );
};

export default HydrationToast;
