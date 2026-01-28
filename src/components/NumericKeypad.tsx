import React, { useEffect } from 'react';
import { X, Delete } from 'lucide-react';

interface NumericKeypadProps {
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
  onCancel?: () => void; // Separate cancel/close handler
  allowNegative?: boolean;
  label?: string;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  onClose,
  onCancel,
  allowNegative = false,
  label = 'Enter Value',
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

  // Prevent body scrolling when keypad is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-gradient-to-br from-white to-gray-100 rounded-3xl p-6 shadow-3d max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">{label}</h3>
          <button
            onClick={onCancel || onClose}
            className="button-3d p-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
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
            className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
          >
            7
          </button>
          <button
            onClick={() => handleNumberPress('8')}
            className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
          >
            8
          </button>
          <button
            onClick={() => handleNumberPress('9')}
            className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
          >
            9
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleNumberPress('4')}
            className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
          >
            4
          </button>
          <button
            onClick={() => handleNumberPress('5')}
            className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
          >
            5
          </button>
          <button
            onClick={() => handleNumberPress('6')}
            className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
          >
            6
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleNumberPress('1')}
            className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
          >
            1
          </button>
          <button
            onClick={() => handleNumberPress('2')}
            className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
          >
            2
          </button>
          <button
            onClick={() => handleNumberPress('3')}
            className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
          >
            3
          </button>

          {/* Row 4 */}
          {allowNegative ? (
            <button
              onClick={handleToggleNegative}
              className="button-3d bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold text-xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
            >
              +/-
            </button>
          ) : (
            <div className="py-4" />
          )}
          <button
            onClick={() => handleNumberPress('0')}
            className="button-3d bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 font-bold text-2xl py-4 rounded-xl shadow-card hover:shadow-card-hover"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="button-3d bg-gradient-to-br from-red-400 to-red-500 text-white font-bold text-xl py-4 rounded-xl shadow-card hover:shadow-card-hover flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleClear}
            className="button-3d bg-gradient-to-br from-gray-400 to-gray-500 text-white font-bold py-3 rounded-xl shadow-card hover:shadow-card-hover"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="button-3d bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl shadow-card hover:shadow-card-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

