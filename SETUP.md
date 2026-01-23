# Workout Generator - Setup Guide

This guide will help you set up the complete authentication and performance tracking features for the Workout Generator application.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A PostgreSQL database (local or cloud-hosted)
- A Google Cloud Platform account for OAuth

## Step 1: Install Dependencies

All required dependencies have been installed:

```bash
npm install
```

## Step 2: Database Setup

### Option A: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a new database:
   ```sql
   CREATE DATABASE workout_generator;
   ```

3. Update your `.env.local` file with your database URL:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/workout_generator?schema=public"
   ```

### Option B: Cloud Database (Recommended)

Use a cloud database provider like:
- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier available
- **Railway** (https://railway.app) - Free tier available
- **Vercel Postgres** (if deploying to Vercel)

After creating your database, copy the connection string to `.env.local`:

```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### Initialize the Database

Run Prisma migrations to create the database schema:

```bash
npx prisma generate
npx prisma db push
```

This will create all necessary tables:
- `User` - User accounts
- `Account` - OAuth provider accounts
- `Session` - User sessions
- `SavedWorkout` - User-saved workouts
- `WorkoutPerformance` - Exercise performance tracking

## Step 3: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)

2. Create a new project (or select an existing one)

3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click "Create"

5. Copy your Client ID and Client Secret

6. Update `.env.local`:
   ```
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

## Step 4: NextAuth Configuration

Generate a secret for NextAuth:

```bash
openssl rand -base64 32
```

Add it to `.env.local`:

```
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```

For production, update `NEXTAUTH_URL` to your production domain.

## Step 5: Complete Environment Variables

Your `.env.local` file should now contain:

```env
# Redis Configuration (existing)
REDIS_URL="your-redis-url"
KV_URL="your-redis-url"

# Database Configuration
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth Configuration
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

## Step 6: Run the Application

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` and test the following features:

### Testing Authentication

1. Click "Sign in with Google" in the header
2. Complete the Google OAuth flow
3. You should see your profile info in the header
4. Click "Sign Out" to log out

### Testing Workout Saving

1. Generate a workout
2. Click "SAVE"
3. Enter a workout name
4. If logged in: workout saves to database
5. If not logged in: workout saves to localStorage with a reminder to sign in

### Testing Performance Tracking

1. Sign in to your account
2. Generate a workout
3. Expand an exercise by clicking "How to"
4. Click "Log Performance"
5. Enter weight, reps, and sets for one or more weights
6. Click "Save Performance"
7. Click "View History" to see your logged performance
8. The top 5 highest weights will be displayed with reps and dates

### Testing Saved Workouts

1. Click "SAVED" in the header
2. View workouts from both database (cloud icon) and localStorage (hard drive icon)
3. Click "Load" to load a workout
4. Click "Delete" to remove a workout

## Features Overview

### For Non-Authenticated Users

- ✅ Full workout generation functionality
- ✅ Save workouts to localStorage
- ✅ View saved workouts (localStorage only)
- ✅ Share workouts via URL
- ❌ Cannot track performance
- ❌ Cannot sync across devices

### For Authenticated Users

- ✅ Full workout generation functionality
- ✅ Save workouts to database (synced across devices)
- ✅ View saved workouts from both database and localStorage
- ✅ Share workouts via URL
- ✅ Track performance (weight, reps, sets) for each exercise
- ✅ View history of top 5 highest weights for each exercise
- ✅ See personal records and total sessions

## Database Schema

The application uses the following main tables:

### User
- Stores user profile information from Google OAuth
- Fields: id, email, name, image, createdAt

### SavedWorkout
- Stores user-saved workout plans
- Fields: id, userId, name, plan (JSON), savedAt
- Relationship: Many-to-one with User

### WorkoutPerformance
- Stores exercise performance data
- Fields: id, userId, exerciseName, exerciseId, weight, reps, sets, date, workoutId, notes
- Relationship: Many-to-one with User
- Indexes: (userId, exerciseName), (userId, date)

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify your `DATABASE_URL` is correct
2. Ensure your database is running and accessible
3. Check firewall rules if using a cloud database
4. Run `npx prisma db push` again

### OAuth Errors

If Google sign-in fails:

1. Verify redirect URIs match exactly in Google Console
2. Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
3. Check that `NEXTAUTH_URL` matches your current URL
4. Clear browser cookies and try again

### Performance Tracking Not Showing

1. Ensure you're signed in
2. Check browser console for API errors
3. Verify database connection
4. Ensure the `WorkoutPerformance` table exists

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables from `.env.local` to Vercel
4. Update `NEXTAUTH_URL` to your Vercel domain
5. Update Google OAuth redirect URIs to include your Vercel domain
6. Deploy!

### Database for Production

Consider using:
- Vercel Postgres (integrated with Vercel)
- Neon (serverless PostgreSQL)
- Supabase (PostgreSQL with additional features)

## Support

For issues or questions:
1. Check the browser console for errors
2. Review Prisma logs: `npx prisma studio` to view your database
3. Test API endpoints directly using tools like Postman
4. Check NextAuth debug mode by adding `debug: true` to `authOptions`

## Next Steps

After setup, you can:
- Customize the UI styling
- Add more performance metrics
- Create workout programs and progressions
- Add social features (share workouts with friends)
- Export performance data to CSV
- Add charts and graphs for progress visualization
