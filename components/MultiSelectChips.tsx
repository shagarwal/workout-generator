'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface MultiSelectChipsProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelectChips({ label, options, selected, onChange }: MultiSelectChipsProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-100">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={`
                relative px-3 sm:px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 touch-manipulation min-h-[44px]
                ${isSelected
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                }
              `}
            >
              <span className="flex items-center gap-1.5">
                {isSelected && <Check size={16} strokeWidth={3} />}
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
