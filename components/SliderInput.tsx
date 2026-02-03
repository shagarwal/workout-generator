'use client';

import React from 'react';

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  formatLabel?: (value: number) => string;
}

export default function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatLabel,
}: SliderInputProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-bold text-gray-100">{label}</label>
        <span className="text-sm font-bold text-lime-400">
          {formatLabel ? formatLabel(value) : value}
        </span>
      </div>
      <div className="relative">
        <div className="relative">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lime-500 to-lime-400 transition-all duration-200"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
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
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #84cc16, #65a30d);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(132, 204, 22, 0.4);
        }

        input[type='range']::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #84cc16, #65a30d);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(132, 204, 22, 0.4);
        }
      `}</style>
    </div>
  );
}
