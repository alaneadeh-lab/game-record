import React from "react";
// Uncomment once third-place-badge.png is created and placed in assets folder
// import thirdPlaceBadge from "../assets/third-place-badge.png";

interface ThirdPlaceBadgeProps {
  size?: number;
  className?: string;
}

const ThirdPlaceBadge: React.FC<ThirdPlaceBadgeProps> = ({ 
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
      {/* Uncomment once third-place-badge.png exists in assets folder */}
      {/* <img
        src={thirdPlaceBadge}
        alt="Third Place Badge"
        className="w-full h-full object-contain"
        style={{ width: "100%", height: "100%" }}
      /> */}
      {/* Placeholder - remove once badge image is available */}
      <div className="w-full h-full bg-orange-300 rounded-full flex items-center justify-center text-orange-700 font-bold text-2xl">
        3
      </div>
    </div>
  );
};

export default ThirdPlaceBadge;

