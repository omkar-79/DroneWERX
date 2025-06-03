import type { 
  User, 
  Thread, 
  Solution, 
  Category, 
  Tag, 
  Comment,
  Bounty,
  ThreadActivity
} from '../types';
import { 
  UserRole, 
  Priority, 
  ThreadStatus, 
  Urgency,
  TRLLevel,
  SolutionStatus
} from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'warfighter_alpha',
    email: 'alpha@usdrone.mil',
    fullName: 'Captain Sarah Mitchell',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b8cc?w=100&h=100&fit=crop&crop=face',
    role: UserRole.WARFIGHTER,
    joinDate: new Date('2023-01-15'),
    location: 'Fort Bragg, NC',
    bio: 'Special Operations drone pilot with 8 years of field experience in various theaters.',
    expertise: ['Combat Operations', 'Reconnaissance', 'Electronic Warfare'],
    isVerified: true,
    serviceBranch: 'U.S. Army Special Operations',
    yearsOfService: '8 Years',
    deploymentHistory: 'Afghanistan, Iraq, Syria',
    securityClearance: 'Secret',
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
    joinDate: new Date('2023-03-10'),
    location: 'MacDill AFB, FL',
    bio: 'Combat veteran leading drone operations in joint military exercises.',
    expertise: ['Squad Tactics', 'ISR Operations', 'Mission Planning'],
    isVerified: true,
    serviceBranch: 'U.S. Air Force',
    yearsOfService: '12 Years',
    deploymentHistory: 'Iraq, Afghanistan, Eastern Europe',
    securityClearance: 'Top Secret',
    stats: {
      threadsCreated: 12,
      solutionsPosted: 7,
      commentsPosted: 38,
      upvotesReceived: 145,
      solutionsAccepted: 3
    }
  },
  {
    id: '4',
    username: 'admin_moderator',
    email: 'moderator@usdrone.mil',
    fullName: 'Colonel Lisa Chen',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
    role: UserRole.MODERATOR,
    joinDate: new Date('2022-08-15'),
    location: 'Pentagon, VA',
    bio: 'Senior moderator and administrator overseeing platform operations, solution validation, and user management. 15+ years experience in military technology assessment.',
    expertise: ['Platform Management', 'Solution Validation', 'User Administration', 'Quality Assurance', 'Technology Assessment'],
    isVerified: true,
    stats: {
      threadsCreated: 5,
      solutionsPosted: 12,
      commentsPosted: 189,
      upvotesReceived: 456,
      solutionsAccepted: 8
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
    title: 'GPS-Denied Navigation for Urban Combat Environments',
    description: 'Our current drones lose GPS signal in dense urban environments. Need alternative navigation systems that can operate without satellite connectivity. Must be lightweight and battery efficient.',
    authorId: '1',
    author: mockUsers[0],
    category: mockCategories[3], // Navigation & GPS
    tags: [mockTags[1], mockTags[6]], // gps-denied, real-time
    priority: Priority.CRITICAL,
    status: ThreadStatus.OPEN,
    urgency: Urgency.IMMEDIATE,
    trlLevel: TRLLevel.TRL4,
    domain: 'Urban Operations',
    location: 'Urban Combat Training Center',
    createdAt: new Date('2024-01-10T08:30:00Z'),
    updatedAt: new Date('2024-01-12T14:22:00Z'),
    views: 234,
    upvotes: 45,
    downvotes: 3,
    solutionCount: 8,
    commentCount: 23,
    isAcceptedSolution: false,
    attachments: [],
    hotScore: 78,
    isSticky: true,
    isClosed: false,
    bounty: mockBounties[0]
  },
  {
    id: '2',
    title: 'Weather-Resistant Drone Operations in Extreme Conditions',
    description: 'Operating in desert sandstorms and arctic conditions. Current drones fail due to sand infiltration and extreme temperature variations. Need weatherproof solutions that maintain operational capability.',
    authorId: '1',
    author: mockUsers[0],
    category: mockCategories[4], // Hardware & Maintenance
    tags: [mockTags[7], mockTags[4]], // weather-resistant, combat-proven
    priority: Priority.MEDIUM,
    status: ThreadStatus.SOLVED,
    urgency: Urgency.ROUTINE,
    trlLevel: TRLLevel.TRL6,
    domain: 'Desert & Arctic Theaters',
    location: 'Desert & Arctic Testing Facility',
    createdAt: new Date('2024-01-08T10:15:00Z'),
    updatedAt: new Date('2024-01-15T16:45:00Z'),
    views: 145,
    upvotes: 26,
    downvotes: 1,
    solutionCount: 6,
    commentCount: 19,
    isAcceptedSolution: true,
    acceptedSolutionId: '1',
    attachments: [],
    hotScore: 42,
    isSticky: false,
    isClosed: false
  },
  {
    id: '3',
    title: 'Autonomous Swarm Coordination Without Central Command',
    description: 'Deploy multiple drones that can coordinate autonomously when communication with base is compromised. Need mesh networking and AI decision-making capabilities.',
    authorId: '3',
    author: mockUsers[2],
    category: mockCategories[5], // Software & AI
    tags: [mockTags[2], mockTags[6]], // autonomous, real-time
    priority: Priority.HIGH,
    status: ThreadStatus.IN_PROGRESS,
    urgency: Urgency.PRIORITY,
    trlLevel: TRLLevel.TRL3,
    domain: 'Swarm Operations',
    location: 'Joint Forces Training Base',
    createdAt: new Date('2024-01-12T14:20:00Z'),
    updatedAt: new Date('2024-01-14T09:33:00Z'),
    views: 189,
    upvotes: 34,
    downvotes: 2,
    solutionCount: 4,
    commentCount: 15,
    isAcceptedSolution: false,
    attachments: [],
    hotScore: 65,
    isSticky: false,
    isClosed: false
  },
  {
    id: '4',
    title: 'Extended Battery Life for 24-Hour Surveillance Missions',
    description: 'Current battery technology limits our surveillance missions to 4-6 hours. Need solutions for extended flight time while maintaining payload capacity.',
    authorId: '3',
    author: mockUsers[2],
    category: mockCategories[4], // Hardware & Maintenance
    tags: [mockTags[3], mockTags[5]], // surveillance, cost-effective
    priority: Priority.HIGH,
    status: ThreadStatus.OPEN,
    urgency: Urgency.PRIORITY,
    trlLevel: TRLLevel.TRL5,
    domain: 'Surveillance Operations',
    createdAt: new Date('2024-01-14T11:45:00Z'),
    updatedAt: new Date('2024-01-14T11:45:00Z'),
    views: 98,
    upvotes: 18,
    downvotes: 0,
    solutionCount: 3,
    commentCount: 12,
    isAcceptedSolution: false,
    attachments: [],
    hotScore: 38,
    isSticky: false,
    isClosed: false,
    bounty: mockBounties[1]
  },
  {
    id: '5',
    title: 'Electronic Countermeasures Against Enemy Drone Jammers',
    description: 'Enemy forces are using sophisticated jamming equipment to disable our drone communications. Need frequency-hopping or mesh network solutions.',
    authorId: '1',
    author: mockUsers[0],
    category: mockCategories[2], // Electronic Warfare
    tags: [mockTags[0], mockTags[4]], // urgent, combat-proven
    priority: Priority.CRITICAL,
    status: ThreadStatus.OPEN,
    urgency: Urgency.FLASH,
    trlLevel: TRLLevel.TRL7,
    domain: 'Electronic Warfare',
    location: 'Electronic Warfare Training Range',
    createdAt: new Date('2024-01-16T16:30:00Z'),
    updatedAt: new Date('2024-01-16T16:30:00Z'),
    views: 67,
    upvotes: 12,
    downvotes: 1,
    solutionCount: 2,
    commentCount: 8,
    isAcceptedSolution: false,
    attachments: [],
    hotScore: 89,
    isSticky: false,
    isClosed: false
  }
];

