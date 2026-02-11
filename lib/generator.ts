import { WorkoutInputs, WorkoutPlan, WorkoutItem, Exercise, Intensity, MuscleGroup, FitnessLevel, WorkoutStyle } from './types';
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

// Time-based cardio set calculation. Returns sets derived from allocated time.
function getCardioTimeBudget(
  ex: Exercise,
  intensity: Intensity,
  availableCardioSeconds: number,
  cardioExerciseCount: number
): { sets: number; target: string; rest: number; secondsConsumed: number } {
  if (isLongDurationCardio(ex.defaultRepRange)) {
    // Long cardio (treadmill, bike, elliptical): 1 set of full duration
    const match = ex.defaultRepRange.match(/(\d+)/);
    const minDuration = match ? parseInt(match[1]) : 10;
    return { sets: 1, target: ex.defaultRepRange, rest: 60, secondsConsumed: minDuration * 60 };
  }

  // Short cardio: calculate sets from allocated time
  const rest = intensity === 'easy' ? 60 : intensity === 'moderate' ? 45 : intensity === 'hard' ? 30 : 20;
  const secondsPerCardioSet = SECONDS_PER_SET + rest;
  const perExerciseSeconds = Math.floor(availableCardioSeconds / Math.max(1, cardioExerciseCount));
  const sets = Math.max(MIN_SETS_PER_EXERCISE, Math.floor(perExerciseSeconds / secondsPerCardioSet));

  const target = (ex.defaultRepRange.includes('s') || ex.defaultRepRange.includes('min'))
    ? ex.defaultRepRange
    : `${ex.defaultRepRange} reps`;

  return { sets, target, rest, secondsConsumed: sets * secondsPerCardioSet };
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

// Time-based set calculation constants
const SECONDS_PER_SET = 45;
const MIN_SETS_PER_EXERCISE = 2;
const MIN_EXERCISES = 4;
const MAX_EXERCISES = 12;

// Soft-target difficulty mix: what fraction of non-anchor exercise slots
// should target each difficulty level per intensity setting.
const DIFFICULTY_MIX: Record<Intensity, Record<FitnessLevel, number>> = {
  easy:     { beginner: 0.70, intermediate: 0.25, advanced: 0.05 },
  moderate: { beginner: 0.35, intermediate: 0.50, advanced: 0.15 },
  hard:     { beginner: 0.15, intermediate: 0.40, advanced: 0.45 },
  brutal:   { beginner: 0.05, intermediate: 0.30, advanced: 0.65 },
};

interface TimeBudget {
  totalSets: number;
  exerciseCount: number;
  circuitRounds?: number;
  circuitSize?: number;
  supersetRounds?: number;
  amrapRounds?: number;
}

function calculateTimeBudget(
  availableSeconds: number,
  restSeconds: number,
  workoutStyle: WorkoutStyle,
  intensity: Intensity
): TimeBudget {
  if (availableSeconds <= 0) {
    return { totalSets: 0, exerciseCount: 0 };
  }

  if (workoutStyle === 'traditional') {
    const secondsPerSet = SECONDS_PER_SET + restSeconds;
    const totalSets = Math.floor(availableSeconds / secondsPerSet);
    const maxExercises = Math.floor(totalSets / MIN_SETS_PER_EXERCISE);
    const exerciseCount = Math.max(
      Math.min(MIN_EXERCISES, maxExercises),
      Math.min(MAX_EXERCISES, Math.round(totalSets / 3))
    );
    return { totalSets, exerciseCount };
  }

  if (workoutStyle === 'superset') {
    const supersetRest = intensity === 'brutal' ? 30 : intensity === 'hard' ? 45 : 60;
    // One round of a superset pair = 2 exercises + rest after pair
    const secondsPerPairRound = 2 * SECONDS_PER_SET + supersetRest;
    const totalPairRounds = Math.floor(availableSeconds / secondsPerPairRound);
    const totalSets = totalPairRounds * 2;
    // Determine number of pairs, targeting ~3 rounds per pair
    const numPairs = Math.max(2, Math.min(
      Math.floor(MAX_EXERCISES / 2),
      Math.round(totalPairRounds / 3)
    ));
    const exerciseCount = Math.max(MIN_EXERCISES, Math.min(MAX_EXERCISES, numPairs * 2));
    const actualPairs = Math.floor(exerciseCount / 2);
    const supersetRounds = Math.max(MIN_SETS_PER_EXERCISE, Math.floor(totalPairRounds / actualPairs));
    return { totalSets, exerciseCount, supersetRounds };
  }

  if (workoutStyle === 'circuit') {
    const circuitRest = intensity === 'brutal' ? 15 : intensity === 'hard' ? 20 : 30;
    const secondsPerExercise = SECONDS_PER_SET + circuitRest;
    // Target circuit size of 3-5 exercises
    const circuitSize = intensity === 'brutal' || intensity === 'hard' ? 4 : 3;
    // Estimate exercises: aim for ~3 rounds worth of work
    const prelimExerciseCount = Math.max(MIN_EXERCISES, Math.min(MAX_EXERCISES,
      Math.round(availableSeconds / (secondsPerExercise * 3))
    ));
    const numCircuits = Math.max(1, Math.ceil(prelimExerciseCount / circuitSize));
    const exerciseCount = Math.max(MIN_EXERCISES, Math.min(MAX_EXERCISES, numCircuits * circuitSize));
    const secondsPerRound = circuitSize * secondsPerExercise;
    const rounds = Math.max(2, Math.min(5,
      Math.floor(availableSeconds / (numCircuits * secondsPerRound))
    ));
    const totalSets = exerciseCount * rounds;
    return { totalSets, exerciseCount, circuitRounds: rounds, circuitSize };
  }

  if (workoutStyle === 'amrap') {
    // Target 5-8 exercises for AMRAP
    const exerciseCount = Math.max(MIN_EXERCISES, Math.min(8,
      Math.round(availableSeconds / (SECONDS_PER_SET * 5))
    ));
    const secondsPerRound = exerciseCount * SECONDS_PER_SET;
    const amrapRounds = Math.max(1, Math.floor(availableSeconds / secondsPerRound));
    const totalSets = exerciseCount * amrapRounds;
    return { totalSets, exerciseCount, amrapRounds };
  }

  // Fallback
  const secondsPerSet = SECONDS_PER_SET + restSeconds;
  const totalSets = Math.floor(availableSeconds / secondsPerSet);
  const exerciseCount = Math.max(MIN_EXERCISES, Math.min(MAX_EXERCISES, Math.round(totalSets / 3)));
  return { totalSets, exerciseCount };
}

function selectExercisesForMuscles(
  muscles: MuscleGroup[],
  availableExercises: Exercise[],
  count: number,
  type: 'weights' | 'cardio',
  userEquipment: string[] = [],
  intensity: Intensity = 'moderate'
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

  // PHASE 2: Difficulty-weighted fill for remaining slots.
  // Uses DIFFICULTY_MIX to target the right proportion of beginner/intermediate/advanced
  // exercises based on the selected intensity. Soft targets: falls back if a pool is empty.
  if (selected.length < count) {
    const slotsRemaining = count - selected.length;
    const mix = DIFFICULTY_MIX[intensity];

    // Calculate target counts per difficulty
    const targetCounts: Record<FitnessLevel, number> = {
      beginner: Math.round(slotsRemaining * mix.beginner),
      intermediate: Math.round(slotsRemaining * mix.intermediate),
      advanced: Math.round(slotsRemaining * mix.advanced),
    };

    // Fix rounding errors so sum == slotsRemaining
    const sum = targetCounts.beginner + targetCounts.intermediate + targetCounts.advanced;
    if (sum !== slotsRemaining) {
      const levels: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];
      const sorted = levels.sort((a, b) => mix[b] - mix[a]);
      targetCounts[sorted[0]] += slotsRemaining - sum;
    }

    // Build candidate pools per difficulty
    const muscleFilter = (ex: Exercise) =>
      !usedIds.has(ex.id) && ex.muscles.some(muscle => muscles.includes(muscle));

    const pools: Record<FitnessLevel, Exercise[]> = {
      beginner: prioritizeEquipmentExercises(typeFiltered.filter(ex => ex.difficulty === 'beginner' && muscleFilter(ex))),
      intermediate: prioritizeEquipmentExercises(typeFiltered.filter(ex => ex.difficulty === 'intermediate' && muscleFilter(ex))),
      advanced: prioritizeEquipmentExercises(typeFiltered.filter(ex => ex.difficulty === 'advanced' && muscleFilter(ex))),
    };

    // Fill scarcest pools first (advanced has fewest exercises globally)
    const fillOrder: FitnessLevel[] = ['advanced', 'intermediate', 'beginner'];
    for (const diff of fillOrder) {
      let needed = targetCounts[diff];
      const pool = pools[diff];
      let idx = 0;
      while (needed > 0 && idx < pool.length) {
        if (!usedIds.has(pool[idx].id)) {
          selected.push(pool[idx]);
          usedIds.add(pool[idx].id);
          needed--;
        }
        idx++;
      }
      targetCounts[diff] = needed; // track unfilled
    }

    // Soft fallback: fill any remaining from any difficulty
    if (selected.length < count) {
      const fallbackPool = prioritizeEquipmentExercises(
        typeFiltered.filter(muscleFilter)
      );
      for (const ex of fallbackPool) {
        if (selected.length >= count) break;
        if (!usedIds.has(ex.id)) {
          selected.push(ex);
          usedIds.add(ex.id);
        }
      }
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

// Distributes a total set budget across exercises evenly.
// Max difference between any two exercises is 1 set ("card dealing").
// The +1 bonus sets go to beginner exercises first, then intermediate, then advanced —
// so easier exercises get slightly more volume while keeping the workout feeling consistent.
function distributeSets(exercises: Exercise[], totalSetBudget: number): Map<string, number> {
  if (exercises.length === 0) return new Map();

  const n = exercises.length;
  const baseSets = Math.max(MIN_SETS_PER_EXERCISE, Math.floor(totalSetBudget / n));
  const remainder = Math.max(0, totalSetBudget - baseSets * n);

  // Sort by difficulty so bonus sets go to beginner first, then intermediate, then advanced
  const indexed = exercises.map((ex, i) => ({ ex, originalIndex: i }));
  const prioritized = [
    ...indexed.filter(e => e.ex.difficulty === 'beginner'),
    ...indexed.filter(e => e.ex.difficulty === 'intermediate'),
    ...indexed.filter(e => e.ex.difficulty === 'advanced'),
  ];

  // Deal out: first `remainder` exercises (by priority) get baseSets+1, rest get baseSets
  const setsArray = new Array(n).fill(baseSets);
  for (let i = 0; i < remainder && i < prioritized.length; i++) {
    setsArray[prioritized[i].originalIndex] = baseSets + 1;
  }

  const result = new Map<string, number>();
  exercises.forEach((ex, i) => {
    result.set(ex.id, setsArray[i]);
  });
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

  // Time-based budget: derive exercise count and total sets from available seconds
  const restSeconds = getRestTime(intensity);
  const weightsSeconds = weightsMinutes * 60;
  const cardioSeconds = cardioMinutes * 60;

  const weightsBudget = calculateTimeBudget(weightsSeconds, restSeconds, workoutStyle, intensity);
  const weightsExerciseCount = weightsBudget.exerciseCount;

  // Cardio exercise count: proportional to weights, capped at 4
  const cardioExerciseCount = cardioPercent > 0 && weightsPercent > 0
    ? Math.max(1, Math.min(4, Math.round(weightsExerciseCount * (cardioPercent / weightsPercent))))
    : cardioPercent > 0
      ? Math.max(1, Math.min(4, Math.round(cardioSeconds / (SECONDS_PER_SET * 3 + restSeconds * 3))))
      : 0;

  // Select exercises with difficulty-weighted selection
  const weightExercises = selectExercisesForMuscles(
    selectedMuscles,
    availableExercises,
    weightsExerciseCount,
    'weights',
    equipment,
    intensity
  );

  const cardioExercises = shuffleArray(
    availableExercises.filter(ex => ex.type === 'cardio')
  ).slice(0, cardioExerciseCount);

  // Generate stretching (pre-workout warmup)
  const stretchingItems = generateMuscleStretchSession(selectedMuscles, availableExercises, stretchingMinutes);

  // Distribute weight sets across exercises with difficulty scaling
  const setsMap = distributeSets(weightExercises, weightsBudget.totalSets);

  const mainItems: WorkoutItem[] = [];

  // Apply workout style-specific logic
  if (workoutStyle === 'circuit') {
    const circuitRest = intensity === 'brutal' ? 15 : intensity === 'hard' ? 20 : 30;
    const circuitSize = weightsBudget.circuitSize ?? 4;
    const rounds = weightsBudget.circuitRounds ?? 3;

    if (weightExercises.length > 0) {
      const organizedWeights = interleaveByMuscleGroup(weightExercises);

      // Determine actual circuit size based on exercise count
      let actualCircuitSize: number;
      if (organizedWeights.length === 1) {
        actualCircuitSize = 1;
      } else if (organizedWeights.length <= circuitSize) {
        actualCircuitSize = organizedWeights.length;
      } else {
        actualCircuitSize = circuitSize;
      }

      let circuitNum = 1;
      for (let i = 0; i < organizedWeights.length; i += actualCircuitSize) {
        const circuitExercises = organizedWeights.slice(i, i + actualCircuitSize);

        if (circuitExercises.length >= 2) {
          const circuitId = `circuit-${circuitNum}`;
          circuitExercises.forEach(ex => {
            mainItems.push(createWorkoutItem(
              ex, 1, `${ex.defaultRepRange} reps`, circuitRest, circuitId, rounds
            ));
          });
          circuitNum++;
        } else if (circuitExercises.length === 1) {
          // Single leftover: use traditional with distributed sets
          const exerciseSets = setsMap.get(circuitExercises[0].id) ?? MIN_SETS_PER_EXERCISE;
          mainItems.push(createWorkoutItem(
            circuitExercises[0], exerciseSets,
            `${circuitExercises[0].defaultRepRange} reps`, restSeconds
          ));
        }
      }
    }

    // Cardio finisher after circuits
    if (cardioExercises.length > 0) {
      let remainingCardioSeconds = cardioSeconds;
      cardioExercises.forEach(ex => {
        const cardio = getCardioTimeBudget(ex, intensity, remainingCardioSeconds, cardioExercises.length);
        mainItems.push(createWorkoutItem(ex, cardio.sets, cardio.target, cardio.rest));
        remainingCardioSeconds -= cardio.secondsConsumed;
      });
    }

  } else if (workoutStyle === 'superset') {
    const supersetRest = intensity === 'brutal' ? 30 : intensity === 'hard' ? 45 : 60;
    const supersetRounds = weightsBudget.supersetRounds ?? 3;

    // Interleave by muscle group for opposing-muscle pairs
    const interleavedWeights = interleaveByMuscleGroup(weightExercises);

    // Both exercises in a superset pair must have the same number of sets
    interleavedWeights.forEach((ex, index) => {
      const isLastInPair = index % 2 === 1;
      const supersetId = `superset-${Math.floor(index / 2) + 1}`;

      const item = createWorkoutItem(
        ex, supersetRounds, `${ex.defaultRepRange} reps`,
        isLastInPair ? supersetRest : 0
      );
      item.supersetId = supersetId;
      mainItems.push(item);
    });

    // Cardio after supersets
    let remainingCardioSeconds = cardioSeconds;
    cardioExercises.forEach(ex => {
      const cardio = getCardioTimeBudget(ex, intensity, remainingCardioSeconds, cardioExercises.length);
      mainItems.push(createWorkoutItem(ex, cardio.sets, cardio.target, cardio.rest));
      remainingCardioSeconds -= cardio.secondsConsumed;
    });

  } else if (workoutStyle === 'amrap') {
    const amrapRounds = weightsBudget.amrapRounds ?? 3;
    const allExercises = [...weightExercises, ...cardioExercises];

    allExercises.forEach(ex => {
      let specificReps = ex.defaultRepRange;
      if (ex.defaultRepRange.includes('-')) {
        const parts = ex.defaultRepRange.split('-');
        const low = parseInt(parts[0]);
        const high = parseInt(parts[1]);
        specificReps = `${Math.round((low + high) / 2)} reps`;
      }

      mainItems.push(createWorkoutItem(ex, 1, specificReps, 0, 'amrap-round', amrapRounds));
    });

  } else {
    // TRADITIONAL: Complete all sets before moving to next exercise
    weightExercises.forEach(ex => {
      const exerciseSets = setsMap.get(ex.id) ?? MIN_SETS_PER_EXERCISE;
      mainItems.push(createWorkoutItem(
        ex, exerciseSets, `${ex.defaultRepRange} reps`, restSeconds
      ));
    });

    // Cardio after weights
    let remainingCardioSeconds = cardioSeconds;
    cardioExercises.forEach(ex => {
      const cardio = getCardioTimeBudget(ex, intensity, remainingCardioSeconds, cardioExercises.length);
      mainItems.push(createWorkoutItem(ex, cardio.sets, cardio.target, cardio.rest));
      remainingCardioSeconds -= cardio.secondsConsumed;
    });
  }

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
