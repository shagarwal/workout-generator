import { WorkoutInputs, WorkoutPlan, WorkoutItem, Exercise, Intensity, MuscleGroup } from './types';
import { exerciseLibrary } from './exercises';

function getYoutubeUrl(url: string): string {
  // Direct URL pass-through since we now store full YouTube URLs
  return url;
}

// Helper to create a WorkoutItem from an Exercise with all metadata
function createWorkoutItem(
  ex: Exercise,
  sets: number,
  target: string,
  restSeconds?: number,
  circuitId?: string,
  circuitRounds?: number
): WorkoutItem {
  return {
    name: ex.name,
    sets,
    target,
    restSeconds,
    youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
    instructions: ex.instructions,
    imageUrl: ex.imageUrl,
    muscles: ex.muscles,
    exerciseId: ex.id,
    exerciseType: ex.type,
    circuitId,
    circuitRounds,
  };
}

function getRestTime(intensity: Intensity): number {
  switch (intensity) {
    case 'easy':
      return 90;
    case 'moderate':
      return 60;
    case 'hard':
      return 45;
    case 'brutal':
      return 30;
  }
}

function getSetsForIntensity(intensity: Intensity): number {
  switch (intensity) {
    case 'easy':
      return 2;
    case 'moderate':
      return 3;
    case 'hard':
      return 4;
    case 'brutal':
      return 5;
  }
}

// Determines if a cardio exercise is long-duration (5+ min) based on its defaultRepRange
// Long-duration: "10-20 min", "5-15 min", "15-30 min" → 1 set is fine
// Short-duration: "30s", "30-60s", "10-15" (reps), "2-5 min" → needs multiple sets
function isLongDurationCardio(defaultRepRange: string): boolean {
  if (!defaultRepRange.includes('min')) return false;
  // Extract the first number from ranges like "10-20 min" or "5-15 min"
  const match = defaultRepRange.match(/(\d+)/);
  if (!match) return false;
  return parseInt(match[1]) >= 5;
}

