'use client';

import React, { useState, useEffect } from 'react';
import { MuscleGroup, Equipment, WeightEquipment, CardioEquipment, Intensity, WorkoutStyle, WorkoutInputs, WorkoutPlan } from '@/lib/types';
import { generateWorkoutPlan } from '@/lib/generator';
import { exerciseLibrary } from '@/lib/exercises';
import MultiSelectChips from '@/components/MultiSelectChips';
import IntensitySelector from '@/components/IntensitySelector';
import SliderInput from '@/components/SliderInput';
import DurationPicker from '@/components/DurationPicker';
import StretchingPicker from '@/components/StretchingPicker';
import WorkoutDisplay from '@/components/WorkoutDisplay';
import LocationSelector, { Location } from '@/components/LocationSelector';
import EquipmentSelector from '@/components/EquipmentSelector';
import WorkoutStyleSelector from '@/components/WorkoutStyleSelector';
import SavedWorkoutsModal from '@/components/SavedWorkoutsModal';
import SaveWorkoutModal from '@/components/SaveWorkoutModal';
import { Dumbbell, Zap, FolderOpen } from 'lucide-react';

const muscleOptions: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Glutes',
  'Core',
  'Full Body',
];

const weightEquipmentOptions: WeightEquipment[] = [
  'Bodyweight',
  'Dumbbells',
  'Barbell',
  'Kettlebell',
  'Resistance bands',
  'Pull-up bar',
  'Bench',
  'Cable machine',
  'Smith machine',
  'Leg press machine',
  'Leg curl machine',
  'Leg extension machine',
  'Lat pulldown machine',
  'Seated row machine',
  'Chest press machine',
  'Shoulder press machine',
  'Pec deck machine',
  'Hack squat machine',
  'Calf raise machine',
];

const cardioEquipmentOptions: CardioEquipment[] = [
  'Treadmill',
  'Stationary bike',
  'Rowing machine',
  'Elliptical',
  'Stair climber',
  'Jump rope',
  'Assault bike',
];

