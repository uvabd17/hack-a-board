import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}`
const isProduction = process.env.NODE_ENV === 'production'

const pool = new Pool({
    connectionString,
    max: isProduction ? 15 : 5,     // Higher pool in production
    min: isProduction ? 2 : 1,      // Keep connections warm in prod
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: !isProduction,  // Keep pool alive in production
    statement_timeout: 30000,        // 30s query timeout to prevent runaway queries
})

// Log pool errors instead of crashing
pool.on('error', (err) => {
    console.error('Unexpected PG pool error:', err.message)
})

const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: isProduction ? ['error'] : ['warn', 'error'],
})

if (!isProduction) globalForPrisma.prisma = prisma
