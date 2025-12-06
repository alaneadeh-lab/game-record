import React, { useEffect, useState } from "react";

interface SingleFlyProps {
  /** Size of the emoji in px (font-size) */
  size?: number;
  /** Extra classes for positioning the whole thing */
  className?: string;
}

const SingleFly: React.FC<SingleFlyProps> = ({ size = 32, className }) => {
  // Position is in % inside the local container (0–100)
  const [pos, setPos] = useState({ x: 70, y: 40 }); // start near top-right-ish
  const [tilt, setTilt] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let isMounted = true;
    let timer: number | undefined;

    const tick = () => {
      if (!isMounted) return;

      setPos((prev) => {
        const jitter = 12; // how far each hop can move (in %)
        const x = Math.min(95, Math.max(40, prev.x + (Math.random() - 0.5) * jitter));
        const y = Math.min(80, Math.max(15, prev.y + (Math.random() - 0.5) * jitter));
        return { x, y };
      });

      // Tiny random rotation & scale for "buzz"
      setTilt((Math.random() - 0.5) * 40);        // -20° to 20°
      setScale(0.9 + Math.random() * 0.3);        // 0.9–1.2

      // Random delay between hops (so it feels organic)
      const delay = 120 + Math.random() * 240;    // 120–360 ms
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
        position: "absolute",
        top: `${pos.y}%`,
        left: `${pos.x}%`,
        fontSize: size,
        transform: `translate(-50%, -50%) rotate(${tilt}deg) scale(${scale})`,
        transition:
          "top 160ms ease-out, left 160ms ease-out, transform 160ms ease-out",
      }}
    >
      🪰
    </div>
  );
};

export default SingleFly;

