import type { 
  User, 
  Thread, 
  Solution, 
  Category, 
  Tag, 
  Badge,
  Comment,
  Bounty
} from '../types';
import { 
  UserRole, 
  Priority, 
  ThreadStatus, 
  Classification, 
  Urgency
} from '../types';

// Mock Badges
export const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'Problem Solver',
    description: 'Solved 10 drone challenges',
    icon: 'target',
    color: 'var(--success-500)',
    rarity: 'common'
  },
  {
    id: '2',
    name: 'Innovation Leader',
    description: 'Posted 50 innovative solutions',
    icon: 'lightbulb',
    color: 'var(--warning-500)',
    rarity: 'rare'
  },
  {
    id: '3',
    name: 'Combat Veteran',
    description: 'Verified warfighter with field experience',
    icon: 'shield',
    color: 'var(--primary-600)',
    rarity: 'epic'
  }
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'warfighter_alpha',
    email: 'alpha@usdrone.mil',
    fullName: 'Captain Sarah Mitchell',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b8cc?w=100&h=100&fit=crop&crop=face',
    role: UserRole.WARFIGHTER,
    reputation: 2450,
    badges: [mockBadges[2]],
    joinDate: new Date('2023-01-15'),
    location: 'Fort Bragg, NC',
    bio: 'Special Operations drone pilot with 8 years of field experience in various theaters.',
    expertise: ['Combat Operations', 'Reconnaissance', 'Electronic Warfare'],
    isVerified: true,
    stats: {
      threadsCreated: 15,
      solutionsPosted: 3,
      commentsPosted: 45,
      upvotesReceived: 234,
      solutionsAccepted: 2
    }
  },
  {
    id: '2',
    username: 'tech_innovator',
    email: 'innovator@dronetech.com',
    fullName: 'Dr. Marcus Chen',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    role: UserRole.INNOVATOR,
    reputation: 3200,
    badges: [mockBadges[0], mockBadges[1]],
    joinDate: new Date('2022-11-20'),
    location: 'Austin, TX',
    bio: 'Aerospace engineer specializing in autonomous systems and AI-driven drone technologies.',
    expertise: ['AI/ML', 'Autonomous Systems', 'Hardware Design', 'Signal Processing'],
    isVerified: true,
    stats: {
      threadsCreated: 8,
      solutionsPosted: 47,
      commentsPosted: 156,
      upvotesReceived: 892,
      solutionsAccepted: 23
    }
  },
  {
    id: '3',
    username: 'field_commander',
    email: 'commander@usdrone.mil',
    fullName: 'Major John Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    role: UserRole.WARFIGHTER,
    reputation: 1890,
    badges: [mockBadges[2]],
    joinDate: new Date('2023-03-10'),
    location: 'MacDill AFB, FL',
    bio: 'Combat veteran leading drone operations in joint military exercises.',
    expertise: ['Squad Tactics', 'ISR Operations', 'Mission Planning'],
    isVerified: true,
    stats: {
      threadsCreated: 12,
      solutionsPosted: 7,
      commentsPosted: 38,
      upvotesReceived: 145,
      solutionsAccepted: 3
    }
  }
];

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Reconnaissance & Surveillance',
    description: 'ISR missions, target identification, and surveillance challenges',
    icon: 'eye',
    color: 'var(--primary-500)',
    threadCount: 42
  },
  {
    id: '2',
    name: 'Combat Operations',
    description: 'Tactical deployment, weapons systems, and combat scenarios',
    icon: 'crosshair',
    color: 'var(--error-500)',
    threadCount: 38
  },
  {
    id: '3',
    name: 'Electronic Warfare',
    description: 'Signal jamming, cyber defense, and electronic countermeasures',
    icon: 'radio',
    color: 'var(--warning-500)',
    threadCount: 25
  },
  {
    id: '4',
    name: 'Navigation & GPS',
    description: 'GPS-denied environments, navigation systems, and positioning',
    icon: 'navigation',
    color: 'var(--info-500)',
    threadCount: 31
  },
  {
    id: '5',
    name: 'Hardware & Maintenance',
    description: 'Equipment failures, maintenance, and hardware modifications',
    icon: 'wrench',
    color: 'var(--secondary-600)',
    threadCount: 29
  },
  {
    id: '6',
    name: 'Software & AI',
    description: 'Autonomous systems, AI integration, and software challenges',
    icon: 'cpu',
    color: 'var(--accent-purple)',
    threadCount: 34
  }
];

// Mock Tags
export const mockTags: Tag[] = [
  { id: '1', name: 'urgent', color: 'var(--error-500)', usageCount: 45 },
  { id: '2', name: 'gps-denied', color: 'var(--warning-500)', usageCount: 32 },
  { id: '3', name: 'autonomous', color: 'var(--accent-purple)', usageCount: 28 },
  { id: '4', name: 'surveillance', color: 'var(--primary-500)', usageCount: 67 },
  { id: '5', name: 'combat-proven', color: 'var(--error-600)', usageCount: 23 },
  { id: '6', name: 'cost-effective', color: 'var(--success-500)', usageCount: 19 },
  { id: '7', name: 'real-time', color: 'var(--info-500)', usageCount: 41 },
  { id: '8', name: 'weather-resistant', color: 'var(--secondary-500)', usageCount: 15 }
];

