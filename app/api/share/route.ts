import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';
import { WorkoutPlan } from '@/lib/types';

// Create Redis client
const getRedisClient = async () => {
  const client = createClient({
    url: process.env.KV_URL || process.env.REDIS_URL,
  });

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
};

function generateShortId(): string {
  // Generate a short 6-character ID
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST - Create a new short link
export async function POST(request: NextRequest) {
  let redis;
  try {
    const workout: WorkoutPlan = await request.json();
    redis = await getRedisClient();

    // Generate a unique ID
    let shortId = generateShortId();
    let exists = await redis.exists(`workout:${shortId}`);

    // Keep generating until we find a unique ID
    while (exists) {
      shortId = generateShortId();
      exists = await redis.exists(`workout:${shortId}`);
    }

    // Store the workout in Redis with no expiration (persists forever)
    await redis.set(`workout:${shortId}`, JSON.stringify(workout));

    return NextResponse.json({ shortId });
  } catch (error) {
    console.error('Error creating short link:', error);
    return NextResponse.json(
      { error: 'Failed to create short link' },
      { status: 500 }
    );
  } finally {
    if (redis) {
      await redis.quit();
    }
  }
}

// GET - Retrieve a workout by short ID
export async function GET(request: NextRequest) {
  let redis;
  try {
    const { searchParams } = new URL(request.url);
    const shortId = searchParams.get('id');

    if (!shortId) {
      return NextResponse.json(
        { error: 'Missing short ID' },
        { status: 400 }
      );
    }

    redis = await getRedisClient();
    const workoutData = await redis.get(`workout:${shortId}`);

    if (!workoutData) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    const workout = JSON.parse(workoutData) as WorkoutPlan;

    return NextResponse.json({ workout });
  } catch (error) {
    console.error('Error retrieving workout:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve workout' },
      { status: 500 }
    );
  } finally {
    if (redis) {
      await redis.quit();
    }
  }
}