function getCardioSets(ex: Exercise, intensity: Intensity): { sets: number; target: string; rest: number } {
  if (isLongDurationCardio(ex.defaultRepRange)) {
    // Long cardio (treadmill, bike, elliptical, etc.) - 1 set of the full duration
    return { sets: 1, target: ex.defaultRepRange, rest: 60 };
  }
  // Short cardio (mountain climbers, bear crawl, burpees, etc.) - multiple sets
  const sets = intensity === 'easy' ? 3 : intensity === 'moderate' ? 3 : intensity === 'hard' ? 4 : 4;
  const rest = intensity === 'easy' ? 60 : intensity === 'moderate' ? 45 : intensity === 'hard' ? 30 : 20;
  // For rep-based exercises, append "reps" if not already a time unit
  const target = (ex.defaultRepRange.includes('s') || ex.defaultRepRange.includes('min'))
    ? ex.defaultRepRange
    : `${ex.defaultRepRange} reps`;
  return { sets, target, rest };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Exercises that can be performed on a Smith machine (vertical/fixed-path movements only).
// Exercises requiring lateral movement, arcing motions, or free bar paths are excluded.
const SMITH_MACHINE_COMPATIBLE: Set<string> = new Set([
  // Chest (pressing movements)
  'barbell-bench-press',
  'incline-barbell-bench',
  'decline-barbell-bench',
  'close-grip-bench',
  // Shoulders (vertical pressing/pulling)
  'overhead-press',
  'seated-barbell-press',
  'barbell-upright-row',
  // Legs/Glutes (squat and hinge patterns)
  'barbell-squat',
  'front-squat',
  'romanian-deadlift',
  'deadlift',
  'sumo-deadlift',
  'hip-thrust',
  'legs-barbell-box-squat',
  'legs-barbell-good-mornings',
  // Back (vertical pull)
  'back-rack-pulls',
  'back-inverted-row',
]);

function filterExercisesByEquipment(exercises: Exercise[], userEquipment: string[]): Exercise[] {
  // If user selected "Bodyweight" only, only return bodyweight exercises
  if (userEquipment.includes('Bodyweight') && userEquipment.length === 1) {
    return exercises.filter(ex =>
      ex.equipment.length === 0 ||
      (ex.equipment.length === 1 && ex.equipment[0] === 'Bodyweight')
    );
  }

  // Otherwise, return exercises where ALL required equipment is available
  return exercises.filter(ex => {
    if (ex.equipment.length === 0) return true; // No equipment needed
    if (ex.equipment.includes('Bodyweight')) return true; // Bodyweight is always available

    // Smith machine can substitute for Barbell in compatible exercises only.
    // Not all barbell exercises work on a Smith machine — exercises requiring
    // lateral movement, arcing motions, or free bar paths (e.g. skull crushers,
    // curls, landmine press, power cleans) cannot be done on a Smith machine.
    const hasSmithMachine = userEquipment.includes('Smith machine');
    const needsBarbell = ex.equipment.includes('Barbell');

    if (hasSmithMachine && needsBarbell && SMITH_MACHINE_COMPATIBLE.has(ex.id)) {
      // Check if all OTHER equipment (besides barbell) is available or substituted
      const otherEquipment = ex.equipment.filter(eq => eq !== 'Barbell');
      return otherEquipment.every(eq => userEquipment.includes(eq));
    }

    // Check if all required equipment is in user's list
    return ex.equipment.every(eq => userEquipment.includes(eq));
  });
}

// Opposing muscle groups placed adjacent for optimal superset pairing
// and circuit alternation. Round-robin through this order ensures
// consecutive exercises target different muscles.
const MUSCLE_INTERLEAVE_ORDER: MuscleGroup[] = [
  'Chest', 'Back', 'Biceps', 'Triceps', 'Shoulders', 'Legs', 'Glutes', 'Core', 'Full Body'
];

function selectExercisesForMuscles(
  muscles: MuscleGroup[],
  availableExercises: Exercise[],
  count: number,
  type: 'weights' | 'cardio',
  userEquipment: string[] = []
): Exercise[] {
  const selected: Exercise[] = [];
  const usedIds = new Set<string>();

  // Filter by type
  const typeFiltered = availableExercises.filter(ex => ex.type === type);

  // Separate exercises into equipment-specific and bodyweight-only
  // Prioritize exercises that use equipment the user explicitly selected
  const hasNonBodyweightEquipment = userEquipment.some(eq => eq !== 'Bodyweight');

  const prioritizeEquipmentExercises = (exercises: Exercise[]): Exercise[] => {
    if (!hasNonBodyweightEquipment) {
      return shuffleArray(exercises);
    }

    // Split into equipment-requiring and bodyweight-only exercises
    const equipmentExercises = exercises.filter(ex =>
      ex.equipment.length > 0 &&
      !ex.equipment.every(eq => eq === 'Bodyweight')
    );
    const bodyweightExercises = exercises.filter(ex =>
      ex.equipment.length === 0 ||
      ex.equipment.every(eq => eq === 'Bodyweight')
    );

    // Shuffle each group and put equipment exercises first
    return [...shuffleArray(equipmentExercises), ...shuffleArray(bodyweightExercises)];
  };

  // PHASE 0: For each muscle group, pick ONE anchor exercise if available.
  // Anchors are shuffled so different anchors appear across regenerations.
  for (const muscle of muscles) {
    if (selected.length >= count) break;

    const anchorExercises = prioritizeEquipmentExercises(
      typeFiltered.filter(ex =>
        ex.anchor && ex.muscles.includes(muscle) && !usedIds.has(ex.id)
      )
    );

    if (anchorExercises.length > 0) {
      selected.push(anchorExercises[0]);
      usedIds.add(anchorExercises[0].id);
    } else {
      // No anchors available for this muscle — pick any exercise as fallback
      const fallback = prioritizeEquipmentExercises(
        typeFiltered.filter(ex =>
          ex.muscles.includes(muscle) && !usedIds.has(ex.id)
        )
      );
      if (fallback.length > 0) {
        selected.push(fallback[0]);
        usedIds.add(fallback[0].id);
      }
    }
  }

  // PHASE 1: Fill additional slots with remaining anchor exercises for selected muscles.
  // This adds more core exercises before falling back to random variety.
  if (selected.length < count) {
    const remainingAnchors = prioritizeEquipmentExercises(
      typeFiltered.filter(ex =>
        ex.anchor &&
        !usedIds.has(ex.id) &&
        ex.muscles.some(muscle => muscles.includes(muscle))
      )
    );

    for (const ex of remainingAnchors) {
      if (selected.length >= count) break;
      selected.push(ex);
      usedIds.add(ex.id);
    }
  }

  // PHASE 2: Fill remaining slots with any exercises for selected muscles.
  if (selected.length < count) {
    const remaining = prioritizeEquipmentExercises(
      typeFiltered.filter(ex =>
        !usedIds.has(ex.id) &&
        ex.muscles.some(muscle => muscles.includes(muscle))
      )
    );

    for (const ex of remaining) {
      if (selected.length >= count) break;
      selected.push(ex);
      usedIds.add(ex.id);
    }
  }

  return selected.slice(0, count);
}

function interleaveByMuscleGroup(exercises: Exercise[]): Exercise[] {
  // Group exercises by their primary muscle group
  const byMuscle: Map<string, Exercise[]> = new Map();

  exercises.forEach(ex => {
    const primaryMuscle = ex.muscles[0];
    if (!byMuscle.has(primaryMuscle)) {
      byMuscle.set(primaryMuscle, []);
    }
    byMuscle.get(primaryMuscle)!.push(ex);
  });

  // Order muscle groups so opposing muscles are adjacent.
  // This ensures superset pairs hit different muscles (Chest+Back, Biceps+Triceps)
  // and circuit exercises alternate to give each muscle recovery time.
  const orderedMuscles = MUSCLE_INTERLEAVE_ORDER.filter(m => byMuscle.has(m));

  // Round-robin through muscle groups
  const result: Exercise[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const muscle of orderedMuscles) {
      const group = byMuscle.get(muscle);
      if (group && group.length > 0) {
        result.push(group.shift()!);
        added = true;
      }
    }
  }

  return result;
}

