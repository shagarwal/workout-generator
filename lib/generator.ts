import { WorkoutInputs, WorkoutPlan, WorkoutItem, Exercise, Intensity, MuscleGroup } from './types';
import { exerciseLibrary } from './exercises';

function getYoutubeUrl(url: string): string {
  // Direct URL pass-through since we now store full YouTube URLs
  return url;
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

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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

    // Check if all required equipment is in user's list
    return ex.equipment.every(eq => userEquipment.includes(eq));
  });
}

function getMuscleCategory(muscle: MuscleGroup): 'push' | 'pull' | 'legs' | 'core' {
  // Categorize muscles into push/pull/legs for smart pairing
  const pushMuscles: MuscleGroup[] = ['Chest', 'Shoulders', 'Triceps'];
  const pullMuscles: MuscleGroup[] = ['Back', 'Biceps'];
  const legsMuscles: MuscleGroup[] = ['Legs', 'Glutes'];

  if (pushMuscles.includes(muscle)) return 'push';
  if (pullMuscles.includes(muscle)) return 'pull';
  if (legsMuscles.includes(muscle)) return 'legs';
  return 'core';
}

function selectExercisesForMuscles(
  muscles: MuscleGroup[],
  availableExercises: Exercise[],
  count: number,
  type: 'weights' | 'cardio'
): Exercise[] {
  const selected: Exercise[] = [];
  const usedIds = new Set<string>();

  // Filter by type
  const typeFiltered = availableExercises.filter(ex => ex.type === type);

  // For each muscle group, try to add at least one exercise
  for (const muscle of muscles) {
    const muscleExercises = shuffleArray(
      typeFiltered.filter(ex =>
        ex.muscles.includes(muscle) && !usedIds.has(ex.id)
      )
    );

    if (muscleExercises.length > 0) {
      selected.push(muscleExercises[0]);
      usedIds.add(muscleExercises[0].id);
    }
  }

  // Fill remaining slots with variety from SELECTED muscles only
  const remaining = shuffleArray(
    typeFiltered.filter(ex =>
      !usedIds.has(ex.id) &&
      ex.muscles.some(muscle => muscles.includes(muscle))
    )
  );

  while (selected.length < count && remaining.length > 0) {
    const ex = remaining.pop()!;
    selected.push(ex);
    usedIds.add(ex.id);
  }

  return selected.slice(0, count);
}

