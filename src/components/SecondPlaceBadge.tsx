import React from "react";
import secondPlaceBadge from "../assets/second-place-badge.png";

interface SecondPlaceBadgeProps {
  size?: number;
  className?: string;
}

const SecondPlaceBadge: React.FC<SecondPlaceBadgeProps> = ({ 
  size = 80, 
  className = "" 
}) => {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={secondPlaceBadge}
        alt="Second Place Badge"
        className="w-full h-full object-contain"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default SecondPlaceBadge;