// Mock Solutions
export const mockSolutions: Solution[] = [
  {
    id: 'sol-1',
    threadId: '1',
    author: mockUsers[1], // tech_innovator
    content: `
      <h3>Multi-Spectral Reconnaissance Solution</h3>
      <p>I propose a modular sensor package that combines visual, thermal, and multispectral imaging capabilities for comprehensive reconnaissance in urban environments.</p>
      
      <h4>Technical Approach:</h4>
      <ul>
        <li>Primary Camera: Sony IMX686 64MP with optical stabilization</li>
        <li>Thermal Imaging: FLIR Boson 640x512 uncooled microbolometer</li>
        <li>Multispectral: MicaSense RedEdge-P for vegetation analysis</li>
        <li>AI Processing: NVIDIA Jetson Nano for real-time object detection</li>
      </ul>
      
      <h4>Key Features:</h4>
      <ul>
        <li>Real-time target identification using YOLOv8</li>
        <li>Automatic threat identification and prioritization</li>
        <li>Edge computing for reduced latency</li>
        <li>Encrypted data transmission with AES-256</li>
      </ul>
      
      <p>This solution provides 30% better target detection rates compared to single-spectrum systems and reduces false positives by 45%.</p>
    `,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T14:22:00Z'),
    isEdited: true,
    upvotes: 15,
    downvotes: 2,
    hasUserVoted: null,
    isAccepted: true,
    status: SolutionStatus.APPROVED,
    statusUpdatedBy: '1',
    statusUpdatedAt: new Date('2024-01-16T08:00:00Z'),
    statusNote: 'Excellent solution that meets all requirements. Approved for prototype development.',
    attachments: [],
    mediaAttachments: {
      images: [
        'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&h=400',
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=400'
      ],
      videos: ['https://example.com/demo-video.mp4'],
      documents: ['technical-specs.pdf', 'implementation-guide.pdf']
    },
    technicalSpecs: {
      hardware: ['Sony IMX686 Camera', 'FLIR Boson Thermal', 'MicaSense RedEdge-P', 'NVIDIA Jetson Nano'],
      software: ['YOLOv8', 'OpenCV', 'TensorRT', 'Custom ML Pipeline'],
      requirements: ['12V Power Supply', 'Gimbal Mount', 'Data Link > 10Mbps'],
      estimatedCost: 8500,
      implementationTime: '6-8 weeks',
      trlLevel: TRLLevel.TRL7
    },
    comments: []
  },
  {
    id: 'sol-2', 
    threadId: '1',
    author: mockUsers[2], // field_commander
    content: `
      <h3>Lightweight LIDAR Integration</h3>
      <p>Alternative approach using miniaturized LIDAR technology for 3D mapping and obstacle detection.</p>
      
      <h4>System Components:</h4>
      <ul>
        <li>Velodyne Puck Lite - 16 channel LIDAR</li>
        <li>Intel RealSense D455 for close-range depth</li>
        <li>Custom SLAM algorithm for real-time mapping</li>
      </ul>
      
      <p>This solution excels in GPS-denied environments and provides accurate 3D reconstruction.</p>
      
      <h4>Field Test Results:</h4>
      <p>Conducted preliminary tests in urban training facility with 95% accuracy in GPS-denied scenarios.</p>
    `,
    createdAt: new Date('2024-01-16T14:20:00Z'),
    upvotes: 8,
    downvotes: 1,
    hasUserVoted: 'up',
    isAccepted: false,
    status: SolutionStatus.PASS,
    statusUpdatedBy: '1',
    statusUpdatedAt: new Date('2024-01-17T10:30:00Z'),
    statusNote: 'Good concept but needs refinement for field deployment.',
    attachments: [],
    mediaAttachments: {
      images: ['https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400'],
      videos: [],
      documents: ['lidar-specs.pdf']
    },
    technicalSpecs: {
      hardware: ['Velodyne Puck Lite', 'Intel RealSense D455'],
      software: ['Custom SLAM', 'PCL Library', 'ROS2'],
      requirements: ['High-performance compute unit', 'Stable platform'],
      estimatedCost: 12000,
      implementationTime: '10-12 weeks',
      trlLevel: TRLLevel.TRL5
    },
    comments: []
  },
  {
    id: 'sol-3',
    threadId: '2', 
    author: mockUsers[1],
    content: `
      <h3>Redundant Navigation System</h3>
      <p>Multi-modal navigation solution combining GPS, INS, and visual odometry for reliable operation in contested environments.</p>
      
      <h4>Architecture:</h4>
      <ul>
        <li>Primary: Military-grade GPS receiver</li>
        <li>Secondary: High-accuracy IMU with gyroscopes</li>
        <li>Tertiary: Visual-inertial odometry system</li>
        <li>Quaternary: Magnetometer array for heading reference</li>
      </ul>
    `,
    createdAt: new Date('2024-01-17T09:45:00Z'),
    upvotes: 12,
    downvotes: 0,
    hasUserVoted: null,
    isAccepted: false,
    status: SolutionStatus.PENDING,
    attachments: [],
    mediaAttachments: {
      images: [],
      videos: [],
      documents: []
    },
    technicalSpecs: {
      hardware: ['Military GPS', 'Honeywell IMU', 'Stereo Camera'],
      software: ['EKF Fusion', 'ORB-SLAM3', 'Custom Navigation Stack'],
      estimatedCost: 15000,
      implementationTime: '12-16 weeks',
      trlLevel: TRLLevel.TRL6
    },
    comments: []
  }
];

