# Workout Builder

A mobile-first web application that generates customized workout plans based on user preferences.

## Features

- **Customizable Inputs**
  - Select target muscle groups (Chest, Back, Shoulders, Biceps, Triceps, Legs, Glutes, Core, Full Body)
  - Choose available equipment (bodyweight, dumbbells, barbell, kettlebell, resistance bands, and more)
  - Set intensity level (Easy, Moderate, Hard, Brutal)
  - Adjust cardio vs weights split (0-100%)
  - Select workout duration (10-120 minutes)

- **Smart Workout Generation**
  - 40+ exercise library with proper form videos
  - Respects equipment constraints
  - Covers selected muscle groups
  - Includes warmup and cooldown sections
  - YouTube demo links for every exercise

- **Mobile-First Design**
  - Responsive layout optimized for mobile devices
  - Large touch targets
  - Clean, accessible interface
  - Smooth animations and transitions

- **Additional Features**
  - Regenerate workouts with same preferences
  - Copy workout plan to clipboard
  - Real-time validation
  - Loading states for better UX

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Static export ready

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm

### Installation

1. Clone or download this repository

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
workout-generator/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page with workout builder
│   └── globals.css         # Global styles
├── components/
│   ├── MultiSelectChips.tsx    # Multi-select chip UI
│   ├── IntensitySelector.tsx   # Intensity picker
│   ├── SliderInput.tsx         # Reusable slider component
│   ├── DurationPicker.tsx      # Duration selector with quick options
│   └── WorkoutDisplay.tsx      # Workout plan display
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── exercises.ts        # Exercise library (40+ exercises)
│   └── generator.ts        # Workout generation logic
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## How It Works

1. **User Input Collection**: The app collects user preferences through an intuitive form interface

2. **Equipment Filtering**: Exercises are filtered based on available equipment
   - If "Bodyweight only" is selected, only bodyweight exercises are included
   - Otherwise, exercises requiring unavailable equipment are excluded

3. **Time Allocation**:
   - Warmup: 10% of total duration (3-8 min)
   - Cooldown: 5-10% of total duration (2-6 min)
   - Main workout: Remaining time split between cardio and weights based on slider

4. **Exercise Selection**:
   - Ensures at least 1-2 exercises per selected muscle group
   - Adjusts exercise count based on duration
   - Avoids repeating exercises
   - Shuffles for variety

5. **Intensity Mapping**:
   - Easy: 2 sets, 75-90s rest
   - Moderate: 3 sets, 60-75s rest
   - Hard: 3-4 sets, 45-60s rest
   - Brutal: 4-5 sets, 30-45s rest

6. **Output Generation**: Creates a complete workout plan with warmup, main section, and cooldown

## Customization

### Adding New Exercises

Edit [lib/exercises.ts](lib/exercises.ts) and add new exercise objects:

```typescript
{
  id: 'unique-id',
  name: 'Exercise Name',
  muscles: ['Chest', 'Triceps'],
  equipment: ['Dumbbells'],
  type: 'weights', // or 'cardio' or 'mobility'
  difficulty: 'intermediate',
  defaultRepRange: '8-12',
  youtubeQuery: 'exercise name proper form',
}
```

### Modifying Generation Logic

The workout generation logic is in [lib/generator.ts](lib/generator.ts). You can adjust:
- Time allocation percentages
- Exercise count calculations
- Rest time formulas
- Set ranges for different intensities

## Deployment

This app can be deployed to:
- Vercel (recommended for Next.js)
- Netlify
- Any static hosting service

For static export:

```bash
npm run build
```

The output will be in the `.next` folder, ready for deployment.

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
