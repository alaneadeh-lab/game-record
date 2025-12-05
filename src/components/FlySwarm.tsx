import React from 'react';
import Lottie from 'lottie-react';
import fliesAnimation from '../assets/flies-only.json';

interface FlySwarmProps {
  size?: number;
  loop?: boolean;
  className?: string;
}

const FlySwarm: React.FC<FlySwarmProps> = ({
  size = 80,
  loop = true,
  className = '',
}) => {
  if (!fliesAnimation) {
    console.error('FlySwarm: fliesAnimation is null or undefined');
    return null;
  }

  // 7 flies (half of original, each 40% bigger) are spread across a bounding box:
  // Center: (1940.8, 1327.0)
  // Size: ~1540 x 906
  // Use a viewBox to show all 7 flies with some padding
  const flyCenterX = 1940.8;
  const flyCenterY = 1327.0;
  const viewBoxSize = 1800; // Show 1800px square to include all flies with padding
  
  // Calculate scale to fit viewBox in container
  const scale = size / viewBoxSize;
  
  // Calculate the viewBox bounds (in original canvas coordinates)
  const viewBoxX = flyCenterX - viewBoxSize / 2;
  const viewBoxY = flyCenterY - viewBoxSize / 2;
  
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ 
        width: size, 
        height: size,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: fliesAnimation.w * scale,
          height: fliesAnimation.h * scale,
          transform: `translate(${-viewBoxX * scale}px, ${-viewBoxY * scale}px)`,
          transformOrigin: '0 0',
        }}
      >
        <Lottie
          animationData={fliesAnimation}
          loop={loop}
          autoplay
          renderer="svg"
          style={{ 
            width: `${fliesAnimation.w}px`,
            height: `${fliesAnimation.h}px`,
            display: 'block',
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}
          onLoadedData={() => {
            console.log(`✅ FlySwarm: Loaded ${fliesAnimation.w}x${fliesAnimation.h}, showing 7 flies (40% bigger)`);
            console.log(`   ViewBox centered at (${flyCenterX.toFixed(0)}, ${flyCenterY.toFixed(0)}), size ${viewBoxSize}px`);
          }}
          onError={(error) => {
            console.error('❌ FlySwarm: Lottie error', error);
          }}
        />
      </div>
    </div>
  );
};

export default FlySwarm;

