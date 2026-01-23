import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Retrieve performance data for an exercise
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const exerciseName = searchParams.get('exerciseName')

    if (!exerciseName) {
      return NextResponse.json(
        { error: 'Exercise name is required' },
        { status: 400 }
      )
    }

    // Get all performance entries for this exercise, ordered by weight (highest first)
    const performances = await prisma.workoutPerformance.findMany({
      where: {
        userId: session.user.id,
        exerciseName,
      },
      orderBy: [
        { weight: 'desc' },
        { date: 'desc' },
      ],
    })

    // Group by unique weights and get the top 5
    const uniqueWeights = new Map<number, typeof performances[0]>()

    for (const perf of performances) {
      if (!uniqueWeights.has(perf.weight) && uniqueWeights.size < 5) {
        uniqueWeights.set(perf.weight, perf)
      }
    }

    const topWeights = Array.from(uniqueWeights.values()).map(p => ({
      id: p.id,
      weight: p.weight,
      reps: p.reps,
      sets: p.sets,
      date: p.date,
    }))

    const personalRecord = performances.length > 0 ? performances[0].weight : 0
    const totalSessions = new Set(performances.map(p => p.date.toDateString())).size

    return NextResponse.json({
      exerciseName,
      topWeights,
      totalSessions,
      personalRecord,
    })
  } catch (error) {
    console.error('Error fetching performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}

// POST - Log a new performance entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exerciseName, exerciseId, weight, reps, sets, workoutId, notes } = body

    if (!exerciseName || weight === undefined || !reps) {
      return NextResponse.json(
        { error: 'Exercise name, weight, and reps are required' },
        { status: 400 }
      )
    }

    const performance = await prisma.workoutPerformance.create({
      data: {
        userId: session.user.id,
        exerciseName,
        exerciseId: exerciseId || null,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        sets: sets ? parseInt(sets) : 1,
        workoutId: workoutId || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ performance })
  } catch (error) {
    console.error('Error logging performance:', error)
    return NextResponse.json(
      { error: 'Failed to log performance' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a performance entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const performanceId = searchParams.get('id')

    if (!performanceId) {
      return NextResponse.json(
        { error: 'Performance ID is required' },
        { status: 400 }
      )
    }

    // Ensure the performance entry belongs to the user
    const performance = await prisma.workoutPerformance.findUnique({
      where: { id: performanceId },
    })

    if (!performance) {
      return NextResponse.json(
        { error: 'Performance entry not found' },
        { status: 404 }
      )
    }

    if (performance.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.workoutPerformance.delete({
      where: { id: performanceId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting performance:', error)
    return NextResponse.json(
      { error: 'Failed to delete performance entry' },
      { status: 500 }
    )
  }
}
