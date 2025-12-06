import React, { useEffect, useState } from "react";

interface SingleFlyProps {
  /** Size of the emoji in px (font-size) */
  size?: number;
  /** Extra classes for positioning the whole thing */
  className?: string;
}

const SingleFly: React.FC<SingleFlyProps> = ({ size = 32, className }) => {
  // Fixed position - will be positioned by parent's absolute positioning
  // No internal positioning needed since parent handles it
  const [tilt] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let isMounted = true;
    let timer: number | undefined;

    const tick = () => {
      if (!isMounted) return;

      // Only change scale for size animation
      setScale(0.9 + Math.random() * 0.3);        // 0.9–1.2

      // Random delay between scale changes
      const delay = 200 + Math.random() * 400;    // 200–600 ms
      timer = window.setTimeout(tick, delay);
    };

    // Slight random start delay
    const startDelay = 200 + Math.random() * 400;
    timer = window.setTimeout(tick, startDelay);

    return () => {
      isMounted = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className={["pointer-events-none select-none", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        fontSize: size,
        transform: `rotate(${tilt}deg) scale(${scale})`,
        transition: "transform 200ms ease-out",
      }}
    >
      🪰
    </div>
  );
};

export default SingleFly;

