const { PrismaClient } = require('@prisma/client')

// Prisma 7 reads config from prisma.config.ts
const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...\n')

    // Test connection
    await prisma.$connect()
    console.log('✅ Successfully connected to database!\n')

    // Count records in each table
    const userCount = await prisma.user.count()
    const workoutCount = await prisma.savedWorkout.count()
    const performanceCount = await prisma.workoutPerformance.count()

    console.log('📊 Database Statistics:')
    console.log(`   Users: ${userCount}`)
    console.log(`   Saved Workouts: ${workoutCount}`)
    console.log(`   Performance Entries: ${performanceCount}\n`)

    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `

    console.log('📋 Database Tables:')
    tables.forEach(row => {
      console.log(`   ✓ ${row.table_name}`)
    })

    console.log('\n✨ Database is ready to use!')

  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
