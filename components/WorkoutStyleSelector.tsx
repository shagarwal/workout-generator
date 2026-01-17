'use client';

import React, { useState } from 'react';
import { WorkoutStyle } from '@/lib/types';
import { Repeat, Zap, Link2, Timer, Info } from 'lucide-react';

interface WorkoutStyleSelectorProps {
  value: WorkoutStyle;
  onChange: (value: WorkoutStyle) => void;
}

const styleOptions = [
  {
    value: 'traditional' as WorkoutStyle,
    label: 'Traditional',
    description: 'Complete all sets of one exercise before moving to the next',
    details: 'Best for building strength and mastering form. Take full rest between sets to recover completely before the next set.',
    icon: Repeat,
    color: 'from-blue-500 to-blue-600',
  },
  {
    value: 'circuit' as WorkoutStyle,
    label: 'Circuit',
    description: 'Cycle through exercises with minimal rest between',
    details: 'Great for fat burning and conditioning. Move quickly between exercises with 15-30s rest. Complete all rounds of the circuit.',
    icon: Zap,
    color: 'from-orange-500 to-orange-600',
  },
  {
    value: 'superset' as WorkoutStyle,
    label: 'Superset',
    description: 'Pair exercises back-to-back with no rest in between',
    details: 'Efficient time-saver. Perform two exercises consecutively with no rest, then rest before the next pair. Ideal for working opposing muscle groups.',
    icon: Link2,
    color: 'from-purple-500 to-purple-600',
  },
  {
    value: 'amrap' as WorkoutStyle,
    label: 'AMRAP',
    description: 'As Many Rounds As Possible in the allotted time',
    details: 'High-intensity challenge. Complete the circuit as many times as possible within your workout duration. No rest between exercises - keep moving!',
    icon: Timer,
    color: 'from-red-500 to-red-600',
  },
];

export default function WorkoutStyleSelector({ value, onChange }: WorkoutStyleSelectorProps) {
  const [showTooltip, setShowTooltip] = useState<WorkoutStyle | null>(null);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-100">Workout Style</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {styleOptions.map(option => {
          const isSelected = value === option.value;
          const Icon = option.icon;
          const isTooltipVisible = showTooltip === option.value;

          return (
            <div key={option.value} className="relative">
              <button
                type="button"
                onClick={() => onChange(option.value)}
                className={`
                  relative p-3 rounded-lg transition-all duration-200 touch-manipulation text-left w-full
                  ${isSelected
                    ? `bg-gradient-to-br ${option.color} text-white shadow-lg scale-105 border-2 border-white/20`
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Icon size={18} className={isSelected ? 'text-white' : 'text-gray-400'} strokeWidth={2} />
                  <span className="font-bold text-sm flex-1">{option.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTooltip(isTooltipVisible ? null : option.value);
                    }}
                    className={`p-1 rounded-full transition-colors flex-shrink-0 ${
                      isSelected
                        ? 'hover:bg-white/20'
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <Info size={12} className={isSelected ? 'text-white/80' : 'text-gray-400'} />
                  </button>
                </div>
              </button>

              {/* Tooltip */}
              {isTooltipVisible && (
                <div className="absolute z-20 top-full left-0 right-0 mt-2 p-4 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl">
                  <div className="flex items-start gap-2 mb-3">
                    <Info size={16} className="text-lime-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 mb-2">{option.description}</p>
                      <p className="text-xs text-gray-200 leading-relaxed">
                        {option.details}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTooltip(null)}
                    className="text-xs text-lime-400 font-medium hover:text-lime-300 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
