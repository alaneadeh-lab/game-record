import React from "react";
// Uncomment once tomato-badge.png is created and placed in assets folder
// import tomatoBadge from "../assets/tomato-badge.png";

interface TomatoBadgeProps {
  size?: number;
  className?: string;
}

const TomatoBadge: React.FC<TomatoBadgeProps> = ({ 
  size = 80, 
  className = "" 
}) => {
  // Placeholder - will show actual badge once image is available
  // Uncomment the img tag below and remove the placeholder div once badge is created
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Uncomment once tomato-badge.png exists in assets folder */}
      {/* <img
        src={tomatoBadge}
        alt="Tomato Badge"
        className="w-full h-full object-contain"
        style={{ width: "100%", height: "100%" }}
      /> */}
      {/* Placeholder - remove once badge image is available */}
      <div className="w-full h-full bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-bold text-3xl">
        🍅
      </div>
    </div>
  );
};

export default TomatoBadge;

