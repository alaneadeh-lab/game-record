import React from "react";
import tomatoBadge from "../assets/tomato-badge.png";

interface TomatoBadgeProps {
  size?: number;
  className?: string;
}

const TomatoBadge: React.FC<TomatoBadgeProps> = ({ 
  size = 80, 
  className = "" 
}) => {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={tomatoBadge}
        alt="Tomato Badge"
        className="w-full h-full object-contain"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default TomatoBadge;

