'use client';

import React, { useState, useEffect } from 'react';
import { WorkoutPlan } from '@/lib/types';
import { X, Trash2, Calendar } from 'lucide-react';

interface SavedWorkout {
  id: string;
  name: string;
  plan: WorkoutPlan;
  savedAt: string;
}

interface SavedWorkoutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (plan: WorkoutPlan) => void;
}

export default function SavedWorkoutsModal({ isOpen, onClose, onLoad }: SavedWorkoutsModalProps) {
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadSavedWorkouts();
    }
  }, [isOpen]);

  const loadSavedWorkouts = () => {
    const saved = localStorage.getItem('savedWorkouts');
    if (saved) {
      setSavedWorkouts(JSON.parse(saved));
    }
  };

  const handleDelete = (id: string) => {
    const updated = savedWorkouts.filter(w => w.id !== id);
    setSavedWorkouts(updated);
    localStorage.setItem('savedWorkouts', JSON.stringify(updated));
  };

  const handleLoadWorkout = (plan: WorkoutPlan) => {
    onLoad(plan);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-gradient-to-r from-lime-400 to-lime-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-white">SAVED WORKOUTS</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {savedWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No saved workouts yet</p>
              <p className="text-gray-500 text-sm mt-2">Generate and save a workout to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedWorkouts.map(workout => (
                <div
                  key={workout.id}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-2">{workout.name}</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-400">
                          <span className="text-lime-400 font-semibold">Muscles:</span> {workout.plan.summary.muscles}
                        </p>
                        <p className="text-gray-400">
                          <span className="text-lime-400 font-semibold">Style:</span> {workout.plan.summary.workoutStyle}
                        </p>
                        <div className="flex items-center gap-2 text-gray-500 text-xs mt-2">
                          <Calendar size={12} />
                          <span>{new Date(workout.savedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleLoadWorkout(workout.plan)}
                        className="px-4 py-2 bg-gradient-to-r from-lime-400 to-lime-500 text-gray-900 rounded-lg font-bold text-sm hover:from-lime-500 hover:to-lime-600 transition-all"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(workout.id)}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-medium text-sm hover:bg-red-600 hover:text-white transition-all flex items-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
