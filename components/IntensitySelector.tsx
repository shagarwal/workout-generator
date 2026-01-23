'use client';

import React from 'react';
import { Intensity } from '@/lib/types';
import { Flame } from 'lucide-react';

interface IntensitySelectorProps {
  value: Intensity;
  onChange: (value: Intensity) => void;
}

const intensityOptions = [
  { value: 'easy' as Intensity, label: 'Easy', flames: 1, color: 'from-green-500 to-green-600' },
  { value: 'moderate' as Intensity, label: 'Moderate', flames: 2, color: 'from-yellow-500 to-orange-500' },
  { value: 'hard' as Intensity, label: 'Hard', flames: 3, color: 'from-orange-500 to-red-500' },
  { value: 'brutal' as Intensity, label: 'Brutal', flames: 4, color: 'from-red-500 to-red-700' },
];

export default function IntensitySelector({ value, onChange }: IntensitySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-100">Intensity Level</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {intensityOptions.map(option => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`
                relative px-3 sm:px-4 py-3 sm:py-4 rounded-xl transition-all duration-200 touch-manipulation min-h-[80px]
                ${isSelected
                  ? `bg-gradient-to-br ${option.color} text-white shadow-lg scale-105`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 border border-gray-700'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Flame
                      key={i}
                      size={16}
                      fill={i < option.flames ? 'currentColor' : 'none'}
                      strokeWidth={1.5}
                      className={i >= option.flames ? 'opacity-30' : ''}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold">{option.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
