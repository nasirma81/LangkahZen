
import React from 'react';

const BatikBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 opacity-10 overflow-hidden">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="batik" patternUnits="userSpaceOnUse" width="100" height="100" >
            <path d="M50 0 L50 100 M0 50 L100 50" stroke="#a3a3a3" strokeWidth="1" />
            <circle cx="25" cy="25" r="10" fill="none" stroke="#a3a3a3" strokeWidth="1" />
            <circle cx="75" cy="75" r="10" fill="none" stroke="#a3a3a3" strokeWidth="1" />
            <path d="M0 0 Q50 50 100 0" stroke="#a3a3a3" strokeWidth="1" fill="none" />
            <path d="M0 100 Q50 50 100 100" stroke="#a3a3a3" strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#batik)" className="animate-[pan_60s_linear_infinite]" style={{ backgroundPosition: '0 0' }}/>
      </svg>
      <style>{`
        @keyframes pan {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
      `}</style>
    </div>
  );
};

export default BatikBackground;
