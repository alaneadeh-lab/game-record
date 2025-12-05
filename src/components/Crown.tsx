import React from "react";
import Lottie from "lottie-react";
import crownAnimation from "../assets/crown.json";

interface CrownProps {
  size?: number;
  className?: string;
  loop?: boolean;
}

const Crown: React.FC<CrownProps> = ({ size = 36, className = "", loop = true }) => {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <Lottie
        animationData={crownAnimation}
        loop={loop}
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default Crown;