import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface PinModalProps {
  onSuccess: () => void;
  onCancel: () => void;
  correctPin: string;
}

export const PinModal: React.FC<PinModalProps> = ({ onSuccess, onCancel, correctPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      onSuccess();
    } else {
      setError('Incorrect PIN');
      setPin('');
      setTimeout(() => setError(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
      <div className="card-3d bg-gradient-to-br from-white to-gray-100 rounded-3xl p-8 shadow-3d max-w-md w-full relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎰</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Access</h2>
          <p className="text-sm text-gray-600">Enter PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              ref={inputRef}
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              className="w-full px-6 py-4 text-3xl text-center border-4 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500 focus:border-purple-500 font-mono font-bold embossed bg-white"
              placeholder="••"
              maxLength={10}
            />
            {error && (
              <div className="mt-3 text-red-600 text-center font-semibold animate-pulse">
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="button-3d w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-3d hover:shadow-3d-hover text-lg"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};
