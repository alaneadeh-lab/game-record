import React from 'react';
import Lottie from 'lottie-react';
import pokerAnimation from '../assets/poker.json';

interface PokerAnimationProps {
  size?: number;
  className?: string;
}

const PokerAnimation: React.FC<PokerAnimationProps> = ({ size = 40, className = '' }) => {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <Lottie animationData={pokerAnimation} loop autoplay style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default PokerAnimation;