function organizeExercisesForCircuits(exercises: Exercise[]): Exercise[] {
  // Group exercises by muscle category
  const byCategory: { [key: string]: Exercise[] } = {
    push: [],
    pull: [],
    legs: [],
    core: []
  };

  exercises.forEach(ex => {
    // Find primary muscle group
    const primaryMuscle = ex.muscles[0];
    const category = getMuscleCategory(primaryMuscle);
    byCategory[category].push(ex);
  });

  // Build circuits alternating between categories for optimal recovery
  // Pattern: Upper Push -> Upper Pull -> Lower -> Core (repeat)
  const organized: Exercise[] = [];
  const maxLength = Math.max(
    byCategory.push.length,
    byCategory.pull.length,
    byCategory.legs.length,
    byCategory.core.length
  );

  for (let i = 0; i < maxLength; i++) {
    if (byCategory.push[i]) organized.push(byCategory.push[i]);
    if (byCategory.pull[i]) organized.push(byCategory.pull[i]);
    if (byCategory.legs[i]) organized.push(byCategory.legs[i]);
    if (byCategory.core[i]) organized.push(byCategory.core[i]);
  }

  return organized;
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

    return {
      name: ex.name,
      sets: setsPerStretch,
      target: target,
      youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
      instructions: ex.instructions,
      imageUrl: ex.imageUrl,
    };
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

  // Select exercises
  const weightExercises = selectExercisesForMuscles(
    selectedMuscles,
    availableExercises,
    weightsExerciseCount,
    'weights'
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
      // Organize exercises for optimal pairing (push/pull/legs alternating)
      const organizedWeights = organizeExercisesForCircuits(weightExercises);

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
            mainItems.push({
              name: ex.name,
              sets: 1,
              target: `${ex.defaultRepRange} reps`,
              restSeconds: circuitRest,
              youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
              instructions: ex.instructions,
              imageUrl: ex.imageUrl,
              circuitId: circuitId,
              circuitRounds: rounds,
            });
          });

          circuitNum++;
        } else if (circuitExercises.length === 1) {
          // Single exercise - add as traditional set instead
          mainItems.push({
            name: circuitExercises[0].name,
            sets: sets,
            target: `${circuitExercises[0].defaultRepRange} reps`,
            restSeconds: restSeconds,
            youtubeUrl: getYoutubeUrl(circuitExercises[0].youtubeQuery),
            instructions: circuitExercises[0].instructions,
            imageUrl: circuitExercises[0].imageUrl,
          });
        }
      }
    }

    // CARDIO CIRCUIT LAST - if there's cardio, make it short intervals
    if (cardioExercises.length > 0) {
      const cardioCircuitId = 'circuit-cardio';
      // Calculate rounds for cardio based on available time
      const timePerCardioExercise = 60 + circuitRest; // 60s work + rest
      const availableCardioSeconds = cardioMinutes * 60;
      const cardioRounds = Math.max(1, Math.floor(availableCardioSeconds / (cardioExercises.length * timePerCardioExercise)));

      cardioExercises.forEach(ex => {
        let cardioTarget = ex.defaultRepRange;
        // Convert long cardio to short intervals for circuits
        if (cardioTarget.includes('min') || cardioTarget.includes('sec')) {
          cardioTarget = '45-60s'; // Short cardio bursts in circuits
        }

        mainItems.push({
          name: ex.name,
          sets: 1,
          target: cardioTarget,
          restSeconds: circuitRest,
          youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
          instructions: ex.instructions,
          imageUrl: ex.imageUrl,
          circuitId: cardioCircuitId,
          circuitRounds: cardioRounds,
        });
      });
    }

  } else if (workoutStyle === 'superset') {
    // SUPERSET: Pair exercises, no rest between pairs
    const supersetRest = intensity === 'brutal' ? 30 : intensity === 'hard' ? 45 : 60;

    // Weights first - mark pairs
    weightExercises.forEach((ex, index) => {
      const isLastInPair = index % 2 === 1;
      mainItems.push({
        name: `${index % 2 === 0 ? '🔗 ' : ''}${ex.name}`,
        sets: sets,
        target: `${ex.defaultRepRange} reps`,
        restSeconds: isLastInPair ? supersetRest : 0, // No rest between pair, rest after
        youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
        instructions: ex.instructions,
        imageUrl: ex.imageUrl,
      });
    });

    // Then cardio
    cardioExercises.forEach(ex => {
      mainItems.push({
        name: ex.name,
        sets: 1,
        target: ex.defaultRepRange,
        restSeconds: 45,
        youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
        instructions: ex.instructions,
        imageUrl: ex.imageUrl,
      });
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

      mainItems.push({
        name: ex.name,
        sets: 1,
        target: specificReps,
        restSeconds: 0,
        youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
        instructions: ex.instructions,
        imageUrl: ex.imageUrl,
        circuitId: 'amrap-round', // Group all exercises as one AMRAP round
        circuitRounds: 0, // 0 means "as many as possible"
      });
    });

  } else {
    // TRADITIONAL: Complete all sets before moving to next exercise
    // WEIGHTS FIRST: Add all weight exercises before cardio
    // Research shows lifting first optimizes strength performance and reduces injury risk
    weightExercises.forEach(ex => {
      mainItems.push({
        name: ex.name,
        sets: sets,
        target: `${ex.defaultRepRange} reps`,
        restSeconds: restSeconds,
        youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
        instructions: ex.instructions,
        imageUrl: ex.imageUrl,
      });
    });

    // CARDIO SECOND: Add cardio after weights for optimal fat burning
    cardioExercises.forEach(ex => {
      mainItems.push({
        name: ex.name,
        sets: 1,
        target: ex.defaultRepRange,
        restSeconds: 60,
        youtubeUrl: getYoutubeUrl(ex.youtubeQuery),
        instructions: ex.instructions,
        imageUrl: ex.imageUrl,
      });
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
