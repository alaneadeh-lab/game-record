import React from "react";
import firstPlaceBadge from "../assets/first-place-badg.png";

interface FirstPlaceBadgeProps {
  size?: number;
  className?: string;
}

const FirstPlaceBadge: React.FC<FirstPlaceBadgeProps> = ({ 
  size = 60, 
  className = "" 
}) => {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={firstPlaceBadge}
        alt="First Place Badge"
        className="w-full h-full object-contain"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default FirstPlaceBadge;

