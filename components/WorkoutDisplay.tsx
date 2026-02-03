'use client';

import React, { useState } from 'react';
import { WorkoutPlan, WorkoutPerformance, WorkoutItem, Exercise } from '@/lib/types';
import { ExternalLink, Copy, ChevronDown, ChevronUp, Save, Share2, TrendingUp, Dumbbell, RefreshCw, GripVertical } from 'lucide-react';
import { useSession } from 'next-auth/react';
import PerformanceTracker from './PerformanceTracker';
import ExerciseHistory from './ExerciseHistory';
import ExerciseSwapModal from './ExerciseSwapModal';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  defaultAnimateLayoutChanges,
} from '@dnd-kit/sortable';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WorkoutDisplayProps {
  plan: WorkoutPlan;
  onCopyToClipboard: () => void;
  onSave: () => void;
  onShare: () => void;
  onSwapExercise?: (sectionKey: 'stretching' | 'main', index: number, newExercise: Exercise) => void;
  onReorder?: (newItems: WorkoutItem[]) => void;
}

export default function WorkoutDisplay({ plan, onCopyToClipboard, onSave, onShare, onSwapExercise, onReorder }: WorkoutDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 space-y-6 border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-1 w-12 bg-gradient-to-r from-lime-400 to-lime-500 rounded-full"></div>
          <h2 className="text-2xl font-black text-white">{plan.summary.title.toUpperCase()}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <span className="font-bold text-lime-400 block mb-1">MUSCLES</span>
            <p className="text-gray-200 font-medium">{plan.summary.muscles}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <span className="font-bold text-lime-400 block mb-1">EQUIPMENT</span>
            <p className="text-gray-200 font-medium">{plan.summary.equipment}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <span className="font-bold text-lime-400 block mb-1">INTENSITY</span>
            <p className="text-gray-200 font-medium capitalize">{plan.summary.intensity}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <span className="font-bold text-lime-400 block mb-1">STYLE</span>
            <p className="text-gray-200 font-medium capitalize">{plan.summary.workoutStyle}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 sm:col-span-2">
            <span className="font-bold text-lime-400 block mb-1">SPLIT</span>
            <p className="text-gray-200 font-medium">
              Cardio {plan.summary.cardioPercent}% / Weights {plan.summary.weightsPercent}%
            </p>
          </div>
        </div>

        {/* AMRAP Instructions */}
        {plan.summary.workoutStyle === 'amrap' && (
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
            <p className="text-orange-200 text-sm font-medium">
              <span className="font-bold">AMRAP Instructions:</span> Complete as many rounds as possible of the main workout exercises in the allotted time. Move continuously with minimal rest between exercises. Track your total rounds completed!
            </p>
          </div>
        )}

        {/* Superset Instructions */}
        {plan.summary.workoutStyle === 'superset' && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
            <p className="text-purple-200 text-sm font-medium">
              <span className="font-bold">Superset Instructions:</span> Each superset pairs two exercises together. Perform them back-to-back with no rest, then rest before the next set.
            </p>
          </div>
        )}

        {/* Circuit Instructions */}
        {plan.summary.workoutStyle === 'circuit' && (
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-4">
            <p className="text-orange-200 text-sm font-medium">
              <span className="font-bold">Circuit Instructions:</span> Each circuit contains 3-5 exercises. Do 1 set of each exercise in order with minimal rest (15-30s), then repeat the entire circuit for the specified number of rounds before moving to the next circuit.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={onSave}
            className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-lime-400 to-lime-500 text-gray-900 rounded-xl font-bold hover:from-lime-500 hover:to-lime-600 transition-all duration-200 touch-manipulation shadow-lg hover:scale-105 active:scale-95"
          >
            <Save size={18} />
            SAVE
          </button>
          <button
            onClick={onShare}
            className="flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 touch-manipulation shadow-lg hover:scale-105 active:scale-95"
          >
            <Share2 size={18} />
            SHARE
          </button>
          <button
            onClick={onCopyToClipboard}
            className="flex items-center justify-center gap-2 px-4 py-4 bg-gray-800 text-gray-200 rounded-xl font-bold hover:bg-gray-750 border border-gray-700 transition-all duration-200 touch-manipulation hover:scale-105 active:scale-95"
          >
            <Copy size={18} />
            COPY
          </button>
        </div>
      </div>

      {/* Stretching Section (Pre-Workout) */}
      {plan.sections.stretching.items.length > 0 && (
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-2xl shadow-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
            <h3 className="text-2xl font-black text-blue-100">{plan.sections.stretching.title.toUpperCase()}</h3>
          </div>
          <div className="space-y-4">
            {plan.sections.stretching.items.map((item, index) => (
              <ExerciseCard
                key={index}
                item={item}
                isInCircuit={false}
                showPerformanceTracking={false}
                onSwap={onSwapExercise ? (newExercise) => onSwapExercise('stretching', index, newExercise) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Workout Section */}
      <WorkoutSection section={plan.sections.main} workoutStyle={plan.summary.workoutStyle} onSwapExercise={onSwapExercise} onReorder={onReorder} />
    </div>
  );
}

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (wasDragging) {
    return false;
  }
  return defaultAnimateLayoutChanges(args);
};

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, animateLayoutChanges });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-stretch">
        <button
          {...listeners}
          className="flex items-center px-1 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 touch-manipulation"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

function DraggableGroupList({
  groupIds,
  onReorder,
  children,
  renderOverlay,
}: {
  groupIds: string[];
  onReorder?: (reorderedIds: string[]) => void;
  children: React.ReactNode;
  renderOverlay: (activeId: string | null) => React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = groupIds.indexOf(active.id as string);
    const newIndex = groupIds.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(groupIds, oldIndex, newIndex));
    }
  };

  if (!onReorder) {
    return <>{children}</>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {renderOverlay(activeId)}
      </DragOverlay>
    </DndContext>
  );
}

