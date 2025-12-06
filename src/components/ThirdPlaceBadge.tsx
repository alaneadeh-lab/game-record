import React from "react";
import thirdPlaceBadge from "../assets/third-place-badge.png";

interface ThirdPlaceBadgeProps {
  size?: number;
  className?: string;
}

const ThirdPlaceBadge: React.FC<ThirdPlaceBadgeProps> = ({ 
  size = 80, 
  className = "" 
}) => {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={thirdPlaceBadge}
        alt="Third Place Badge"
        className="w-full h-full object-contain"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default ThirdPlaceBadge;

