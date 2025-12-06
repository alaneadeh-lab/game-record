import React from 'react';
import Lottie from 'lottie-react';
import tiredEmojiAnimation from '../assets/tired-emoji.json';

interface TiredEmojiAnimationProps {
  size?: number;
  className?: string;
}

const TiredEmojiAnimation: React.FC<TiredEmojiAnimationProps> = ({ size = 40, className = '' }) => {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <Lottie animationData={tiredEmojiAnimation} loop autoplay style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default TiredEmojiAnimation;

