import React from 'react';
import { Plus } from 'lucide-react';

interface SetSwitcherProps {
  currentIndex: number;
  totalSets: number;
  onSetChange: (index: number) => void;
  onAddSet: () => void;
}

export const SetSwitcher: React.FC<SetSwitcherProps> = ({
  currentIndex,
  totalSets,
  onSetChange,
  onAddSet,
}) => {
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-30">
      {Array.from({ length: totalSets }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSetChange(index)}
          className={`transition-all duration-300 rounded-full ${
            index === currentIndex
              ? 'w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 shadow-3d scale-110'
              : 'w-3 h-3 bg-white bg-opacity-50 hover:bg-opacity-75'
          }`}
          aria-label={`Go to set ${index + 1}`}
        />
      ))}
      <button
        onClick={onAddSet}
        className="button-3d w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white shadow-3d hover:shadow-3d-hover"
        aria-label="Add new set"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};