// Mock Comments
export const mockComments: Comment[] = [
  {
    id: 'comment-1',
    author: mockUsers[0], // warfighter_alpha  
    content: 'Excellent solution! The multi-spectral approach addresses our core requirements. Have you tested this in dusty environments?',
    createdAt: new Date('2024-01-15T11:00:00Z'),
    upvotes: 5,
    downvotes: 0,
    hasUserVoted: null,
    replies: [
      {
        id: 'comment-1-1',
        author: mockUsers[1], // innovator_alpha
        content: 'Yes, we conducted field tests in Arizona desert conditions. The system maintained 95% accuracy even with moderate dust levels. The thermal imaging actually helps cut through dust better than visible spectrum.',
        createdAt: new Date('2024-01-15T11:15:00Z'),
        upvotes: 3,
        downvotes: 0,
        hasUserVoted: null,
        parentId: 'comment-1'
      }
    ]
  },
  {
    id: 'comment-2',
    author: mockUsers[2], // tech_innovator
    content: 'Impressive specs on the Sony IMX686. What about power consumption? Battery life is critical for extended missions.',
    createdAt: new Date('2024-01-15T12:30:00Z'),
    upvotes: 4,
    downvotes: 0,
    hasUserVoted: 'up',
    replies: [
      {
        id: 'comment-2-1', 
        author: mockUsers[1],
        content: 'Power optimization was a key focus. Total system draws 8.5W at full operation, giving us 4-5 hours flight time with standard battery. We also implemented adaptive power modes.',
        createdAt: new Date('2024-01-15T13:00:00Z'),
        upvotes: 2,
        downvotes: 0,
        hasUserVoted: null,
        parentId: 'comment-2'
      }
    ]
  },
  {
    id: 'comment-3',
    author: mockUsers[0],
    content: 'This solution has been selected for prototype development. Excellent work team!',
    createdAt: new Date('2024-01-16T08:00:00Z'),
    upvotes: 8,
    downvotes: 0,
    hasUserVoted: null
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

export const mockThreadActivities: ThreadActivity[] = [
  {
    id: 'activity-1',
    type: 'solution_added',
    author: mockUsers[1],
    timestamp: new Date('2024-01-15T10:30:00Z'),
    description: 'added a new solution proposal',
    metadata: { solutionId: 'sol-1' }
  },
  {
    id: 'activity-2',
    type: 'comment_added',
    author: mockUsers[0],
    timestamp: new Date('2024-01-15T11:00:00Z'),
    description: 'commented on the multi-spectral solution',
    metadata: { commentId: 'comment-1' }
  },
  {
    id: 'activity-3',
    type: 'solution_accepted',
    author: mockUsers[0],
    timestamp: new Date('2024-01-16T08:00:00Z'),
    description: 'accepted the multi-spectral reconnaissance solution',
    metadata: { solutionId: 'sol-1' }
  },
  {
    id: 'activity-4',
    type: 'bounty_awarded',
    author: mockUsers[0],
    timestamp: new Date('2024-01-16T08:15:00Z'),
    description: 'awarded the bounty to innovator_alpha',
    metadata: { amount: 5000, recipient: 'innovator_alpha' }
  }
]; 