'use client';

import React from 'react';
import { Home, Building2, Hotel, TreePine } from 'lucide-react';

export type Location = 'home' | 'gym' | 'hotel' | 'outdoors';

interface LocationSelectorProps {
  value: Location | null;
  onChange: (location: Location) => void;
}

const locations = [
  { id: 'home' as Location, label: 'Home', icon: Home, color: 'from-blue-500 to-blue-600' },
  { id: 'gym' as Location, label: 'Gym', icon: Building2, color: 'from-purple-500 to-purple-600' },
  { id: 'hotel' as Location, label: 'Hotel', icon: Hotel, color: 'from-orange-500 to-orange-600' },
  { id: 'outdoors' as Location, label: 'Outdoors', icon: TreePine, color: 'from-green-500 to-green-600' },
];

export default function LocationSelector({ value, onChange }: LocationSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-gray-100">
        Where are you working out?
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {locations.map((location) => {
          const Icon = location.icon;
          const isSelected = value === location.id;

          return (
            <button
              key={location.id}
              onClick={() => onChange(location.id)}
              className={`
                relative p-4 rounded-xl transition-all duration-200 touch-manipulation
                ${isSelected
                  ? `bg-gradient-to-br ${location.color} text-white shadow-lg scale-105`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 border border-gray-700'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon size={28} strokeWidth={2} />
                <span className="text-sm font-bold">{location.label}</span>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-gradient-to-br from-lime-400 to-lime-500 rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