function WorkoutSection({ section, workoutStyle, onSwapExercise, onReorder }: {
  section: { title: string; items: any[] },
  workoutStyle?: string,
  onSwapExercise?: (sectionKey: 'stretching' | 'main', index: number, newExercise: Exercise) => void,
  onReorder?: (newItems: WorkoutItem[]) => void
}) {
  // Group exercises by circuit if applicable
  if (workoutStyle === 'circuit') {
    const circuits: { [key: string]: { item: any; originalIndex: number }[] } = {};
    const nonCircuitItems: { item: any; originalIndex: number }[] = [];
    section.items.forEach((item, index) => {
      if (item.circuitId) {
        if (!circuits[item.circuitId]) {
          circuits[item.circuitId] = [];
        }
        circuits[item.circuitId].push({ item, originalIndex: index });
      } else {
        nonCircuitItems.push({ item, originalIndex: index });
      }
    });

    const circuitEntries = Object.entries(circuits);
    const circuitIds = circuitEntries.map(([id]) => id);

    const handleCircuitReorder = (reorderedIds: string[]) => {
      if (!onReorder) return;
      const newItems: any[] = [];
      reorderedIds.forEach(circuitId => {
        circuits[circuitId].forEach(({ item }) => {
          newItems.push(item);
        });
      });
      nonCircuitItems.forEach(({ item }) => {
        newItems.push(item);
      });
      onReorder(newItems);
    };

    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 space-y-6 border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"></div>
          <h3 className="text-xl font-black text-white">{section.title.toUpperCase()}</h3>
        </div>

        <DraggableGroupList
          groupIds={circuitIds}
          onReorder={onReorder ? handleCircuitReorder : undefined}
          renderOverlay={(activeId) => {
            if (!activeId) return null;
            const exercises = circuits[activeId];
            if (!exercises) return null;
            const idx = circuitIds.indexOf(activeId);
            return (
              <div className="opacity-80 bg-orange-900/30 rounded-xl border-2 border-orange-400/50 p-4 shadow-2xl">
                <h4 className="font-bold text-orange-400">CIRCUIT {idx + 1}</h4>
                <p className="text-sm text-gray-400">{exercises.length} exercises</p>
              </div>
            );
          }}
        >
          {circuitEntries.map(([circuitId, exerciseData], idx) => (
            <SortableItem key={circuitId} id={circuitId}>
              <div className="bg-orange-900/20 border-2 border-orange-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-orange-400">CIRCUIT {idx + 1}</h4>
                  <span className="text-sm font-bold text-orange-300 bg-orange-900/40 px-3 py-1 rounded-lg">
                    {exerciseData[0].item.circuitRounds} ROUNDS
                  </span>
                </div>
                <p className="text-xs text-orange-200/80 mb-4">Complete all exercises, then repeat for {exerciseData[0].item.circuitRounds} total rounds</p>
                <div className="space-y-2">
                  {exerciseData.map(({ item, originalIndex }) => (
                    <ExerciseCard
                      key={originalIndex}
                      item={item}
                      isInCircuit={true}
                      onSwap={onSwapExercise ? (newExercise) => onSwapExercise('main', originalIndex, newExercise) : undefined}
                    />
                  ))}
                </div>
              </div>
            </SortableItem>
          ))}
        </DraggableGroupList>

        {/* Non-circuit exercises (e.g., cardio) rendered individually below */}
        {nonCircuitItems.length > 0 && (
          <div className="space-y-3">
            {nonCircuitItems.map(({ item, originalIndex }) => (
              <ExerciseCard
                key={originalIndex}
                item={item}
                onSwap={onSwapExercise ? (newExercise) => onSwapExercise('main', originalIndex, newExercise) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // AMRAP - group all exercises as one repeatable round
  if (workoutStyle === 'amrap' && section.items[0]?.circuitId === 'amrap-round') {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 space-y-4 border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"></div>
          <h3 className="text-xl font-black text-white">{section.title.toUpperCase()}</h3>
        </div>

        <div className="bg-red-900/20 border-2 border-red-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-black text-red-400">AMRAP - AS MANY ROUNDS AS POSSIBLE</h4>
          </div>
          <p className="text-xs text-red-200/80 mb-4">Complete all exercises in order, then repeat as many times as possible in the allotted time. No rest between exercises!</p>
          <div className="space-y-2">
            {section.items.map((item, index) => (
              <ExerciseCard
                key={index}
                item={item}
                isInCircuit={true}
                onSwap={onSwapExercise ? (newExercise) => onSwapExercise('main', index, newExercise) : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SUPERSET: Group exercises by supersetId, similar to circuit rendering
  if (workoutStyle === 'superset') {
    const supersets: { [key: string]: { item: any; originalIndex: number }[] } = {};
    const nonSupersetItems: { item: any; originalIndex: number }[] = [];

    section.items.forEach((item, index) => {
      if (item.supersetId) {
        if (!supersets[item.supersetId]) {
          supersets[item.supersetId] = [];
        }
        supersets[item.supersetId].push({ item, originalIndex: index });
      } else {
        nonSupersetItems.push({ item, originalIndex: index });
      }
    });

    const supersetEntries = Object.entries(supersets);
    const supersetIds = supersetEntries.map(([id]) => id);

    const handleSupersetReorder = (reorderedIds: string[]) => {
      if (!onReorder) return;
      const newItems: any[] = [];
      reorderedIds.forEach(supersetId => {
        supersets[supersetId].forEach(({ item }) => {
          newItems.push(item);
        });
      });
      nonSupersetItems.forEach(({ item }) => {
        newItems.push(item);
      });
      onReorder(newItems);
    };

    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 space-y-6 border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full"></div>
          <h3 className="text-xl font-black text-white">{section.title.toUpperCase()}</h3>
        </div>

        <DraggableGroupList
          groupIds={supersetIds}
          onReorder={onReorder ? handleSupersetReorder : undefined}
          renderOverlay={(activeId) => {
            if (!activeId) return null;
            const exercises = supersets[activeId];
            if (!exercises) return null;
            const idx = supersetIds.indexOf(activeId);
            return (
              <div className="opacity-80 bg-purple-900/30 rounded-xl border-2 border-purple-400/50 p-4 shadow-2xl">
                <h4 className="font-bold text-purple-400">SUPERSET {idx + 1}</h4>
                <p className="text-sm text-gray-400">{exercises.length} exercises</p>
              </div>
            );
          }}
        >
          {supersetEntries.map(([supersetId, exerciseData], idx) => (
            <SortableItem key={supersetId} id={supersetId}>
              <div className="bg-purple-900/20 border-2 border-purple-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-purple-400">SUPERSET {idx + 1}</h4>
                  <span className="text-sm font-bold text-purple-300 bg-purple-900/40 px-3 py-1 rounded-lg">
                    {exerciseData[0].item.sets} SETS
                  </span>
                </div>
                <p className="text-xs text-purple-200/80 mb-4">Perform exercises back-to-back with no rest, then rest between sets</p>
                <div className="space-y-2">
                  {exerciseData.map(({ item, originalIndex }) => (
                    <ExerciseCard
                      key={originalIndex}
                      item={item}
                      isInCircuit={true}
                      onSwap={onSwapExercise ? (newExercise) => onSwapExercise('main', originalIndex, newExercise) : undefined}
                    />
                  ))}
                </div>
              </div>
            </SortableItem>
          ))}
        </DraggableGroupList>

        {/* Non-superset exercises (e.g., cardio) rendered individually below */}
        {nonSupersetItems.length > 0 && (
          <div className="space-y-3">
            {nonSupersetItems.map(({ item, originalIndex }) => (
              <ExerciseCard
                key={originalIndex}
                item={item}
                onSwap={onSwapExercise ? (newExercise) => onSwapExercise('main', originalIndex, newExercise) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Traditional - display exercises individually with drag-and-drop
  const exerciseIds = section.items.map((_, i) => `exercise-${i}`);

  const handleTraditionalReorder = (reorderedIds: string[]) => {
    if (!onReorder) return;
    const newItems = reorderedIds.map(id => {
      const idx = parseInt(id.replace('exercise-', ''));
      return section.items[idx];
    });
    onReorder(newItems);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 space-y-4 border border-gray-700">
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"></div>
        <h3 className="text-xl font-black text-white">{section.title.toUpperCase()}</h3>
      </div>

      <DraggableGroupList
        groupIds={exerciseIds}
        onReorder={onReorder ? handleTraditionalReorder : undefined}
        renderOverlay={(activeId) => {
          if (!activeId) return null;
          const idx = parseInt(activeId.replace('exercise-', ''));
          const item = section.items[idx];
          if (!item) return null;
          return (
            <div className="opacity-80 bg-gray-800 rounded-xl border-2 border-lime-400/50 p-4 shadow-2xl">
              <h4 className="font-bold text-gray-100">{item.name}</h4>
              <p className="text-sm text-gray-400">{item.target}</p>
            </div>
          );
        }}
      >
        <div className="space-y-3">
          {section.items.map((item, index) => (
            <SortableItem key={`exercise-${index}`} id={`exercise-${index}`}>
              <ExerciseCard
                item={item}
                onSwap={onSwapExercise ? (newExercise) => onSwapExercise('main', index, newExercise) : undefined}
              />
            </SortableItem>
          ))}
        </div>
      </DraggableGroupList>
    </div>
  );
}

function ExerciseCard({ item, isInCircuit = false, showPerformanceTracking = true, onSwap }: {
  item: any,
  isInCircuit?: boolean,
  showPerformanceTracking?: boolean,
  onSwap?: (newExercise: Exercise) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPerformanceTracker, setShowPerformanceTracker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const { data: session } = useSession();

  const handleSavePerformance = async (performance: Omit<WorkoutPerformance, 'id' | 'userId' | 'date'>) => {
    const response = await fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(performance),
    });

    if (!response.ok) {
      throw new Error('Failed to save performance');
    }

    // Close tracker and auto-expand history
    setShowPerformanceTracker(false);
    setShowHistory(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    const response = await fetch(`/api/performance?id=${entryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete entry');
    }
  };

  // Simplified display for circuits and AMRAP
  if (isInCircuit) {
    return (
      <div className="bg-gray-800/30 border border-gray-600/50 rounded-lg p-3 hover:bg-gray-800/50 transition-all">
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1">
            <h4 className="font-bold text-gray-100 text-sm">{item.name}</h4>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{item.target}</p>
            {item.muscles && item.muscles.length > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">{item.muscles.join(', ')}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setIsExpanded(!isExpanded);
                  if (isExpanded) {
                    setShowHistory(false);
                    setShowPerformanceTracker(false);
                  }
                }}
                className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                  isExpanded && !showHistory && !showPerformanceTracker
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-400/30 hover:bg-blue-500/20'
                }`}
              >
                Info
              </button>
              {session && showPerformanceTracking && (
                <button
                  onClick={() => {
                    setShowHistory(!showHistory);
                    setIsExpanded(false);
                    setShowPerformanceTracker(false);
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                    showHistory || showPerformanceTracker
                      ? 'bg-lime-500 text-gray-900'
                      : 'bg-lime-400/10 text-lime-400 border border-lime-400/30 hover:bg-lime-400/20'
                  }`}
                >
                  {(showHistory || showPerformanceTracker) ? <ChevronDown size={12} /> : <Dumbbell size={12} />}
                  Log
                </button>
              )}
            </div>
            {onSwap && (
              <button
                onClick={() => setShowSwapModal(true)}
                className="px-2 py-1 rounded text-xs font-bold transition-all bg-orange-500/10 text-orange-400 border border-orange-400/30 hover:bg-orange-500/20 flex items-center justify-center gap-1"
              >
                <RefreshCw size={10} />
                Swap
              </button>
            )}
          </div>
        </div>

        {/* Swap Modal */}
        {onSwap && (
          <ExerciseSwapModal
            isOpen={showSwapModal}
            onClose={() => setShowSwapModal(false)}
            onSelect={onSwap}
            currentExerciseName={item.name}
          />
        )}

        {/* Instructions Section */}
        {isExpanded && !showHistory && !showPerformanceTracker && item.instructions && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
              {item.instructions.map((step: string, idx: number) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
            {/* Image */}
            {item.imageUrl && (
              <div className="mt-3">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full max-w-sm rounded-lg border border-gray-700"
                  onError={(e) => {
                    console.error('Image failed to load:', item.imageUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            {item.youtubeUrl && (
              <a
                href={item.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                <ExternalLink size={12} />
                Video
              </a>
            )}
          </div>
        )}

        {/* Performance History Section */}
        {showHistory && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <ExerciseHistory
              exerciseName={item.name}
              onClose={() => setShowHistory(false)}
              onDeleteEntry={handleDeleteEntry}
              onAddNew={() => {
                setShowHistory(false);
                setShowPerformanceTracker(true);
              }}
            />
          </div>
        )}

        {/* New Entry Form */}
        {showPerformanceTracker && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <PerformanceTracker
              exerciseName={item.name}
              onSave={handleSavePerformance}
              onClose={() => setShowPerformanceTracker(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // Full display for traditional/superset workouts
  return (
    <div className="border border-gray-700 bg-gray-800/50 rounded-xl overflow-hidden hover:border-gray-600 transition-all">
      {/* Collapsed Header */}
      <div className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <h4 className="font-bold text-gray-100">{item.name}</h4>
            <div className="text-sm text-gray-400 mt-1 space-y-0.5 font-medium">
              <p>
                {item.sets > 1 ? `${item.sets} sets × ` : ''}
                {item.target}
              </p>
              {item.muscles && item.muscles.length > 0 && (
                <p className="text-gray-500">{item.muscles.join(', ')}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsExpanded(!isExpanded);
                  if (isExpanded) {
                    setShowHistory(false);
                    setShowPerformanceTracker(false);
                  }
                }}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all touch-manipulation whitespace-nowrap
                  ${isExpanded && !showHistory && !showPerformanceTracker
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-400/30 hover:bg-blue-500/20'
                  }
                `}
              >
                <ChevronDown size={16} />
                Info
              </button>
              {session && showPerformanceTracking && (
                <button
                  onClick={() => {
                    setShowHistory(!showHistory);
                    setIsExpanded(false);
                    setShowPerformanceTracker(false);
                  }}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all touch-manipulation whitespace-nowrap
                    ${(showHistory || showPerformanceTracker)
                      ? 'bg-lime-500 text-gray-900'
                      : 'bg-lime-400/10 text-lime-400 border border-lime-400/30 hover:bg-lime-400/20'
                    }
                  `}
                >
                  {(showHistory || showPerformanceTracker) ? <ChevronDown size={16} /> : <Dumbbell size={16} />}
                  Log
                </button>
              )}
            </div>
            {onSwap && (
              <button
                onClick={() => setShowSwapModal(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation bg-orange-500/10 text-orange-400 border border-orange-400/30 hover:bg-orange-500/20"
              >
                <RefreshCw size={12} />
                Swap
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Swap Modal */}
      {onSwap && (
        <ExerciseSwapModal
          isOpen={showSwapModal}
          onClose={() => setShowSwapModal(false)}
          onSelect={onSwap}
          currentExerciseName={item.name}
        />
      )}

      {/* Instructions Section */}
      {isExpanded && !showHistory && !showPerformanceTracker && (
        <div className="border-t border-gray-700 bg-gray-900/50 p-5 space-y-5">
          {/* Instructions */}
          {item.instructions && item.instructions.length > 0 && (
            <div>
              <h5 className="font-bold text-lime-400 mb-3 flex items-center gap-2">
                <div className="h-1 w-6 bg-lime-400 rounded-full"></div>
                INSTRUCTIONS
              </h5>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                {item.instructions.map((instruction: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{instruction}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Image */}
          {item.imageUrl && (
            <div>
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full max-w-md mx-auto rounded-xl shadow-2xl border border-gray-700"
                onError={(e) => {
                  console.error('Image failed to load:', item.imageUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* YouTube Link */}
          <div className="flex justify-center">
            <a
              href={item.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-bold hover:from-red-700 hover:to-red-800 transition-all duration-200 touch-manipulation shadow-lg hover:scale-105 active:scale-95"
            >
              <ExternalLink size={18} />
              WATCH VIDEO
            </a>
          </div>
        </div>
      )}

      {/* Performance History Section */}
      {showHistory && (
        <div className="border-t border-gray-700 bg-gray-900/50 p-5">
          <ExerciseHistory
            exerciseName={item.name}
            onClose={() => setShowHistory(false)}
            onDeleteEntry={handleDeleteEntry}
            onAddNew={() => {
              setShowHistory(false);
              setShowPerformanceTracker(true);
            }}
          />
        </div>
      )}

      {/* New Entry Form */}
      {showPerformanceTracker && (
        <div className="border-t border-gray-700 bg-gray-900/50 p-5">
          <PerformanceTracker
            exerciseName={item.name}
            onSave={handleSavePerformance}
            onClose={() => setShowPerformanceTracker(false)}
          />
        </div>
      )}
    </div>
  );
}
