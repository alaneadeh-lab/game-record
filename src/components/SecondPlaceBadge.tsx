import React from "react";
// Uncomment once second-place-badge.png is created and placed in assets folder
// import secondPlaceBadge from "../assets/second-place-badge.png";

interface SecondPlaceBadgeProps {
  size?: number;
  className?: string;
}

const SecondPlaceBadge: React.FC<SecondPlaceBadgeProps> = ({ 
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
      {/* Uncomment once second-place-badge.png exists in assets folder */}
      {/* <img
        src={secondPlaceBadge}
        alt="Second Place Badge"
        className="w-full h-full object-contain"
        style={{ width: "100%", height: "100%" }}
      /> */}
      {/* Placeholder - remove once badge image is available */}
      <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-2xl">
        2
      </div>
    </div>
  );
};

export default SecondPlaceBadge;