// Mock Bounties
export const mockBounties: Bounty[] = [
  {
    id: '1',
    amount: 5000,
    currency: 'USD',
    description: 'Critical solution needed for GPS-denied navigation',
    deadline: new Date('2024-02-15'),
    isActive: true,
    createdBy: '1',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    amount: 2500,
    currency: 'USD',
    description: 'Innovative battery life extension solution',
    deadline: new Date('2024-02-28'),
    isActive: true,
    createdBy: '3',
    createdAt: new Date('2024-01-20')
  }
];

// Mock Threads
export const mockThreads: Thread[] = [
  {
    id: '1',
    title: 'GPS-Denied Navigation Solution for Urban Combat Operations',
    description: 'Our unit is operating in a GPS-denied environment where traditional navigation systems fail. We need reliable alternatives for drone navigation in urban combat scenarios with heavy electronic interference. The environment includes multi-story buildings, underground passages, and active jamming equipment.',
    authorId: '1',
    author: mockUsers[0],
    category: mockCategories[3],
    tags: [mockTags[0], mockTags[1], mockTags[4]],
    priority: Priority.CRITICAL,
    status: ThreadStatus.OPEN,
    classification: Classification.RESTRICTED,
    location: 'Urban Theater - CLASSIFIED',
    urgency: Urgency.IMMEDIATE,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-20T14:22:00Z'),
    views: 156,
    upvotes: 23,
    downvotes: 2,
    solutionCount: 7,
    commentCount: 15,
    isAcceptedSolution: false,
    attachments: [],
    hotScore: 89.5,
    isSticky: true,
    isClosed: false,
    bounty: mockBounties[0]
  },
  {
    id: '2',
    title: 'AI-Powered Target Recognition in Low-Light Conditions',
    description: 'Need assistance with improving target recognition accuracy during night operations. Current AI models struggle with thermal imaging data and low-light environments. Looking for machine learning solutions that can differentiate between civilians and combatants in urban settings.',
    authorId: '3',
    author: mockUsers[2],
    category: mockCategories[0],
    tags: [mockTags[2], mockTags[3], mockTags[6]],
    priority: Priority.HIGH,
    status: ThreadStatus.IN_PROGRESS,
    classification: Classification.RESTRICTED,
    location: 'Middle East Theater',
    urgency: Urgency.PRIORITY,
    createdAt: new Date('2024-01-18T08:15:00Z'),
    updatedAt: new Date('2024-01-22T16:45:00Z'),
    views: 234,
    upvotes: 45,
    downvotes: 3,
    solutionCount: 12,
    commentCount: 28,
    isAcceptedSolution: true,
    acceptedSolutionId: 'sol_2_1',
    attachments: [],
    hotScore: 92.1,
    isSticky: false,
    isClosed: false
  },
  {
    id: '3',
    title: 'Drone Swarm Coordination Under Electronic Jamming',
    description: 'Looking for solutions to maintain drone swarm coordination when facing heavy electronic warfare attacks. Current communication protocols fail when enemy forces deploy wide-spectrum jammers. Need redundant communication methods.',
    authorId: '1',
    author: mockUsers[0],
    category: mockCategories[2],
    tags: [mockTags[0], mockTags[2], mockTags[4]],
    priority: Priority.HIGH,
    status: ThreadStatus.OPEN,
    classification: Classification.CONFIDENTIAL,
    location: 'Pacific Theater',
    urgency: Urgency.PRIORITY,
    createdAt: new Date('2024-01-20T12:00:00Z'),
    updatedAt: new Date('2024-01-21T09:30:00Z'),
    views: 89,
    upvotes: 18,
    downvotes: 1,
    solutionCount: 4,
    commentCount: 11,
    isAcceptedSolution: false,
    attachments: [],
    hotScore: 76.3,
    isSticky: false,
    isClosed: false
  },
  {
    id: '4',
    title: 'Extended Battery Life for Long-Duration Reconnaissance Missions',
    description: 'Our reconnaissance missions require 8-12 hour flight times, but current battery technology limits us to 4-6 hours. Seeking innovative power solutions, including solar, fuel cells, or advanced battery chemistry.',
    authorId: '3',
    author: mockUsers[2],
    category: mockCategories[4],
    tags: [mockTags[5], mockTags[3]],
    priority: Priority.MEDIUM,
    status: ThreadStatus.OPEN,
    classification: Classification.PUBLIC,
    location: 'Various Theaters',
    urgency: Urgency.ROUTINE,
    createdAt: new Date('2024-01-19T14:20:00Z'),
    updatedAt: new Date('2024-01-21T11:15:00Z'),
    views: 178,
    upvotes: 32,
    downvotes: 4,
    solutionCount: 9,
    commentCount: 22,
    isAcceptedSolution: false,
    attachments: [],
    hotScore: 68.7,
    isSticky: false,
    isClosed: false,
    bounty: mockBounties[1]
  },
  {
    id: '5',
    title: 'Weather-Resistant Drone Operations in Extreme Conditions',
    description: 'Operating in desert sandstorms and arctic conditions. Current drones fail due to sand infiltration and extreme temperature variations. Need weatherproofing solutions that don\'t compromise performance.',
    authorId: '1',
    author: mockUsers[0],
    category: mockCategories[4],
    tags: [mockTags[7], mockTags[4]],
    priority: Priority.MEDIUM,
    status: ThreadStatus.SOLVED,
    classification: Classification.PUBLIC,
    location: 'Desert & Arctic Theaters',
    urgency: Urgency.ROUTINE,
    createdAt: new Date('2024-01-10T09:45:00Z'),
    updatedAt: new Date('2024-01-18T13:20:00Z'),
    views: 145,
    upvotes: 28,
    downvotes: 2,
    solutionCount: 6,
    commentCount: 19,
    isAcceptedSolution: true,
    acceptedSolutionId: 'sol_5_1',
    attachments: [],
    hotScore: 45.2,
    isSticky: false,
    isClosed: false
  }
];

