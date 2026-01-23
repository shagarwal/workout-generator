import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { WorkoutPlan } from '@/lib/types'

// GET - Retrieve all saved workouts for the authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workouts = await prisma.savedWorkout.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        savedAt: 'desc',
      },
    })

    // Parse the JSON plan string back to object
    const parsedWorkouts = workouts.map(workout => ({
      id: workout.id,
      userId: workout.userId,
      name: workout.name,
      plan: JSON.parse(workout.plan) as WorkoutPlan,
      savedAt: workout.savedAt,
    }))

    return NextResponse.json({ workouts: parsedWorkouts })
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

// POST - Save a new workout for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, plan } = body

    if (!name || !plan) {
      return NextResponse.json(
        { error: 'Name and plan are required' },
        { status: 400 }
      )
    }

    const workout = await prisma.savedWorkout.create({
      data: {
        userId: session.user.id,
        name,
        plan: JSON.stringify(plan),
      },
    })

    return NextResponse.json({
      workout: {
        id: workout.id,
        userId: workout.userId,
        name: workout.name,
        plan: JSON.parse(workout.plan) as WorkoutPlan,
        savedAt: workout.savedAt,
      },
    })
  } catch (error) {
    console.error('Error saving workout:', error)
    return NextResponse.json(
      { error: 'Failed to save workout' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a specific workout by ID
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workoutId = searchParams.get('id')

    if (!workoutId) {
      return NextResponse.json(
        { error: 'Workout ID is required' },
        { status: 400 }
      )
    }

    // Ensure the workout belongs to the user
    const workout = await prisma.savedWorkout.findUnique({
      where: { id: workoutId },
    })

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      )
    }

    if (workout.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.savedWorkout.delete({
      where: { id: workoutId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}
