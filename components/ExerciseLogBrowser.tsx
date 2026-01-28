'use client';

import React, { useState, useMemo } from 'react';
import { X, Search, Filter, ChevronLeft, Dumbbell } from 'lucide-react';
import { Exercise, MuscleGroup, Equipment, WorkoutPerformance } from '@/lib/types';
import { exerciseLibrary } from '@/lib/exercises';
import ExerciseHistory from './ExerciseHistory';
import PerformanceTracker from './PerformanceTracker';

interface ExerciseLogBrowserProps {
  isOpen: boolean;
  onClose: () => void;
}

const muscleGroups: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Full Body'
];

const equipmentOptions: Equipment[] = [
  'Bodyweight', 'Dumbbells', 'Barbell', 'Kettlebell', 'Resistance bands',
  'Pull-up bar', 'Bench', 'Cable machine', 'Smith machine',
  'Leg press machine', 'Leg curl machine', 'Leg extension machine',
  'Lat pulldown machine', 'Seated row machine', 'Chest press machine',
  'Shoulder press machine', 'Pec deck machine', 'Hack squat machine',
  'Calf raise machine', 'Back extension machine', 'Weight plate',
  'Medicine ball', 'Battle ropes', 'Sled',
  'Treadmill', 'Stationary bike', 'Rowing machine', 'Elliptical',
  'Stair climber', 'Jump rope', 'Assault bike'
];

export default function ExerciseLogBrowser({ isOpen, onClose }: ExerciseLogBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'muscles' | 'equipment'>('muscles');
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showPerformanceTracker, setShowPerformanceTracker] = useState(false);

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    let filtered = exerciseLibrary.filter(ex => ex.type === 'weights' || ex.type === 'cardio');

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.muscles.some(m => m.toLowerCase().includes(query))
      );
    }

    // Apply muscle filter
    if (selectedMuscles.length > 0) {
      filtered = filtered.filter(ex =>
        ex.muscles.some(m => selectedMuscles.includes(m))
      );
    }

    // Apply equipment filter
    if (selectedEquipment.length > 0) {
      filtered = filtered.filter(ex =>
        ex.equipment.some(e => selectedEquipment.includes(e)) ||
        (ex.equipment.length === 0 && selectedEquipment.includes('Bodyweight'))
      );
    }

    return filtered;
  }, [searchQuery, selectedMuscles, selectedEquipment]);

  const toggleMuscle = (muscle: MuscleGroup) => {
    setSelectedMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const toggleEquipment = (equipment: Equipment) => {
    setSelectedEquipment(prev =>
      prev.includes(equipment)
        ? prev.filter(e => e !== equipment)
        : [...prev, equipment]
    );
  };

  const clearFilters = () => {
    setSelectedMuscles([]);
    setSelectedEquipment([]);
    setSearchQuery('');
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowPerformanceTracker(false);
  };

  const handleBack = () => {
    setSelectedExercise(null);
    setShowPerformanceTracker(false);
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setSearchQuery('');
    setSelectedMuscles([]);
    setSelectedEquipment([]);
    setShowFilters(false);
    setSelectedExercise(null);
    setShowPerformanceTracker(false);
  };

  const handleSavePerformance = async (performance: Omit<WorkoutPerformance, 'id' | 'userId' | 'date'>) => {
    const response = await fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(performance),
    });

    if (!response.ok) {
      throw new Error('Failed to save performance');
    }

    // Close tracker and show history
    setShowPerformanceTracker(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    const response = await fetch(`/api/performance?id=${entryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete entry');
    }
  };

  if (!isOpen) return null;

  const activeFiltersCount = selectedMuscles.length + selectedEquipment.length;

  // Exercise Detail View
  if (selectedExercise) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-700 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h2 className="text-lg font-bold text-white">{selectedExercise.name}</h2>
                <p className="text-sm text-gray-400">{selectedExercise.muscles.join(', ')}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {showPerformanceTracker ? (
              <PerformanceTracker
                exerciseName={selectedExercise.name}
                exerciseId={selectedExercise.id}
                onSave={handleSavePerformance}
                onClose={() => setShowPerformanceTracker(false)}
              />
            ) : (
              <ExerciseHistory
                exerciseName={selectedExercise.name}
                onClose={handleBack}
                onDeleteEntry={handleDeleteEntry}
                onAddNew={() => setShowPerformanceTracker(true)}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Exercise List View
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lime-500 rounded-lg">
              <Dumbbell size={20} className="text-gray-900" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Exercise Log</h2>
              <p className="text-sm text-gray-400">View history & log new entries</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-gray-700 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exercises..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-lime-500 text-gray-900'
                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-750'
              }`}
            >
              <Filter size={18} />
              Filter
              {activeFiltersCount > 0 && (
                <span className="bg-gray-900 text-lime-400 text-xs font-bold px-1.5 py-0.5 rounded">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              {/* Filter Tabs */}
              <div className="flex border-b border-gray-700">
                <button
                  onClick={() => setActiveFilterTab('muscles')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
                    activeFilterTab === 'muscles'
                      ? 'bg-gray-700 text-lime-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  Muscle Groups
                  {selectedMuscles.length > 0 && (
                    <span className="ml-1.5 text-xs bg-lime-500 text-gray-900 px-1.5 py-0.5 rounded">
                      {selectedMuscles.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveFilterTab('equipment')}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
                    activeFilterTab === 'equipment'
                      ? 'bg-gray-700 text-lime-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  Equipment
                  {selectedEquipment.length > 0 && (
                    <span className="ml-1.5 text-xs bg-lime-500 text-gray-900 px-1.5 py-0.5 rounded">
                      {selectedEquipment.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Filter Content */}
              <div className="p-4 max-h-48 overflow-y-auto">
                {activeFilterTab === 'muscles' && (
                  <div className="flex flex-wrap gap-2">
                    {muscleGroups.map(muscle => (
                      <label
                        key={muscle}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                          selectedMuscles.includes(muscle)
                            ? 'bg-lime-500 text-gray-900'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMuscles.includes(muscle)}
                          onChange={() => toggleMuscle(muscle)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{muscle}</span>
                      </label>
                    ))}
                  </div>
                )}

                {activeFilterTab === 'equipment' && (
                  <div className="flex flex-wrap gap-2">
                    {equipmentOptions.map(equipment => (
                      <label
                        key={equipment}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                          selectedEquipment.includes(equipment)
                            ? 'bg-lime-500 text-gray-900'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEquipment.includes(equipment)}
                          onChange={() => toggleEquipment(equipment)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{equipment}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <div className="px-4 pb-3">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-400 hover:text-white transition-all"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-400 mb-3">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
          </p>
          <div className="space-y-2">
            {filteredExercises.map(exercise => (
              <button
                key={exercise.id}
                onClick={() => handleSelectExercise(exercise)}
                className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-lime-500/50 rounded-xl transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-100 group-hover:text-lime-400 transition-all">
                      {exercise.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {exercise.muscles.join(', ')}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {exercise.equipment.length > 0 ? exercise.equipment.join(', ') : 'Bodyweight'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    exercise.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                    exercise.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {exercise.difficulty}
                  </span>
                </div>
              </button>
            ))}
            {filteredExercises.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No exercises match your filters
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
