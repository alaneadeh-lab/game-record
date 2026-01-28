import React, { useEffect, useState } from 'react';

interface AngryEyesProps {
  className?: string;
}

const AngryEyes: React.FC<AngryEyesProps> = ({ className = "" }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(true);
      // Show for 3 seconds
      setTimeout(() => setIsVisible(false), 3000);
      // Then hide for 10 seconds (total cycle: 13 seconds)
    }, 13000);

    // Start the first cycle
    setIsVisible(true);
    setTimeout(() => setIsVisible(false), 3000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 ${className}`}>
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Left Eye */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-8 -translate-y-2">
          <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-black rounded-full absolute top-1 left-1 animate-bounce"></div>
          </div>
        </div>
        
        {/* Right Eye */}
        <div className="absolute left-1/2 top-1/2 transform translate-x-2 -translate-y-2">
          <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse">
            <div className="w-2 h-2 bg-black rounded-full absolute top-1 right-1 animate-bounce"></div>
          </div>
        </div>
        
        {/* Angry Brows */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-6 -translate-y-6">
          <div className="w-4 h-1 bg-black rotate-12 animate-pulse"></div>
        </div>
        <div className="absolute left-1/2 top-1/2 transform translate-x-2 -translate-y-6">
          <div className="w-4 h-1 bg-black -rotate-12 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default AngryEyes;