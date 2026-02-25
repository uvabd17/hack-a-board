import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment variables')
  console.error('   Make sure you have a .env or .env.local file with DATABASE_URL')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  max: 5,  // Seed scripts don't need many connections
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
})
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data (in development only!)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...')
    try {
      await prisma.score.deleteMany()
      await prisma.judgingAttempt.deleteMany()
      await prisma.submission.deleteMany()
      await prisma.criterion.deleteMany()
      await prisma.round.deleteMany()
      await prisma.participant.deleteMany()
      await prisma.team.deleteMany()
      await prisma.judge.deleteMany()
      await prisma.problemStatement.deleteMany()
      await prisma.phase.deleteMany()
      await prisma.ceremonySession.deleteMany()
      await prisma.hackathon.deleteMany()
      await prisma.account.deleteMany()
      await prisma.session.deleteMany()
      await prisma.user.deleteMany()
    } catch (error: unknown) {
      if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === 'P2021') {
        console.log('⚠️  Tables don\'t exist yet - skipping cleanup (this is normal for first run)')
      } else {
        throw error
      }
    }
  }

  // 1. Create Test Organizer User
  console.log('👤 Creating organizer user...')
  const organizer = await prisma.user.create({
    data: {
      id: 'test_organizer_001',
      name: 'Test Organizer',
      email: 'organizer@test.com',
      emailVerified: new Date(),
    },
  })

  // 2. Create Test Hackathon
  console.log('🏆 Creating test hackathon...')
  const now = new Date()
  const startDate = new Date(now.getTime() - 2 * 60 * 60 * 1000) // Started 2 hours ago
  const endDate = new Date(now.getTime() + 6 * 60 * 60 * 1000) // Ends in 6 hours

  const hackathon = await prisma.hackathon.create({
    data: {
      slug: 'test-hackathon-2026',
      name: 'Test Hackathon 2026',
      tagline: 'Innovation Through Code',
      description: 'A comprehensive test hackathon with all features enabled for testing.',
      startDate,
      endDate,
      timezone: 'Asia/Kolkata',
      mode: 'in-person',
      venue: 'Test Innovation Center',
      minTeamSize: 1,
      maxTeamSize: 4,
      maxTeams: 100,
      requireApproval: false,
      registrationDeadline: endDate,
      status: 'live',
      liveStartedAt: startDate,
      timeBonusRate: 2.0,
      timePenaltyRate: 1.0,
      isFrozen: false,
      displayMode: 'global',
      userId: organizer.id,
    },
  })

  // 3. Create Problem Statements (Tracks)
  console.log('📋 Creating problem statements...')
  const problems = await Promise.all([
    prisma.problemStatement.create({
      data: {
        hackathonId: hackathon.id,
        slug: 'fintech-innovation',
        title: 'FinTech Innovation',
        description: 'Build innovative solutions for financial technology challenges',
        icon: '💰',
        isReleased: true,
        releasedAt: startDate,
        order: 1,
      },
    }),
    prisma.problemStatement.create({
      data: {
        hackathonId: hackathon.id,
        slug: 'healthtech-solutions',
        title: 'HealthTech Solutions',
        description: 'Create healthcare technology solutions that improve patient outcomes',
        icon: '🏥',
        isReleased: true,
        releasedAt: startDate,
        order: 2,
      },
    }),
    prisma.problemStatement.create({
      data: {
        hackathonId: hackathon.id,
        slug: 'climate-change',
        title: 'Climate Change Solutions',
        description: 'Develop technology to combat climate change and environmental issues',
        icon: '🌍',
        isReleased: true,
        releasedAt: startDate,
        order: 3,
      },
    }),
  ])

  // 4. Create Phases
  console.log('⏰ Creating event phases...')
  await Promise.all([
    prisma.phase.create({
      data: {
        hackathonId: hackathon.id,
        name: 'Registration & Setup',
        startTime: new Date(startDate.getTime() - 1 * 60 * 60 * 1000),
        endTime: startDate,
        order: 1,
      },
    }),
    prisma.phase.create({
      data: {
        hackathonId: hackathon.id,
        name: 'Hacking Phase',
        startTime: startDate,
        endTime: new Date(startDate.getTime() + 4 * 60 * 60 * 1000),
        order: 2,
      },
    }),
    prisma.phase.create({
      data: {
        hackathonId: hackathon.id,
        name: 'Judging & Ceremony',
        startTime: new Date(startDate.getTime() + 4 * 60 * 60 * 1000),
        endTime: endDate,
        order: 3,
      },
    }),
  ])

  // 5. Create Rounds with Criteria and REALISTIC TIMER STATES
  console.log('🎯 Creating rounds with checkpoint timers...')
  
  // Round 1: Already expired, 2 judges required, no link submission
  const round1 = await prisma.round.create({
    data: {
      hackathonId: hackathon.id,
      name: 'Round 1: Ideation',
      order: 1,
      weight: 30,
      checkpointTime: new Date(startDate.getTime() + 1.5 * 60 * 60 * 1000), // 1.5 hours after start (already passed)
      checkpointPausedAt: null,
      requiredJudges: 2, // Test multi-judge averaging
      requiresLinkSubmission: false, // Direct judging
    },
  })

  // Round 2: Currently PAUSED, 3 judges required, REQUIRES LINK SUBMISSION (full 2-step flow)
  const round2PausedAt = new Date(now.getTime() - 10 * 60 * 1000) // Paused 10 mins ago
  const round2 = await prisma.round.create({
    data: {
      hackathonId: hackathon.id,
      name: 'Round 2: Prototype',
      order: 2,
      weight: 35,
      checkpointTime: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
      checkpointPausedAt: round2PausedAt, // Currently paused
      requiredJudges: 3, // Test 3-judge requirement
      requiresLinkSubmission: true, // REQUIRES links before judging
    },
  })

  // Round 3: ACTIVE and running, single judge, no links required
  const round3 = await prisma.round.create({
    data: {
      hackathonId: hackathon.id,
      name: 'Round 3: Final Demo',
      order: 3,
      weight: 35,
      checkpointTime: new Date(now.getTime() + 90 * 60 * 1000), // 90 minutes from now (1.5 hours)
      checkpointPausedAt: null, // Running
      requiredJudges: 1, // Simple single judge
      requiresLinkSubmission: false,
    },
  })

  // Create criteria for Round 1
  await Promise.all([
    prisma.criterion.create({
      data: { roundId: round1.id, name: 'Innovation', weight: 40 },
    }),
    prisma.criterion.create({
      data: { roundId: round1.id, name: 'Feasibility', weight: 30 },
    }),
    prisma.criterion.create({
      data: { roundId: round1.id, name: 'Impact', weight: 30 },
    }),
  ])

  // Create criteria for Round 2
  await Promise.all([
    prisma.criterion.create({
      data: { roundId: round2.id, name: 'Technical Implementation', weight: 50 },
    }),
    prisma.criterion.create({
      data: { roundId: round2.id, name: 'Design & UX', weight: 25 },
    }),
    prisma.criterion.create({
      data: { roundId: round2.id, name: 'Progress', weight: 25 },
    }),
  ])

  // Create criteria for Round 3
  await Promise.all([
    prisma.criterion.create({
      data: { roundId: round3.id, name: 'Presentation Quality', weight: 30 },
    }),
    prisma.criterion.create({
      data: { roundId: round3.id, name: 'Completeness', weight: 35 },
    }),
    prisma.criterion.create({
      data: { roundId: round3.id, name: 'Business Viability', weight: 35 },
    }),
  ])

  // 6. Create Judges
  console.log('👨‍⚖️ Creating judges...')
  const judges = await Promise.all(
    Array.from({ length: 5 }, (_, i) => {
      const judgeNum = i + 1
      return prisma.judge.create({
        data: {
          hackathonId: hackathon.id,
          name: `Judge ${judgeNum}`,
          token: `test_judge_token_${judgeNum.toString().padStart(3, '0')}`,
          isActive: true,
        },
      })
    })
  )

  // 7. Create Teams and Participants
  console.log('👥 Creating teams and participants...')
  const teamData = [
    { name: 'Phoenix Coders', problem: problems[0], members: 4 },
    { name: 'Quantum Leap', problem: problems[0], members: 3 },
    { name: 'Code Warriors', problem: problems[1], members: 4 },
    { name: 'Data Wizards', problem: problems[1], members: 3 },
    { name: 'Green Tech', problem: problems[2], members: 4 },
    { name: 'Eco Innovators', problem: problems[2], members: 3 },
    { name: 'Tech Titans', problem: problems[0], members: 4 },
    { name: 'Innovation Hub', problem: problems[1], members: 3 },
    { name: 'Future Builders', problem: problems[2], members: 4 },
    { name: 'Alpha Team', problem: problems[0], members: 2 },
  ]

  for (let i = 0; i < teamData.length; i++) {
    const teamInfo = teamData[i]
    const teamNum = i + 1

    const team = await prisma.team.create({
      data: {
        hackathonId: hackathon.id,
        name: teamInfo.name,
        inviteCode: `TEAM${teamNum.toString().padStart(3, '0')}`,
        problemStatementId: teamInfo.problem.id,
        selectedAt: new Date(startDate.getTime() + 10 * 60 * 1000), // 10 mins after start
        status: 'approved',
        isCheckedIn: true,
        checkedInAt: startDate,
      },
    })

    // Create participants for this team
    for (let j = 0; j < teamInfo.members; j++) {
      const memberNum = j + 1
      await prisma.participant.create({
        data: {
          hackathonId: hackathon.id,
          teamId: team.id,
          name: `${teamInfo.name} Member ${memberNum}`,
          email: `team${teamNum}_member${memberNum}@test.com`,
          phone: `+91${9000000000 + teamNum * 10 + memberNum}`,
          college: `Test University ${(teamNum % 3) + 1}`,
          role: j === 0 ? 'leader' : 'member',
          qrToken: `qr_team${teamNum}_m${memberNum}_${Date.now() + teamNum * 100 + j}`,
          status: 'approved',
        },
      })
    }

    // Create submissions for rounds using NEW JUDGING-IS-SUBMISSION FLOW
    
    // ROUND 1: Judging-is-submission flow (no link requirement, 2 judges)
    // All teams have been judged by 2+ judges, so submissions auto-created
    const submissionTime1 = new Date(
      startDate.getTime() + (1 + Math.random() * 0.3) * 60 * 60 * 1000
    ) // Random between 1-1.3 hours (when 2nd judge completed)
    
    const checkpoint1 = new Date(round1.checkpointTime)
    const bonus1 = Math.max(
      0,
      Math.floor((checkpoint1.getTime() - submissionTime1.getTime()) / (60 * 1000)) * 2
    ) // 2 pts per minute early

    await prisma.submission.create({
      data: {
        teamId: team.id,
        roundId: round1.id,
        submittedAt: submissionTime1, // Set when 2nd judge completed
        timeBonus: bonus1,
      },
    })

    // ROUND 2: Full 2-step flow (requires links, then judging, 3 judges)
    // 7 teams submitted links, 4 completed judging, 3 still need more judges
    if (i < 7) {
      // 7 teams submitted links
      const linksTime = new Date(now.getTime() - (20 + Math.random() * 10) * 60 * 1000) // Links submitted 20-30 mins ago
      
      if (i < 4) {
        // 4 teams completed judging (3 judges scored them)
        const submissionTime2 = new Date(now.getTime() - (5 + Math.random() * 5) * 60 * 1000) // Completed 5-10 mins ago
        const checkpoint2 = new Date(round2.checkpointTime)
        const bonus2 = Math.max(
          0,
          Math.floor((checkpoint2.getTime() - submissionTime2.getTime()) / (60 * 1000)) * 2
        )

        await prisma.submission.create({
          data: {
            teamId: team.id,
            roundId: round2.id,
            githubUrl: `https://github.com/test/${teamInfo.name.toLowerCase().replace(/\s/g, '-')}`,
            demoUrl: `https://demo.test.com/${teamInfo.name.toLowerCase().replace(/\s/g, '-')}`,
            presentationUrl: `https://slides.test.com/${teamInfo.name.toLowerCase().replace(/\s/g, '-')}`,
            linksSubmittedAt: linksTime, // STEP 1: Links submitted
            submittedAt: submissionTime2, // STEP 2: Judging completed (3rd judge done)
            timeBonus: bonus2,
          },
        })
      } else {
        // 3 teams submitted links but haven't completed judging yet (only 1-2 judges scored)
        await prisma.submission.create({
          data: {
            teamId: team.id,
            roundId: round2.id,
            githubUrl: `https://github.com/test/${teamInfo.name.toLowerCase().replace(/\s/g, '-')}`,
            demoUrl: `https://demo.test.com/${teamInfo.name.toLowerCase().replace(/\s/g, '-')}`,
            presentationUrl: `https://slides.test.com/${teamInfo.name.toLowerCase().replace(/\s/g, '-')}`,
            linksSubmittedAt: linksTime, // STEP 1 complete
            submittedAt: null, // STEP 2 incomplete (waiting for 3rd judge)
            timeBonus: 0,
          },
        })
      }
    }
    // 3 teams (i >= 7) haven't even submitted links yet

    // ROUND 3: Not started yet (nobody judged)

    // Create scores and JudgingAttempts using NEW FLOW
    
    // ROUND 1: All teams scored by 2-3 judges (completed)
    const round1Criteria = await prisma.criterion.findMany({ where: { roundId: round1.id } })
    const round1Judges = judges.slice(0, 2 + Math.floor(Math.random() * 2)) // 2-3 judges
    
    for (let jIdx = 0; jIdx < round1Judges.length; jIdx++) {
      const judge = round1Judges[jIdx]
      const scanTime = new Date(submissionTime1.getTime() - (15 - jIdx * 5) * 60 * 1000) // Scanned before completion
      const completeTime = new Date(submissionTime1.getTime() - (10 - jIdx * 5) * 60 * 1000) // Completed progressively
      
      // Create JudgingAttempt
      await prisma.judgingAttempt.create({
        data: {
          judgeId: judge.id,
          teamId: team.id,
          roundId: round1.id,
          scannedAt: scanTime,
          completedAt: jIdx < 2 ? completeTime : completeTime, // All completed
        },
      })
      
      // Create scores
      for (const criterion of round1Criteria) {
        const baseScore = 3 + Math.floor(Math.random() * 3)
        await prisma.score.create({
          data: {
            teamId: team.id,
            roundId: round1.id,
            judgeId: judge.id,
            criterionId: criterion.id,
            value: baseScore,
            comment: baseScore >= 4 ? 'Excellent work!' : 'Good effort, keep improving.',
          },
        })
      }
    }
    
    // ROUND 2: Different judging states per team
    const round2Criteria = await prisma.criterion.findMany({ where: { roundId: round2.id } })
    if (i < 4) {
      // 4 teams: Fully judged (3 judges completed)
      for (let jIdx = 0; jIdx < 3; jIdx++) {
        const judge = judges[jIdx]
        const scanTime = new Date(now.getTime() - (25 - jIdx * 5) * 60 * 1000)
        const completeTime = new Date(now.getTime() - (20 - jIdx * 5) * 60 * 1000)
        
        await prisma.judgingAttempt.create({
          data: {
            judgeId: judge.id,
            teamId: team.id,
            roundId: round2.id,
            scannedAt: scanTime,
            completedAt: completeTime,
          },
        })
        
        for (const criterion of round2Criteria) {
          await prisma.score.create({
            data: {
              teamId: team.id,
              roundId: round2.id,
              judgeId: judge.id,
              criterionId: criterion.id,
              value: 3 + Math.floor(Math.random() * 3),
            },
          })
        }
      }
    } else if (i < 7) {
      // 3 teams: Partially judged (only 2 judges, waiting for 3rd)
      for (let jIdx = 0; jIdx < 2; jIdx++) {
        const judge = judges[jIdx]
        const scanTime = new Date(now.getTime() - (15 - jIdx * 5) * 60 * 1000)
        const completeTime = new Date(now.getTime() - (10 - jIdx * 5) * 60 * 1000)
        
        await prisma.judgingAttempt.create({
          data: {
            judgeId: judge.id,
            teamId: team.id,
            roundId: round2.id,
            scannedAt: scanTime,
            completedAt: completeTime,
          },
        })
        
        for (const criterion of round2Criteria) {
          await prisma.score.create({
            data: {
              teamId: team.id,
              roundId: round2.id,
              judgeId: judge.id,
              criterionId: criterion.id,
              value: 3 + Math.floor(Math.random() * 3),
            },
          })
        }
      }
    }
    // 3 teams (i >= 7): No judging yet (haven't submitted links)
    
    // ROUND 3: No judging yet (round hasn't started)
  }

  console.log('✅ Database seeding completed!')
  console.log('\n📊 Test Data Summary:')
  console.log(`  - Hackathon: ${hackathon.name}`)
  console.log(`  - Slug: ${hackathon.slug}`)
  console.log(`  - Status: ${hackathon.status} (LIVE - timers enabled)`)
  console.log(`  - Teams: ${teamData.length}`)
  console.log(`  - Judges: ${judges.length}`)
  console.log(`  - Problem Statements: ${problems.length}`)
  console.log(`  - Rounds: 3`)
  console.log('\n⏱️  Timer States:')
  console.log(`  - Round 1: EXPIRED (${round1.checkpointTime.toISOString()})`)
  console.log(`  - Round 2: PAUSED (deadline in 30 mins, paused 10 mins ago)`)
  console.log(`  - Round 3: ACTIVE (deadline in 90 mins, running)`)
  console.log('\n🎯 JUDGING-IS-SUBMISSION FLOW:')
  console.log(`  - Round 1: 2 judges required, NO link submission`)
  console.log(`    ✅ 10/10 teams COMPLETED (2+ judges scored each)`)
  console.log(`  - Round 2: 3 judges required, REQUIRES link submission (2-step)`)
  console.log(`    📎 7/10 teams submitted links (STEP 1)`)
  console.log(`    ✅ 4/7 teams COMPLETED judging (3 judges - STEP 2)`)
  console.log(`    ⏳ 3/7 teams need 1 more judge (2/3 judges done)`)
  console.log(`    ❌ 3/10 teams haven't submitted links yet`)
  console.log(`  - Round 3: 1 judge required, NO link submission`)
  console.log(`    ⏳ 0/10 teams judged (round not started)`)
  console.log(
    `\n🔗 Access URLs (assuming local dev on http://localhost:3000):`
  )
  console.log(`  - Public Page: http://localhost:3000/h/${hackathon.slug}`)
  console.log(`  - Display: http://localhost:3000/h/${hackathon.slug}/display`)
  console.log(`  - Dashboard: http://localhost:3000/h/${hackathon.slug}/dashboard`)
  console.log(`  - Manage: http://localhost:3000/h/${hackathon.slug}/manage`)
  console.log(`\n🔑 Test Credentials:`)
  console.log(`  - Judge Tokens: test_judge_token_001 through test_judge_token_005`)
  console.log(`  - Judge Login: http://localhost:3000/h/${hackathon.slug}/judge`)
  console.log(`\n💡 Testing Scenarios:`)
  console.log(`  ✅ Judge QR scanning creates JudgingAttempts (grace period)`)
  console.log(`  ✅ Multi-judge averaging (Round 1: 2 judges, Round 2: 3 judges)`)
  console.log(`  ✅ 2-step flow: Submit links → Get judged (Round 2)`)
  console.log(`  ✅ Participant dashboard shows live judging progress (2/3 judges)`)
  console.log(`  ✅ Display screen shows submission celebrations (socket events)`)
  console.log(`  ✅ Time bonus calculated from Nth judge completion time`)
  console.log(`  ✅ Link submission guard (can't judge until links submitted)`)
  console.log(`  ✅ Organizer can toggle requiresLinkSubmission per round`)
  console.log(`  ✅ Test completing 3rd judge → auto-submission`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
