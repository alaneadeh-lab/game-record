import React, { useEffect } from 'react';
import { X, Delete } from 'lucide-react';

interface NumericKeypadProps {
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
  onCancel?: () => void; // Separate cancel/close handler
  allowNegative?: boolean;
  title?: string;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  onClose,
  onCancel,
  allowNegative = false,
  title = 'Enter Value',
}) => {
  const handleNumberPress = (digit: string) => {
    const currentValue = value || 0;
    const isNegative = currentValue < 0;
    const absValue = Math.abs(currentValue);
    
    // Build new number by appending digit
    const newAbsValue = absValue === 0 ? parseInt(digit) : parseInt(`${absValue}${digit}`);
    onChange(isNegative ? -newAbsValue : newAbsValue);
  };

  const handleBackspace = () => {
    const currentValue = value || 0;
    const isNegative = currentValue < 0;
    const absValue = Math.abs(currentValue);
    
    if (absValue < 10) {
      onChange(0);
    } else {
      const newValue = Math.floor(absValue / 10);
      onChange(isNegative ? -newValue : newValue);
    }
  };

  const handleClear = () => {
    onChange(0);
  };

  const handleToggleNegative = () => {
    if (allowNegative) {
      onChange(-(value || 0));
    }
  };

  // Prevent body scrolling when keypad is open (enhanced for mobile)
  useEffect(() => {
    // Store original styles
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlPosition = document.documentElement.style.position;
    
    // Prevent scrolling on both body and html with mobile-specific fixes
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.height = '100vh'; // Ensure full viewport height on mobile
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100vh';
    
    // More aggressive scroll prevention for mobile
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    const preventTouch = (e: TouchEvent) => {
      // Only prevent if touching the backdrop itself, not modal content
      const target = e.target as Element;
      if (target && (target.id === 'keypad-backdrop' || target === document.body || target === document.documentElement)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    // Add comprehensive event listeners with capture phase for mobile
    document.addEventListener('wheel', preventWheel, { passive: false, capture: true });
    document.addEventListener('touchstart', preventTouch, { passive: false, capture: true });
    document.addEventListener('touchmove', preventTouch, { passive: false, capture: true });
    document.addEventListener('touchend', preventTouch, { passive: false, capture: true });
    document.addEventListener('scroll', preventScroll, { passive: false, capture: true });
    
    // Additional mobile-specific prevention
    window.addEventListener('scroll', preventScroll, { passive: false, capture: true });
    
    return () => {
      // Restore original styles
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.position = originalHtmlPosition;
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
      
      // Restore scroll position
      const scrollY = parseInt(document.body.style.top || '0') * -1;
      window.scrollTo(0, scrollY);
      
      // Remove all event listeners
      document.removeEventListener('wheel', preventWheel, true);
      document.removeEventListener('touchstart', preventTouch, true);
      document.removeEventListener('touchmove', preventTouch, true);
      document.removeEventListener('touchend', preventTouch, true);
      document.removeEventListener('scroll', preventScroll, true);
      window.removeEventListener('scroll', preventScroll, true);
    };
  }, []);

  return (
    <>
      {/* Full-screen backdrop that blocks all scroll events - enhanced for mobile */}
      <div 
        id="keypad-backdrop"
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onTouchStart={(e) => {
          // Only prevent if touching the backdrop directly, not modal content
          if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onTouchMove={(e) => {
          // Only prevent if touching the backdrop directly, not modal content
          if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onTouchEnd={(e) => {
          // Only prevent if touching the backdrop directly, not modal content
          if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onScroll={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          overscrollBehavior: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        {/* Modal content */}
        <div 
          className="bg-white rounded-2xl shadow-3d max-w-sm w-full max-h-[90vh] overflow-hidden"
          style={{ touchAction: 'manipulation' }}
          onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking modal
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <button
              onClick={onCancel || onClose}
              onTouchEnd={(e) => {
                e.preventDefault();
                (onCancel || onClose)();
              }}
              className="button-3d p-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Display */}
          <div className="bg-gray-900 text-white rounded-xl p-6 mb-4 text-right">
            <div className="text-4xl font-bold font-mono">
              {value || 0}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {/* Row 1 */}
            <button
              onClick={() => handleNumberPress('7')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNumberPress('7');
              }}
              className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              7
            </button>
            <button
              onClick={() => handleNumberPress('8')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNumberPress('8');
              }}
              className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              8
            </button>
            <button
              onClick={() => handleNumberPress('9')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNumberPress('9');
              }}
              className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              9
            </button>

            {/* Row 2 */}
            <button
              onClick={() => handleNumberPress('4')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNumberPress('4');
              }}
              className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              4
            </button>
            <button
              onClick={() => handleNumberPress('5')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNumberPress('5');
              }}
              className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              5
            </button>
            <button
              onClick={() => handleNumberPress('6')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNumberPress('6');
              }}
              className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              6
            </button>

            {/* Row 3 */}
            <button
              onClick={() => handleNumberPress('1')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNumberPress('1');
              }}
              className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              1
            </button>
            <button
              onClick={() => handleNumberPress('2')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNumberPress('2');
              }}
              className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              2
            </button>
            <button
              onClick={() => handleNumberPress('3')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNumberPress('3');
              }}
              className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              3
            </button>

            {/* Row 4 */}
            {allowNegative ? (
              <button
                onClick={handleToggleNegative}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleToggleNegative();
                }}
                className="button-3d bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold text-xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
                style={{ touchAction: 'manipulation', minHeight: '60px' }}
              >
                +/-
              </button>
            ) : (
              <div className="py-4" />
            )}
            <button
              onClick={() => handleNumberPress('0')}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleNumberPress('0');
              }}
              className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleBackspace();
              }}
              className="button-3d bg-gradient-to-br from-red-400 to-red-500 text-white font-bold text-xl py-4 rounded-xl shadow-card hover:shadow-card-hover flex items-center justify-center active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '60px' }}
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={handleClear}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleClear();
              }}
              className="button-3d bg-gradient-to-br from-gray-400 to-gray-500 text-white font-bold py-3 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '48px' }}
            >
              Clear
            </button>
            <button
              onClick={onClose}
              onTouchEnd={(e) => {
                e.preventDefault();
                onClose();
              }}
              className="button-3d bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-card hover:shadow-card-hover active:scale-95 transition-transform"
              style={{ touchAction: 'manipulation', minHeight: '48px' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

