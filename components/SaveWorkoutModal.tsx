'use client';

import React, { useState } from 'react';
import { WorkoutPlan } from '@/lib/types';
import { X, Save } from 'lucide-react';

interface SaveWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutPlan: WorkoutPlan;
}

export default function SaveWorkoutModal({ isOpen, onClose, workoutPlan }: SaveWorkoutModalProps) {
  const [workoutName, setWorkoutName] = useState('');

  const handleSave = () => {
    if (!workoutName.trim()) {
      alert('Please enter a workout name');
      return;
    }

    const savedWorkouts = JSON.parse(localStorage.getItem('savedWorkouts') || '[]');

    const newWorkout = {
      id: Date.now().toString(),
      name: workoutName.trim(),
      plan: workoutPlan,
      savedAt: new Date().toISOString(),
    };

    savedWorkouts.push(newWorkout);
    localStorage.setItem('savedWorkouts', JSON.stringify(savedWorkouts));

    setWorkoutName('');
    onClose();
    alert('Workout saved successfully!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-gradient-to-r from-lime-400 to-lime-500 rounded-full"></div>
              <h2 className="text-xl font-black text-white">SAVE WORKOUT</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-100 mb-2">
              Workout Name
            </label>
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g., Upper Body Strength, HIIT Cardio..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-2">
              <span className="font-bold text-lime-400">Preview:</span>
            </p>
            <p className="text-sm text-gray-300">{workoutPlan.summary.title}</p>
            <p className="text-xs text-gray-500 mt-1">{workoutPlan.summary.muscles}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-750 border border-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-lime-400 to-lime-500 text-gray-900 rounded-xl font-bold hover:from-lime-500 hover:to-lime-600 transition-all shadow-lg"
            >
              <Save size={18} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