export default function Home() {
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  const [intensity, setIntensity] = useState<Intensity>('moderate');
  const [cardioWeightSplit, setCardioWeightSplit] = useState<number>(30);
  const [duration, setDuration] = useState<number>(30);
  const [workoutStyle, setWorkoutStyle] = useState<WorkoutStyle>('traditional');
  const [stretchingMinutes, setStretchingMinutes] = useState<number>(5);
  const [stretchingOnly, setStretchingOnly] = useState<boolean>(false);
  const [otherNotes, setOtherNotes] = useState<string>('');
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [showSavedWorkouts, setShowSavedWorkouts] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);

  // Auto-select equipment based on location
  useEffect(() => {
    if (!location) return;

    let equipment: Equipment[] = [];
    switch (location) {
      case 'home':
        equipment = ['Bodyweight', 'Dumbbells', 'Resistance bands', 'Bench'];
        break;
      case 'gym':
        equipment = [
          'Bodyweight', 'Dumbbells', 'Barbell', 'Bench', 'Cable machine',
          'Leg press machine', 'Lat pulldown machine', 'Seated row machine',
          'Chest press machine', 'Treadmill', 'Stationary bike', 'Rowing machine'
        ];
        break;
      case 'hotel':
        equipment = ['Bodyweight', 'Dumbbells', 'Treadmill', 'Stationary bike'];
        break;
      case 'outdoors':
        equipment = ['Bodyweight', 'Jump rope'];
        break;
    }
    setSelectedEquipment(equipment);
  }, [location]);

  // Filter equipment options based on selected muscles
  const getRelevantEquipment = (muscles: MuscleGroup[]): Equipment[] => {
    if (muscles.length === 0) {
      // If no muscles selected, show all equipment
      return [...weightEquipmentOptions, ...cardioEquipmentOptions];
    }

    // Find all exercises that target the selected muscles
    const relevantExercises = exerciseLibrary.filter(exercise =>
      exercise.muscles.some(muscle => muscles.includes(muscle)) &&
      exercise.type === 'weights' // Only consider weight exercises for equipment filtering
    );

    // Get unique equipment from those exercises
    const relevantEquipmentSet = new Set<Equipment>();
    relevantExercises.forEach(exercise => {
      exercise.equipment.forEach(eq => {
        relevantEquipmentSet.add(eq as Equipment);
      });
    });

    // Always include bodyweight and cardio equipment
    relevantEquipmentSet.add('Bodyweight');
    cardioEquipmentOptions.forEach(eq => relevantEquipmentSet.add(eq));

    // Filter weight equipment to only show relevant ones
    const filteredWeightEquipment = weightEquipmentOptions.filter(eq =>
      relevantEquipmentSet.has(eq)
    );

    return [...filteredWeightEquipment, ...cardioEquipmentOptions];
  };

  const filteredEquipment = getRelevantEquipment(selectedMuscles);

  // Split into weight and cardio for display
  const filteredWeightEquipment = filteredEquipment.filter(eq =>
    weightEquipmentOptions.includes(eq as WeightEquipment)
  ) as WeightEquipment[];

  const filteredCardioEquipment = filteredEquipment.filter(eq =>
    cardioEquipmentOptions.includes(eq as CardioEquipment)
  ) as CardioEquipment[];

  const validateInputs = (): boolean => {
    if (selectedMuscles.length === 0) {
      setValidationError('Please select at least one muscle group');
      return false;
    }
    if (selectedEquipment.length === 0) {
      setValidationError('Please select at least one equipment option');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleGenerate = () => {
    if (!validateInputs()) return;

    setIsGenerating(true);

    // Simulate loading for better UX
    setTimeout(() => {
      const inputs: WorkoutInputs = {
        selectedMuscles,
        equipment: selectedEquipment,
        intensity,
        cardioWeightSplit: stretchingOnly ? 0 : cardioWeightSplit,
        durationMinutes: duration,
        workoutStyle,
        stretchingMinutes,
        stretchingOnly,
        otherNotes,
      };

      const plan = generateWorkoutPlan(inputs);
      setWorkoutPlan(plan);
      setIsGenerating(false);

      // Scroll to results
      setTimeout(() => {
        document.getElementById('workout-results')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }, 500);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleCopyToClipboard = () => {
    if (!workoutPlan) return;

    let text = `${workoutPlan.summary.title}\n\n`;
    text += `Muscles: ${workoutPlan.summary.muscles}\n`;
    text += `Equipment: ${workoutPlan.summary.equipment}\n`;
    text += `Intensity: ${workoutPlan.summary.intensity}\n`;
    text += `Split: Cardio ${workoutPlan.summary.cardioPercent}% / Weights ${workoutPlan.summary.weightsPercent}%\n\n`;

    const formatSection = (section: { title: string; items: any[] }) => {
      let sectionText = `${section.title}\n${'-'.repeat(section.title.length)}\n`;
      section.items.forEach((item, idx) => {
        sectionText += `${idx + 1}. ${item.name}\n`;
        sectionText += `   ${item.sets > 1 ? `${item.sets} sets × ` : ''}${item.target}\n`;
        if (item.restSeconds) {
          sectionText += `   Rest: ${item.restSeconds}s\n`;
        }
        sectionText += `   YouTube: ${item.youtubeUrl}\n\n`;
      });
      return sectionText;
    };

    text += formatSection(workoutPlan.sections.stretching);
    text += '\n';
    text += formatSection(workoutPlan.sections.main);

    navigator.clipboard.writeText(text).then(() => {
      alert('Workout copied to clipboard!');
    });
  };

  const handleSaveWorkout = () => {
    setShowSaveModal(true);
  };

  const handleLoadWorkout = (plan: WorkoutPlan) => {
    setWorkoutPlan(plan);
    setTimeout(() => {
      document.getElementById('workout-results')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-2xl">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-lime-400 to-lime-500 rounded-lg">
                <Dumbbell size={28} className="text-gray-900" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">WORKOUT BUILDER</h1>
                <p className="text-xs text-gray-400 font-medium">Build your perfect routine</p>
              </div>
            </div>
            <button
              onClick={() => setShowSavedWorkouts(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg font-bold hover:bg-gray-750 border border-gray-700 transition-all"
            >
              <FolderOpen size={18} />
              <span className="hidden sm:inline">SAVED</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Input Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 space-y-8 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-gradient-to-r from-lime-400 to-lime-500 rounded-full"></div>
            <h2 className="text-2xl font-black text-white">CONFIGURE</h2>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm font-medium">
              ⚠️ {validationError}
            </div>
          )}

          {/* Location Selector */}
          <LocationSelector value={location} onChange={setLocation} />

          {/* Muscle Selection */}
          <MultiSelectChips
            label="Muscle Groups"
            options={muscleOptions}
            selected={selectedMuscles}
            onChange={setSelectedMuscles}
          />

          {/* Equipment Selection */}
          {location && (
            <EquipmentSelector
              weightEquipment={filteredWeightEquipment}
              cardioEquipment={filteredCardioEquipment}
              selected={selectedEquipment}
              onChange={setSelectedEquipment}
              disabled={false}
            />
          )}

          {/* Intensity */}
          <IntensitySelector value={intensity} onChange={setIntensity} />

          {/* Workout Style */}
          <WorkoutStyleSelector value={workoutStyle} onChange={setWorkoutStyle} />

          {/* Cardio vs Weights Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-gray-100">
                Cardio vs Weights Split
              </label>
              <button
                type="button"
                onClick={() => setStretchingOnly(!stretchingOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  stretchingOnly
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-750'
                }`}
              >
                {stretchingOnly ? '✓ Stretching Only' : 'Stretching Only'}
              </button>
            </div>
            {!stretchingOnly && (
              <SliderInput
                label=""
                value={cardioWeightSplit}
                onChange={setCardioWeightSplit}
                min={0}
                max={100}
                step={5}
                showIcons={true}
                formatLabel={(val) =>
                  val === 0
                    ? '100% Weights'
                    : val === 100
                    ? '100% Cardio'
                    : `${val}% Cardio / ${100 - val}% Weights`
                }
              />
            )}
            {stretchingOnly && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-200">
                <p className="font-semibold mb-1">Stretching-Only Mode Active</p>
                <p className="text-xs text-blue-300">Your workout will consist entirely of muscle-specific stretches with no cardio or weight training.</p>
              </div>
            )}
          </div>

          {/* Duration */}
          <DurationPicker value={duration} onChange={setDuration} />

          {/* Stretching Duration */}
          <StretchingPicker value={stretchingMinutes} onChange={setStretchingMinutes} />

          {/* Other Notes (Optional) */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-100">
              Additional Notes (Optional)
            </label>
            <textarea
              value={otherNotes}
              onChange={(e) => setOtherNotes(e.target.value)}
              placeholder="Any specific preferences, injuries, or limitations..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-lime-400 focus:border-transparent resize-none transition-all"
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-5 bg-gradient-to-r from-lime-400 to-lime-500 text-gray-900 rounded-xl font-black text-lg hover:from-lime-500 hover:to-lime-600 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 transition-all duration-200 touch-manipulation shadow-xl hover:shadow-lime-400/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-3 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                GENERATING...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Zap size={20} fill="currentColor" />
                GENERATE WORKOUT
              </span>
            )}
          </button>
        </div>

        {/* Workout Results */}
        {workoutPlan && (
          <div id="workout-results">
            <WorkoutDisplay
              plan={workoutPlan}
              onRegenerate={handleRegenerate}
              onCopyToClipboard={handleCopyToClipboard}
              onSave={handleSaveWorkout}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <SavedWorkoutsModal
        isOpen={showSavedWorkouts}
        onClose={() => setShowSavedWorkouts(false)}
        onLoad={handleLoadWorkout}
      />

      {workoutPlan && (
        <SaveWorkoutModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          workoutPlan={workoutPlan}
        />
      )}
    </div>
  );
}
