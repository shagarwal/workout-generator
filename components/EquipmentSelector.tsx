'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Equipment, WeightEquipment, CardioEquipment } from '@/lib/types';

interface EquipmentSelectorProps {
  weightEquipment: WeightEquipment[];
  cardioEquipment: CardioEquipment[];
  selected: Equipment[];
  onChange: (equipment: Equipment[]) => void;
  disabled?: boolean;
}

export default function EquipmentSelector({
  weightEquipment,
  cardioEquipment,
  selected,
  onChange,
  disabled = false,
}: EquipmentSelectorProps) {
  const [showAllWeight, setShowAllWeight] = useState(false);
  const [showAllCardio, setShowAllCardio] = useState(false);

  const commonWeight: WeightEquipment[] = ['Bodyweight', 'Dumbbells', 'Barbell', 'Bench', 'Smith machine'];
  const visibleWeight = showAllWeight ? weightEquipment : weightEquipment.filter(eq => commonWeight.includes(eq));
  const hiddenWeightCount = weightEquipment.length - visibleWeight.length;

  const toggleEquipment = (equipment: Equipment) => {
    if (disabled) return;
    if (selected.includes(equipment)) {
      onChange(selected.filter(e => e !== equipment));
    } else {
      onChange([...selected, equipment]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Weight Equipment */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-100">Weight Equipment</label>
        <div className="flex flex-wrap gap-2">
          {visibleWeight.map(equipment => (
            <button
              key={equipment}
              type="button"
              onClick={() => toggleEquipment(equipment)}
              disabled={disabled}
              className={`
                px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px]
                ${selected.includes(equipment)
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105'
                  : disabled
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                }
              `}
            >
              {equipment}
            </button>
          ))}
          {hiddenWeightCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllWeight(!showAllWeight)}
              className="px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-800 text-lime-400 hover:bg-gray-750 border border-gray-700 transition-all touch-manipulation flex items-center gap-1.5 min-h-[44px]"
            >
              {showAllWeight ? (
                <>
                  <ChevronUp size={16} />
                  Show Less
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {hiddenWeightCount} More
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Cardio Equipment */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-100">Cardio Equipment</label>
        <div className="flex flex-wrap gap-2">
          {cardioEquipment.slice(0, showAllCardio ? undefined : 4).map(equipment => (
            <button
              key={equipment}
              type="button"
              onClick={() => toggleEquipment(equipment)}
              disabled={disabled}
              className={`
                px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[44px]
                ${selected.includes(equipment)
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg scale-105'
                  : disabled
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                }
              `}
            >
              {equipment}
            </button>
          ))}
          {cardioEquipment.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllCardio(!showAllCardio)}
              className="px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-800 text-lime-400 hover:bg-gray-750 border border-gray-700 transition-all touch-manipulation flex items-center gap-1.5 min-h-[44px]"
            >
              {showAllCardio ? (
                <>
                  <ChevronUp size={16} />
                  Show Less
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {cardioEquipment.length - 4} More
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
