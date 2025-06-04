import { PrismaClient, UserRole, Priority, ThreadStatus, Urgency, TRLLevel, ClassificationLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.vote.deleteMany();
  await prisma.threadTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.solution.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.bounty.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.threadActivity.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.userStats.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create password hash
  const passwordHash = await bcrypt.hash('DroneWERX2024!', 12);

  // Create Users
  console.log('👥 Creating users...');
  const users = await Promise.all([
    // Warfighters
    prisma.user.create({
      data: {
        username: 'capt_mitchell',
        email: 'capt.mitchell@military.gov',
        fullName: 'Captain Sarah Mitchell',
        role: UserRole.WARFIGHTER,
        passwordHash,
        isVerified: true,
        bio: 'US Army Captain with 8 years of experience in UAV operations and battlefield reconnaissance.',
        location: 'Fort Bragg, NC',
        expertise: ['UAV Operations', 'Reconnaissance', 'Combat Systems', 'Field Operations'],
        serviceBranch: 'US Army',
        yearsOfService: '8 years',
        deploymentHistory: 'Afghanistan (2x), Iraq (1x)',
        securityClearance: 'SECRET',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'
      }
    }),
    
    prisma.user.create({
      data: {
        username: 'lt_rodriguez',
        email: 'lt.rodriguez@navy.mil',
        fullName: 'Lieutenant Carlos Rodriguez',
        role: UserRole.WARFIGHTER,
        passwordHash,
        isVerified: true,
        bio: 'Navy Lieutenant specializing in maritime drone operations and coastal surveillance.',
        location: 'Naval Base San Diego, CA',
        expertise: ['Maritime Operations', 'Surveillance', 'Naval Combat Systems'],
        serviceBranch: 'US Navy',
        yearsOfService: '6 years',
        deploymentHistory: 'Persian Gulf (3x)',
        securityClearance: 'SECRET',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos'
      }
    }),

    // Innovators
    prisma.user.create({
      data: {
        username: 'alex_chen',
        email: 'alex.chen@techcorp.com',
        fullName: 'Dr. Alexandra Chen',
        role: UserRole.INNOVATOR,
        passwordHash,
        isVerified: true,
        bio: 'Senior Robotics Engineer with expertise in autonomous systems and AI-driven navigation.',
        location: 'Silicon Valley, CA',
        expertise: ['Robotics', 'AI/ML', 'Autonomous Systems', 'Computer Vision'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexandra'
      }
    }),

    prisma.user.create({
      data: {
        username: 'mike_thompson',
        email: 'mike.thompson@dronetech.io',
        fullName: 'Michael Thompson',
        role: UserRole.INNOVATOR,
        passwordHash,
        isVerified: true,
        bio: 'Aerospace engineer focused on drone hardware optimization and power systems.',
        location: 'Austin, TX',
        expertise: ['Aerospace Engineering', 'Power Systems', 'Hardware Design', 'Flight Dynamics'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=michael'
      }
    }),

    // Moderator
    prisma.user.create({
      data: {
        username: 'admin_parker',
        email: 'parker@dronewerx.mil',
        fullName: 'Colonel James Parker',
        role: UserRole.MODERATOR,
        passwordHash,
        isVerified: true,
        bio: 'Military liaison and platform moderator with oversight of drone technology initiatives.',
        location: 'Pentagon, VA',
        expertise: ['Military Operations', 'Technology Assessment', 'Program Management'],
        serviceBranch: 'US Air Force',
        yearsOfService: '15 years',
        securityClearance: 'TOP SECRET',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james'
      }
    }),

    // Admin
    prisma.user.create({
      data: {
        username: 'system_admin',
        email: 'admin@dronewerx.gov',
        fullName: 'System Administrator',
        role: UserRole.ADMIN,
        passwordHash,
        isVerified: true,
        bio: 'Platform administrator managing DroneWERX infrastructure and security.',
        location: 'Washington, DC',
        expertise: ['System Administration', 'Cybersecurity', 'Platform Management'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
      }
    })
  ]);

  // Create Categories
  console.log('📁 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Navigation & GPS',
        description: 'GPS-denied navigation, alternative positioning systems, SLAM',
        icon: 'Navigation',
        color: '#3B82F6'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Power & Propulsion',
        description: 'Battery technology, solar power, fuel cells, motor efficiency',
        icon: 'Battery',
        color: '#10B981'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Sensors & Payload',
        description: 'Camera systems, LIDAR, thermal imaging, sensor integration',
        icon: 'Camera',
        color: '#F59E0B'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Communications',
        description: 'Secure communications, mesh networking, signal processing',
        icon: 'Radio',
        color: '#EF4444'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Autonomy & AI',
        description: 'Machine learning, computer vision, autonomous decision making',
        icon: 'Brain',
        color: '#8B5CF6'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Materials & Structure',
        description: 'Lightweight materials, stealth coatings, structural design',
        icon: 'Box',
        color: '#6B7280'
      }
    })
  ]);

  // Create Tags
  console.log('🏷️ Creating tags...');
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'gps-denied', description: 'GPS-denied operations', color: '#3B82F6' } }),
    prisma.tag.create({ data: { name: 'urban-warfare', description: 'Urban combat environments', color: '#DC2626' } }),
    prisma.tag.create({ data: { name: 'stealth', description: 'Low-observable technology', color: '#374151' } }),
    prisma.tag.create({ data: { name: 'battery-life', description: 'Extended flight time solutions', color: '#10B981' } }),
    prisma.tag.create({ data: { name: 'ai-ml', description: 'Artificial intelligence and machine learning', color: '#8B5CF6' } }),
    prisma.tag.create({ data: { name: 'real-time', description: 'Real-time processing requirements', color: '#F59E0B' } }),
    prisma.tag.create({ data: { name: 'secure-comms', description: 'Secure communication protocols', color: '#EF4444' } }),
    prisma.tag.create({ data: { name: 'lightweight', description: 'Weight optimization', color: '#6B7280' } }),
    prisma.tag.create({ data: { name: 'night-ops', description: 'Night operation capabilities', color: '#1F2937' } }),
    prisma.tag.create({ data: { name: 'swarm', description: 'Swarm coordination', color: '#059669' } })
  ]);

  // Create User Stats
  console.log('📊 Creating user statistics...');
  for (const user of users) {
    await prisma.userStats.create({
      data: {
        userId: user.id,
        threadsCreated: Math.floor(Math.random() * 10),
        solutionsPosted: Math.floor(Math.random() * 20),
        commentsPosted: Math.floor(Math.random() * 50),
        upvotesReceived: Math.floor(Math.random() * 100),
        solutionsAccepted: Math.floor(Math.random() * 5)
      }
    });
  }

  // Create Threads
  console.log('💬 Creating threads...');
  const threads = await Promise.all([
    prisma.thread.create({
      data: {
        title: 'GPS-Denied Navigation for Urban Combat Environments',
        description: 'Our current drones lose GPS signal in dense urban environments. Need alternative navigation systems that can operate without satellite connectivity. Must be lightweight and battery efficient.',
        authorId: users[0].id, // capt_mitchell
        categoryId: categories[0].id, // Navigation & GPS
        priority: Priority.CRITICAL,
        status: ThreadStatus.OPEN,
        urgency: Urgency.IMMEDIATE,
        trlLevel: TRLLevel.TRL4,
        domain: 'Urban Operations',
        location: 'Urban Combat Training Center',
        classification: ClassificationLevel.PUBLIC,
        isAnonymous: false,
        views: 234,
        upvotes: 18,
        downvotes: 2,
        solutionCount: 3,
        commentCount: 12,
        hotScore: 85.5
      }
    }),

    prisma.thread.create({
      data: {
        title: 'Extended Battery Life for Long-Range Reconnaissance',
        description: 'Current battery technology limits our reconnaissance missions to 4-6 hours. We need solutions for 12+ hour missions in remote areas without charging infrastructure.',
        authorId: users[1].id, // lt_rodriguez
        categoryId: categories[1].id, // Power & Propulsion
        priority: Priority.HIGH,
        status: ThreadStatus.IN_PROGRESS,
        urgency: Urgency.PRIORITY,
        trlLevel: TRLLevel.TRL3,
        domain: 'Maritime Operations',
        location: 'Pacific Fleet Operations',
        classification: ClassificationLevel.PUBLIC,
        isAnonymous: false,
        views: 156,
        upvotes: 12,
        downvotes: 1,
        solutionCount: 5,
        commentCount: 8,
        hotScore: 72.3
      }
    }),

    prisma.thread.create({
      data: {
        title: 'Stealth Coating for Low-Observable Operations',
        description: 'Seeking advanced materials or coatings that can reduce radar cross-section for covert surveillance missions.',
        authorId: users[0].id, // capt_mitchell
        categoryId: categories[5].id, // Materials & Structure
        priority: Priority.HIGH,
        status: ThreadStatus.OPEN,
        urgency: Urgency.PRIORITY,
        trlLevel: TRLLevel.TRL2,
        domain: 'Special Operations',
        location: 'Classified',
        classification: ClassificationLevel.RESTRICTED,
        isAnonymous: true, // Anonymous posting
        views: 89,
        upvotes: 15,
        downvotes: 0,
        solutionCount: 2,
        commentCount: 6,
        hotScore: 65.8
      }
    }),

    prisma.thread.create({
      data: {
        title: 'AI-Powered Target Recognition in Complex Environments',
        description: 'Need machine learning solutions for real-time target identification that can distinguish between combatants and civilians in urban settings.',
        authorId: users[1].id, // lt_rodriguez
        categoryId: categories[4].id, // Autonomy & AI
        priority: Priority.CRITICAL,
        status: ThreadStatus.OPEN,
        urgency: Urgency.FLASH,
        trlLevel: TRLLevel.TRL5,
        domain: 'Combat Operations',
        location: 'Field Operations Center',
        classification: ClassificationLevel.CONFIDENTIAL,
        isAnonymous: false,
        views: 312,
        upvotes: 28,
        downvotes: 3,
        solutionCount: 7,
        commentCount: 24,
        hotScore: 95.2
      }
    }),

    prisma.thread.create({
      data: {
        title: 'Swarm Coordination for Search and Rescue',
        description: 'Looking for algorithms and communication protocols to coordinate multiple drones in search and rescue operations over large areas.',
        authorId: users[0].id, // capt_mitchell
        categoryId: categories[3].id, // Communications
        priority: Priority.MEDIUM,
        status: ThreadStatus.SOLVED,
        urgency: Urgency.ROUTINE,
        trlLevel: TRLLevel.TRL6,
        domain: 'Humanitarian Operations',
        location: 'Disaster Response Center',
        classification: ClassificationLevel.PUBLIC,
        isAnonymous: false,
        views: 198,
        upvotes: 22,
        downvotes: 1,
        solutionCount: 4,
        commentCount: 15,
        hotScore: 78.9,
        isAcceptedSolution: true
      }
    })
  ]);

  // Create Thread Tags
  console.log('🔗 Creating thread-tag relationships...');
  await Promise.all([
    // GPS-Denied Navigation thread
    prisma.threadTag.create({ data: { threadId: threads[0].id, tagId: tags[0].id } }), // gps-denied
    prisma.threadTag.create({ data: { threadId: threads[0].id, tagId: tags[1].id } }), // urban-warfare
    prisma.threadTag.create({ data: { threadId: threads[0].id, tagId: tags[5].id } }), // real-time

    // Battery Life thread
    prisma.threadTag.create({ data: { threadId: threads[1].id, tagId: tags[3].id } }), // battery-life
    prisma.threadTag.create({ data: { threadId: threads[1].id, tagId: tags[7].id } }), // lightweight

    // Stealth Coating thread
    prisma.threadTag.create({ data: { threadId: threads[2].id, tagId: tags[2].id } }), // stealth
    prisma.threadTag.create({ data: { threadId: threads[2].id, tagId: tags[7].id } }), // lightweight

    // AI Target Recognition thread
    prisma.threadTag.create({ data: { threadId: threads[3].id, tagId: tags[4].id } }), // ai-ml
    prisma.threadTag.create({ data: { threadId: threads[3].id, tagId: tags[5].id } }), // real-time
    prisma.threadTag.create({ data: { threadId: threads[3].id, tagId: tags[1].id } }), // urban-warfare

    // Swarm Coordination thread
    prisma.threadTag.create({ data: { threadId: threads[4].id, tagId: tags[9].id } }), // swarm
    prisma.threadTag.create({ data: { threadId: threads[4].id, tagId: tags[6].id } }), // secure-comms
  ]);

  // Create Solutions
  console.log('💡 Creating solutions...');
  const solutions = await Promise.all([
    prisma.solution.create({
      data: {
        threadId: threads[0].id,
        authorId: users[2].id, // alex_chen
        title: 'SLAM-Based Visual-Inertial Navigation System',
        content: 'I recommend implementing a SLAM-based navigation system using visual-inertial odometry. Our team has developed a lightweight solution that combines stereo cameras with IMU data for robust indoor navigation. The system can operate in GPS-denied environments and has been tested in urban scenarios with 95% accuracy.',
        status: 'PENDING',
        upvotes: 12,
        downvotes: 1,
        estimatedCost: 25000,
        implementationTime: '3-4 months',
        trlLevel: TRLLevel.TRL6
      }
    }),

    prisma.solution.create({
      data: {
        threadId: threads[1].id,
        authorId: users[3].id, // mike_thompson
        title: 'Hybrid Lithium-Sulfur + Fuel Cell Power System',
        content: 'Consider hybrid power systems combining lithium-sulfur batteries with small fuel cells. We\'ve achieved 18-hour flight times in testing with only 15% weight increase. The system automatically switches between power sources based on mission requirements.',
        status: 'APPROVED',
        upvotes: 8,
        downvotes: 0,
        estimatedCost: 35000,
        implementationTime: '6 months',
        trlLevel: TRLLevel.TRL7
      }
    }),

    prisma.solution.create({
      data: {
        threadId: threads[4].id,
        authorId: users[2].id, // alex_chen
        title: 'Distributed Mesh Network Swarm Coordination',
        content: 'Our swarm coordination algorithm uses mesh networking with distributed consensus protocols. Each drone maintains situational awareness through secure peer-to-peer communication. The system scales from 3 to 50+ drones and includes automatic fault tolerance.',
        status: 'APPROVED',
        isAccepted: true,
        upvotes: 18,
        downvotes: 0,
        estimatedCost: 15000,
        implementationTime: '2 months',
        trlLevel: TRLLevel.TRL8
      }
    })
  ]);

  // Update accepted solution for swarm thread
  await prisma.thread.update({
    where: { id: threads[4].id },
    data: { acceptedSolutionId: solutions[2].id }
  });

  // Create Comments
  console.log('💬 Creating comments...');
  await Promise.all([
    prisma.comment.create({
      data: {
        authorId: users[1].id, // lt_rodriguez
        threadId: threads[0].id,
        content: 'This is exactly what we need for urban operations. Have you tested this in environments with heavy electromagnetic interference?'
      }
    }),

    prisma.comment.create({
      data: {
        authorId: users[0].id, // capt_mitchell
        threadId: threads[1].id,
        content: 'Weight increase is acceptable if we can achieve 18+ hour operations. What\'s the maintenance schedule for the fuel cell component?'
      }
    }),

    prisma.comment.create({
      data: {
        authorId: users[4].id, // admin_parker
        threadId: threads[3].id,
        content: 'This solution shows great promise. Recommend fast-tracking for field trials. Please ensure compliance with ROE protocols.'
      }
    })
  ]);

  // Create Bounties
  console.log('💰 Creating bounties...');
  await Promise.all([
    prisma.bounty.create({
      data: {
        threadId: threads[0].id,
        amount: 50000,
        currency: 'USD',
        description: 'Bonus funding for rapid prototype development of GPS-denied navigation system',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        createdBy: users[4].id // admin_parker
      }
    }),

    prisma.bounty.create({
      data: {
        threadId: threads[3].id,
        amount: 75000,
        currency: 'USD',
        description: 'Priority funding for AI target recognition system meeting military standards',
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
        createdBy: users[4].id // admin_parker
      }
    })
  ]);

  // Create some votes
  console.log('👍 Creating votes...');
  await Promise.all([
    prisma.vote.create({
      data: {
        userId: users[1].id,
        targetId: threads[0].id,
        targetType: 'thread',
        type: 'UPVOTE'
      }
    }),
    prisma.vote.create({
      data: {
        userId: users[2].id,
        targetId: solutions[0].id,
        targetType: 'solution',
        type: 'UPVOTE'
      }
    })
  ]);

  console.log('✅ Database seeding completed successfully!');
  
  console.log('\n📊 Seeded data summary:');
  console.log(`👥 Users: ${users.length}`);
  console.log(`📁 Categories: ${categories.length}`);
  console.log(`🏷️ Tags: ${tags.length}`);
  console.log(`💬 Threads: ${threads.length}`);
  console.log(`💡 Solutions: ${solutions.length}`);
  console.log('💰 Bounties: 2');
  
  console.log('\n🔐 Test Accounts:');
  console.log('Warfighter: capt_mitchell / DroneWERX2024!');
  console.log('Innovator: alex_chen / DroneWERX2024!');
  console.log('Moderator: admin_parker / DroneWERX2024!');
  console.log('Admin: system_admin / DroneWERX2024!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 