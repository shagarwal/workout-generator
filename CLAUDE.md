# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server on localhost:3000
npm run build    # Build for production
npm run lint     # Run ESLint
```

After modifying Prisma schema:
```bash
npx prisma generate   # Regenerate Prisma client
npx prisma db push    # Push schema changes to database
```

## Architecture

### Core Flow
User inputs (muscles, equipment, duration, intensity, workout style) → `lib/generator.ts` → WorkoutPlan → `components/WorkoutDisplay.tsx`

### Key Files

**lib/exercises.ts** - Exercise database with 195 exercises. Each exercise has:
- `id`, `name`, `muscles[]`, `equipment[]`, `type` (weights/cardio/mobility)
- `imageUrl` - local path like `/exercise-images/name.jpg` or empty string with `// TODO: needs image` comment
- `instructions[]`, `youtubeQuery`

**lib/generator.ts** - Workout generation logic:
- `generateWorkoutPlan()` - Main entry point
- `selectExercisesForMuscles()` - Filters by equipment, prioritizes equipment-specific exercises over bodyweight
- Handles 4 workout styles: traditional, circuit, superset, amrap
- Time allocation: warmup (10%), cooldown (5-10%), main workout (remaining)

**lib/types.ts** - All TypeScript interfaces: `Exercise`, `WorkoutPlan`, `WorkoutItem`, `WorkoutInputs`

**components/WorkoutDisplay.tsx** - Renders workout plans:
- `WorkoutSection` - Renders differently based on workout style (circuit/amrap use simplified `isInCircuit` display)
- `ExerciseCard` - Individual exercise with expandable instructions, images, performance tracking

### Data Persistence
- **Prisma + PostgreSQL** via Vercel Postgres
- **NextAuth** with Google OAuth (`lib/auth.ts`)
- Models: `User`, `SavedWorkout`, `WorkoutPerformance`

### API Routes
- `/api/auth/[...nextauth]` - Authentication
- `/api/workouts` - Save/load user workouts
- `/api/performance` - Track exercise performance history
- `/api/share` - Generate shareable workout links (Redis-backed)

## Exercise Images

Images stored in `public/exercise-images/`. Scripts in `scripts/`:
- `fetch-exercise-images.js` - Download images from fitness sites
- `exercise-urls.json` - Verified image URLs
- `mark-missing-images.js` - Mark exercises without images

To find exercises needing images, search for `// TODO: needs image` in `lib/exercises.ts`.

## Environment Variables

Required in `.env`:
- `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` - Database
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` - NextAuth
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Share links