function generateWarmup(availableExercises: Exercise[], durationMinutes: number): WorkoutItem[] {
  const warmupExercises = availableExercises.filter(ex => ex.type === 'mobility');
  const shuffled = shuffleArray(warmupExercises);

  const count = durationMinutes <= 4 ? 3 : 5;
  const selected = shuffled.slice(0, count);

  return selected.map(ex => ({
    name: ex.name,
    sets: 1,
    target: ex.defaultRepRange,
    youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
    instructions: ex.instructions,
    imageUrl: ex.imageUrl,
  }));
}

function generateCooldown(availableExercises: Exercise[], durationMinutes: number): WorkoutItem[] {
  const cooldownExercises = availableExercises.filter(ex =>
    ex.type === 'mobility' &&
    (ex.defaultRepRange.includes('s') || ex.name.toLowerCase().includes('stretch'))
  );
  const shuffled = shuffleArray(cooldownExercises);

  const count = durationMinutes <= 3 ? 2 : 4;
  const selected = shuffled.slice(0, count);

  return selected.map(ex => ({
    name: ex.name,
    sets: 1,
    target: ex.defaultRepRange,
    youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
    instructions: ex.instructions,
    imageUrl: ex.imageUrl,
  }));
}

function generateMuscleStretchSession(
  selectedMuscles: MuscleGroup[],
  availableExercises: Exercise[],
  durationMinutes: number
): WorkoutItem[] {
  if (durationMinutes === 0) {
    return [];
  }

  // Filter for stretches that match the selected muscles
  const relevantStretches = availableExercises.filter(ex => {
    if (ex.type !== 'mobility') return false;
    if (!ex.name.toLowerCase().includes('stretch') && !ex.defaultRepRange.includes('s')) return false;

    // Check if exercise targets any of the selected muscles
    return ex.muscles.some(muscle => selectedMuscles.includes(muscle));
  });

  // Calculate timing: average stretch hold is 30 seconds per side
  // Account for transitions (5s between stretches)
  const secondsPerStretch = 35; // 30s hold + 5s transition
  const availableSeconds = durationMinutes * 60;

  // Determine base number of unique stretches (variety)
  let uniqueStretchCount: number;
  if (durationMinutes <= 5) {
    uniqueStretchCount = Math.min(5, relevantStretches.length);
  } else if (durationMinutes <= 10) {
    uniqueStretchCount = Math.min(6, relevantStretches.length);
  } else if (durationMinutes <= 15) {
    uniqueStretchCount = Math.min(8, relevantStretches.length);
  } else if (durationMinutes <= 20) {
    uniqueStretchCount = Math.min(10, relevantStretches.length);
  } else {
    uniqueStretchCount = Math.min(12, relevantStretches.length);
  }

  // Ensure we have at least one stretch per muscle group
  const stretchesByMuscle: { [key: string]: Exercise[] } = {};
  selectedMuscles.forEach(muscle => {
    stretchesByMuscle[muscle] = relevantStretches.filter(ex =>
      ex.muscles.includes(muscle)
    );
  });

  const selected: Exercise[] = [];
  const usedIds = new Set<string>();

  // First, add at least one stretch per muscle group
  selectedMuscles.forEach(muscle => {
    const muscleStretches = shuffleArray(stretchesByMuscle[muscle]);
    const unused = muscleStretches.find(ex => !usedIds.has(ex.id));
    if (unused) {
      selected.push(unused);
      usedIds.add(unused.id);
    }
  });

  // Fill remaining slots with variety
  const remaining = shuffleArray(
    relevantStretches.filter(ex => !usedIds.has(ex.id))
  );

  while (selected.length < uniqueStretchCount && remaining.length > 0) {
    const ex = remaining.pop()!;
    selected.push(ex);
    usedIds.add(ex.id);
  }

  // Now calculate how many sets/rounds we need to fill the time
  const totalSlotsNeeded = Math.floor(availableSeconds / secondsPerStretch);
  const setsPerStretch = Math.max(1, Math.floor(totalSlotsNeeded / selected.length));

  // Create workout items with appropriate sets
  return selected.map(ex => {
    // Parse the default rep range to adjust hold time if needed
    let holdTime = '30s each side';
    if (ex.defaultRepRange.includes('s')) {
      holdTime = ex.defaultRepRange;
    }

    // If we need multiple sets, indicate rounds
    const target = setsPerStretch > 1
      ? `${holdTime} (${setsPerStretch} rounds)`
      : holdTime;

    return createWorkoutItem(ex, setsPerStretch, target);
  });
}

