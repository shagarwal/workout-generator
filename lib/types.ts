export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Legs'
  | 'Glutes'
  | 'Core'
  | 'Full Body';

// Weight Equipment
export type WeightEquipment =
  | 'Bodyweight'
  | 'Dumbbells'
  | 'Barbell'
  | 'Kettlebell'
  | 'Resistance bands'
  | 'Pull-up bar'
  | 'Bench'
  | 'Cable machine'
  | 'Smith machine'
  | 'Leg press machine'
  | 'Leg curl machine'
  | 'Leg extension machine'
  | 'Lat pulldown machine'
  | 'Seated row machine'
  | 'Chest press machine'
  | 'Shoulder press machine'
  | 'Pec deck machine'
  | 'Hack squat machine'
  | 'Calf raise machine'
  | 'Back extension machine'
  | 'Weight plate'
  | 'Medicine ball'
  | 'Battle ropes'
  | 'Sled';

// Cardio Equipment
export type CardioEquipment =
  | 'Treadmill'
  | 'Stationary bike'
  | 'Rowing machine'
  | 'Elliptical'
  | 'Stair climber'
  | 'Jump rope'
  | 'Assault bike';

export type Equipment = WeightEquipment | CardioEquipment;

export type Intensity = 'easy' | 'moderate' | 'hard' | 'brutal';

export type WorkoutStyle = 'traditional' | 'circuit' | 'superset' | 'amrap';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type ExerciseType = 'weights' | 'cardio' | 'mobility';

export interface Exercise {
  id: string;
  name: string;
  muscles: MuscleGroup[];
  equipment: Equipment[];
  type: ExerciseType;
  difficulty: FitnessLevel;
  defaultRepRange: string;
  youtubeQuery: string;
  instructions?: string[];
  imageUrl?: string;
  unilateral?: boolean;
  notes?: string;
}

export interface WorkoutInputs {
  selectedMuscles: MuscleGroup[];
  equipment: Equipment[];
  intensity: Intensity;
  cardioWeightSplit: number;
  durationMinutes: number;
  workoutStyle: WorkoutStyle;
  stretchingMinutes: number;
  stretchingOnly: boolean;
  otherNotes?: string;
}

export interface WorkoutItem {
  name: string;
  sets: number;
  target: string;
  restSeconds?: number;
  youtubeUrl: string;
  instructions?: string[];
  imageUrl?: string;
  circuitId?: string; // For grouping exercises in circuits
  circuitRounds?: number; // How many times to repeat the circuit
  muscles?: MuscleGroup[]; // Muscle groups targeted by this exercise
  exerciseId?: string; // ID of the exercise for swapping
}

export interface WorkoutSection {
  title: string;
  items: WorkoutItem[];
}

export interface WorkoutPlan {
  summary: {
    title: string;
    muscles: string;
    equipment: string;
    intensity: string;
    cardioPercent: number;
    weightsPercent: number;
    workoutStyle: WorkoutStyle;
    stretchingMinutes?: number;
    stretchingOnly?: boolean;
  };
  sections: {
    stretching: WorkoutSection;
    main: WorkoutSection;
  };
}

// User and Authentication types
export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  createdAt: Date;
}

// Saved workout for authenticated users
export interface SavedUserWorkout {
  id: string;
  userId: string;
  name: string;
  plan: WorkoutPlan;
  savedAt: Date;
}

// Performance tracking for exercises
export interface WorkoutPerformance {
  id: string;
  userId: string;
  exerciseName: string;
  exerciseId?: string | null;
  weight: number;
  reps: number;
  sets: number;
  date: Date;
  workoutId?: string | null;
  notes?: string | null;
}

// Exercise history summary (top 5 weights)
export interface ExerciseHistoryEntry {
  weight: number;
  reps: number;
  sets: number;
  date: Date;
  id: string;
}

export interface ExerciseHistory {
  exerciseName: string;
  topWeights: ExerciseHistoryEntry[];
  totalSessions: number;
  personalRecord: number;
}
