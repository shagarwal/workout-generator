'use client';

import React from 'react';
import { User } from 'lucide-react';

interface StretchingPickerProps {
  value: number;
  onChange: (value: number) => void;
}

const snapPoints = [0, 5, 10, 15, 20, 30];

export default function StretchingPicker({ value, onChange }: StretchingPickerProps) {
  const percentage = (value / 30) * 100;

  // Find closest snap point
  const closestSnap = snapPoints.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );

  const handleChange = (newValue: number) => {
    // Snap to nearest point if within 2 minutes
    const nearest = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - newValue) < Math.abs(prev - newValue) ? curr : prev
    );
    if (Math.abs(nearest - newValue) <= 2) {
      onChange(nearest);
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-100">
          <User size={18} className="text-blue-400" />
          Stretching Duration
        </label>
        <span className="text-2xl font-bold text-blue-400">{value} min</span>
      </div>

      <div className="relative">
        {/* Snap point indicators */}
        <div className="relative mb-2 h-8">
          {snapPoints.map((point) => {
            const pointPercentage = (point / 30) * 100;
            return (
              <div
                key={point}
                className="absolute flex flex-col items-center"
                style={{ left: `${pointPercentage}%`, transform: 'translateX(-50%)' }}
              >
                <div
                  className={`w-1 h-3 rounded-full transition-all ${
                    point === closestSnap ? 'bg-blue-400' : 'bg-gray-600'
                  }`}
                />
                <span className={`text-xs mt-1 transition-all whitespace-nowrap ${
                  point === closestSnap ? 'text-blue-400 font-bold' : 'text-gray-500'
                }`}>
                  {point}
                </span>
              </div>
            );
          })}
        </div>

        <div className="relative">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-200"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10"
            style={{
              WebkitAppearance: 'none',
            }}
          />
        </div>
      </div>

      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(59, 130, 246, 0.5);
          border: 3px solid #1a1a1a;
        }

        input[type='range']::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          cursor: pointer;
          border: 3px solid #1a1a1a;
          box-shadow: 0 2px 12px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