export function generateWorkoutPlan(inputs: WorkoutInputs): WorkoutPlan {
  const { selectedMuscles, equipment, intensity, cardioWeightSplit, durationMinutes, workoutStyle, stretchingMinutes, stretchingOnly } = inputs;

  // If stretching-only mode, generate a pure stretching session
  if (stretchingOnly) {
    const availableExercises = filterExercisesByEquipment(exerciseLibrary, equipment);
    const stretchingItems = generateMuscleStretchSession(selectedMuscles, availableExercises, durationMinutes);

    return {
      summary: {
        title: `${durationMinutes}-minute Stretching Session`,
        muscles: selectedMuscles.join(', '),
        equipment: 'Bodyweight',
        intensity: 'Easy',
        cardioPercent: 0,
        weightsPercent: 0,
        workoutStyle: 'traditional',
        stretchingMinutes: durationMinutes,
        stretchingOnly: true,
      },
      sections: {
        stretching: {
          title: `Stretching (${durationMinutes} min)`,
          items: stretchingItems,
        },
        main: {
          title: 'Main Workout (0 min)',
          items: [],
        },
      },
    };
  }

  // Calculate time allocation - no cooldown, just stretching (warmup) and main workout
  const mainMinutes = durationMinutes - stretchingMinutes;

  const cardioPercent = cardioWeightSplit;
  const weightsPercent = 100 - cardioWeightSplit;

  const cardioMinutes = Math.floor(mainMinutes * (cardioPercent / 100));
  const weightsMinutes = mainMinutes - cardioMinutes;

  // Filter exercises by equipment
  const availableExercises = filterExercisesByEquipment(exerciseLibrary, equipment);

  // Determine exercise counts based on duration
  let totalMainExercises: number;
  if (durationMinutes <= 20) {
    totalMainExercises = 5;
  } else if (durationMinutes <= 45) {
    totalMainExercises = 8;
  } else if (durationMinutes <= 75) {
    totalMainExercises = 10;
  } else {
    totalMainExercises = 14;
  }

  // Split exercises between cardio and weights
  const cardioExerciseCount = Math.floor(totalMainExercises * (cardioPercent / 100));
  const weightsExerciseCount = totalMainExercises - cardioExerciseCount;

  // Select exercises - pass equipment to prioritize equipment-specific exercises
  const weightExercises = selectExercisesForMuscles(
    selectedMuscles,
    availableExercises,
    weightsExerciseCount,
    'weights',
    equipment
  );

  const cardioExercises = shuffleArray(
    availableExercises.filter(ex => ex.type === 'cardio')
  ).slice(0, cardioExerciseCount);

  // Generate stretching (pre-workout warmup)
  const stretchingItems = generateMuscleStretchSession(selectedMuscles, availableExercises, stretchingMinutes);

  // Create main workout items based on workout style
  const sets = getSetsForIntensity(intensity);
  const restSeconds = getRestTime(intensity);

  const mainItems: WorkoutItem[] = [];

  // Apply workout style-specific logic
  if (workoutStyle === 'circuit') {
    // CIRCUIT: Create weight circuits, then cardio circuit separately
    const circuitRest = intensity === 'brutal' ? 15 : intensity === 'hard' ? 20 : 30;

    // Calculate time per exercise (assuming ~40 seconds per set + rest)
    const timePerExercise = 40 + circuitRest; // seconds

    // WEIGHT CIRCUITS FIRST - keep weights together
    if (weightExercises.length > 0) {
      // Interleave exercises by muscle group so consecutive exercises target different muscles
      const organizedWeights = interleaveByMuscleGroup(weightExercises);

      // Determine circuit size (2-5 exercises per circuit)
      let circuitSize: number;
      if (organizedWeights.length === 1) {
        // Skip circuit format if only 1 exercise - use traditional instead
        circuitSize = 1;
      } else if (organizedWeights.length <= 4) {
        // Small workout: use all as one circuit
        circuitSize = organizedWeights.length;
      } else {
        // Calculate optimal circuit size based on total exercises
        // Aim for circuits of 3-4 exercises
        const numCircuits = Math.ceil(organizedWeights.length / 4);
        circuitSize = Math.ceil(organizedWeights.length / numCircuits);
        // Clamp to 2-5 range
        circuitSize = Math.max(2, Math.min(5, circuitSize));
      }

      // Calculate how many rounds we can fit in the available weight time
      const numCircuits = Math.ceil(organizedWeights.length / circuitSize);
      const timePerWeightCircuit = circuitSize * timePerExercise; // seconds per round
      const availableWeightSeconds = weightsMinutes * 60;
      const maxRoundsPerCircuit = Math.max(2, Math.floor(availableWeightSeconds / (numCircuits * timePerWeightCircuit)));
      const rounds = Math.min(4, maxRoundsPerCircuit); // Cap at 4 rounds max

      let circuitNum = 1;
      for (let i = 0; i < organizedWeights.length; i += circuitSize) {
        const circuitExercises = organizedWeights.slice(i, i + circuitSize);

        // Only create circuit if we have at least 2 exercises
        if (circuitExercises.length >= 2) {
          const circuitId = `circuit-${circuitNum}`;

          circuitExercises.forEach(ex => {
            mainItems.push(createWorkoutItem(
              ex,
              1,
              `${ex.defaultRepRange} reps`,
              circuitRest,
              circuitId,
              rounds
            ));
          });

          circuitNum++;
        } else if (circuitExercises.length === 1) {
          // Single exercise - add as traditional set instead
          mainItems.push(createWorkoutItem(
            circuitExercises[0],
            sets,
            `${circuitExercises[0].defaultRepRange} reps`,
            restSeconds
          ));
        }
      }
    }

    // CARDIO SEPARATE - if there's cardio, add it AFTER circuits as traditional cardio
    // In circuits, we want minimal equipment changes, so cardio machines don't fit well
    // Instead, add cardio as a traditional finisher after the weight circuits
    if (cardioExercises.length > 0) {
      cardioExercises.forEach(ex => {
        const cardio = getCardioSets(ex, intensity);
        mainItems.push(createWorkoutItem(ex, cardio.sets, cardio.target, cardio.rest));
      });
    }

  } else if (workoutStyle === 'superset') {
    // SUPERSET: Pair exercises, no rest between pairs
    const supersetRest = intensity === 'brutal' ? 30 : intensity === 'hard' ? 45 : 60;

    // Interleave by muscle group so superset pairs target different muscles
    // e.g., Biceps+Triceps, Chest+Back rather than Bicep+Bicep
    const interleavedWeights = interleaveByMuscleGroup(weightExercises);

    // Weights first - group into superset pairs
    interleavedWeights.forEach((ex, index) => {
      const isLastInPair = index % 2 === 1;
      const supersetId = `superset-${Math.floor(index / 2) + 1}`;
      const item = createWorkoutItem(
        ex,
        sets,
        `${ex.defaultRepRange} reps`,
        isLastInPair ? supersetRest : 0
      );
      item.supersetId = supersetId;
      mainItems.push(item);
    });

    // Then cardio (no supersetId - rendered individually)
    cardioExercises.forEach(ex => {
      const cardio = getCardioSets(ex, intensity);
      mainItems.push(createWorkoutItem(ex, cardio.sets, cardio.target, cardio.rest));
    });

  } else if (workoutStyle === 'amrap') {
    // AMRAP: As Many Rounds As Possible - specific rep counts, no rest
    const allExercises = [...weightExercises, ...cardioExercises];

    allExercises.forEach(ex => {
      // Convert rep range to specific rep count for AMRAP
      let specificReps = ex.defaultRepRange;
      if (ex.defaultRepRange.includes('-')) {
        // Take the middle value of the range
        const parts = ex.defaultRepRange.split('-');
        const low = parseInt(parts[0]);
        const high = parseInt(parts[1]);
        specificReps = `${Math.round((low + high) / 2)} reps`;
      }

      mainItems.push(createWorkoutItem(
        ex,
        1,
        specificReps,
        0,
        'amrap-round',
        0
      ));
    });

  } else {
    // TRADITIONAL: Complete all sets before moving to next exercise
    // WEIGHTS FIRST: Add all weight exercises before cardio
    // Research shows lifting first optimizes strength performance and reduces injury risk
    weightExercises.forEach(ex => {
      mainItems.push(createWorkoutItem(
        ex,
        sets,
        `${ex.defaultRepRange} reps`,
        restSeconds
      ));
    });

    // CARDIO SECOND: Add cardio after weights for optimal fat burning
    cardioExercises.forEach(ex => {
      const cardio = getCardioSets(ex, intensity);
      mainItems.push(createWorkoutItem(ex, cardio.sets, cardio.target, cardio.rest));
    });
  }

  // Don't shuffle - maintain weights-first order for optimal performance

  return {
    summary: {
      title: `Your ${durationMinutes}-minute workout`,
      muscles: selectedMuscles.join(', '),
      equipment: equipment.join(', '),
      intensity: intensity.charAt(0).toUpperCase() + intensity.slice(1),
      cardioPercent,
      weightsPercent,
      workoutStyle,
      stretchingMinutes,
      stretchingOnly: false,
    },
    sections: {
      stretching: {
        title: `Stretching (${stretchingMinutes} min)`,
        items: stretchingItems,
      },
      main: {
        title: `Main Workout (${mainMinutes} min)`,
        items: mainItems,
      },
    },
  };
}
