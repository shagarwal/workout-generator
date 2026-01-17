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
  | 'Calf raise machine';

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
