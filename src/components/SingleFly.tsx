import React, { useEffect, useState } from "react";

interface SingleFlyProps {
  /** Size of the emoji in px (font-size) */
  size?: number;
  /** Extra classes for positioning the whole thing */
  className?: string;
}

const SingleFly: React.FC<SingleFlyProps> = ({ size = 32, className }) => {
  // Position is in % inside the local container (0–100)
  // Start at top-right corner, then hover in and out
  const [pos, setPos] = useState({ x: 90, y: 20 }); // start at top-right corner
  const [tilt, setTilt] = useState(0);
  const [scale, setScale] = useState(1);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timer: number | undefined;

    const tick = () => {
      if (!isMounted) return;

      // Alternate between hovering near the corner and moving away
      // Create a pattern where it hovers in and out of the top-right corner
      const isHoveringNear = Math.random() > 0.5;
      
      if (isHoveringNear) {
        // Hover near top-right corner (85-95% x, 15-25% y)
        setPos({
          x: 85 + Math.random() * 10,  // 85-95%
          y: 15 + Math.random() * 10,  // 15-25%
        });
        setIsVisible(true);
      } else {
        // Move further away from corner (60-80% x, 30-50% y)
        setPos({
          x: 60 + Math.random() * 20,  // 60-80%
          y: 30 + Math.random() * 20,  // 30-50%
        });
        setIsVisible(true);
      }

      // Random rotation & scale for "buzz"
      setTilt((Math.random() - 0.5) * 40);        // -20° to 20°
      setScale(0.9 + Math.random() * 0.3);        // 0.9–1.2

      // Random delay between hops (so it feels organic)
      const delay = 200 + Math.random() * 400;    // 200–600 ms (slower for more intentional movement)
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

  if (!isVisible) return null;

  return (
    <div
      className={["pointer-events-none select-none", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        position: "absolute",
        top: `${pos.y}%`,
        left: `${pos.x}%`,
        fontSize: size,
        transform: `translate(-50%, -50%) rotate(${tilt}deg) scale(${scale})`,
        transition:
          "top 300ms ease-in-out, left 300ms ease-in-out, transform 200ms ease-out",
      }}
    >
      🪰
    </div>
  );
};

export default SingleFly;

