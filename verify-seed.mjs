import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const hackathon = await prisma.hackathon.findUnique({
  where: { slug: 'test-hackathon-2026' },
  select: { name: true, status: true, _count: { select: { teams: true, rounds: true } } }
})

if (hackathon) {
  console.log('✅ Hackathon found!')
  console.log(`   Name: ${hackathon.name}`)
  console.log(`   Status: ${hackathon.status}`)
  console.log(`   Teams: ${hackathon._count.teams}`)
  console.log(`   Rounds: ${hackathon._count.rounds}`)
} else {
  console.log('❌ Hackathon not found - seed may have failed')
}

await prisma.$disconnect()