// Mock Solutions
export const mockSolutions: Solution[] = [
  {
    id: 'sol_2_1',
    threadId: '2',
    authorId: '2',
    author: mockUsers[1],
    content: 'I\'ve developed a hybrid AI model that combines thermal imaging with LiDAR data for improved target recognition. The solution uses a multi-modal neural network trained on diverse datasets including various lighting conditions and thermal signatures.',
    upvotes: 34,
    downvotes: 2,
    createdAt: new Date('2024-01-19T10:30:00Z'),
    updatedAt: new Date('2024-01-20T15:45:00Z'),
    isAccepted: true,
    attachments: [],
    comments: [],
    commentCount: 8,
    techSpecs: [
      {
        id: 'ts_1',
        name: 'Accuracy',
        value: '94.5',
        unit: '%',
        description: 'Target recognition accuracy in low-light conditions'
      },
      {
        id: 'ts_2',
        name: 'Processing Time',
        value: '150',
        unit: 'ms',
        description: 'Real-time processing latency'
      }
    ],
    implementationSteps: [
      {
        id: 'is_1',
        stepNumber: 1,
        title: 'Data Collection',
        description: 'Gather thermal and LiDAR training data from various environments',
        estimatedTime: '2 weeks',
        requiredResources: ['Thermal cameras', 'LiDAR sensors', 'Data storage']
      },
      {
        id: 'is_2',
        stepNumber: 2,
        title: 'Model Training',
        description: 'Train the multi-modal neural network using collected data',
        estimatedTime: '3 weeks',
        requiredResources: ['GPU cluster', 'ML frameworks', 'Training data']
      }
    ],
    estimatedCost: 75000,
    estimatedTime: '6-8 weeks',
    feasibilityScore: 85,
    riskAssessment: {
      level: 'medium',
      factors: ['Requires extensive training data', 'Hardware compatibility'],
      mitigation: ['Phased rollout', 'Compatibility testing', 'Fallback systems']
    }
  }
];

// Mock Comments
export const mockComments: Comment[] = [
  {
    id: 'comment_1',
    content: 'This looks promising! Have you tested this in actual field conditions?',
    authorId: '1',
    author: mockUsers[0],
    threadId: '2',
    solutionId: 'sol_2_1',
    upvotes: 5,
    downvotes: 0,
    createdAt: new Date('2024-01-20T08:30:00Z'),
    updatedAt: new Date('2024-01-20T08:30:00Z'),
    isEdited: false,
    attachments: [],
    replies: []
  },
  {
    id: 'comment_2',
    content: 'We conducted tests in simulated environments with 94.5% accuracy. Field testing is scheduled for next month.',
    authorId: '2',
    author: mockUsers[1],
    parentId: 'comment_1',
    threadId: '2',
    solutionId: 'sol_2_1',
    upvotes: 8,
    downvotes: 0,
    createdAt: new Date('2024-01-20T10:15:00Z'),
    updatedAt: new Date('2024-01-20T10:15:00Z'),
    isEdited: false,
    attachments: [],
    replies: []
  }
];

// Hot Score Calculation (simplified)
export const calculateHotScore = (thread: Thread): number => {
  const ageInHours = (Date.now() - thread.createdAt.getTime()) / (1000 * 60 * 60);
  const score = (thread.upvotes * 2 + thread.solutionCount * 5 + thread.views * 0.1) / Math.pow(ageInHours + 2, 1.5);
  return Math.round(score * 10) / 10;
};

// Update hot scores
mockThreads.forEach(thread => {
  thread.hotScore = calculateHotScore(thread);
}); 