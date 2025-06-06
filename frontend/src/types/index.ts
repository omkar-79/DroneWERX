// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  joinDate: Date;
  location?: string;
  bio?: string;
  expertise: string[];
  isVerified: boolean;
  stats: UserStats;
  // Military background fields (optional for warfighters)
  serviceBranch?: string;
  yearsOfService?: string;
  deploymentHistory?: string;
  securityClearance?: string;
}

export enum UserRole {
  WARFIGHTER = 'WARFIGHTER',
  INNOVATOR = 'INNOVATOR',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN'
}

export interface UserStats {
  threadsCreated: number;
  solutionsPosted: number;
  commentsPosted: number;
  upvotesReceived: number;
  solutionsAccepted: number;
}

// Thread Types
export interface Thread {
  id: string;
  title: string;
  description: string;
  author: User;
  authorId: string;
  category: Category;
  tags: Tag[];
  urgency: Urgency;
  status: ThreadStatus;
  trlLevel?: TRLLevel;
  domain?: string;
  location?: string;
  deadline?: string;
  isAnonymous: boolean;
  isSticky: boolean;
  isAcceptedSolution: boolean;
  upvotes: number;
  downvotes: number;
  hasUserVoted: 'up' | 'down' | null;
  commentCount: number;
  solutionCount: number;
  viewCount: number;
  hotScore: number;
  bounty?: {
    amount: number;
    description: string;
    deadline?: string;
  };
  attachments: Attachment[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parentId?: string;
  threadCount: number;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  color: string;
  usageCount: number;
}

export enum ThreadStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  SOLVED = 'SOLVED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

export enum Urgency {
  ROUTINE = 'ROUTINE',
  PRIORITY = 'PRIORITY',
  IMMEDIATE = 'IMMEDIATE',
  FLASH = 'FLASH'
}

export enum TRLLevel {
  TRL1 = 'TRL1', // Basic principles observed
  TRL2 = 'TRL2', // Technology concept formulated
  TRL3 = 'TRL3', // Experimental proof of concept
  TRL4 = 'TRL4', // Technology validated in lab
  TRL5 = 'TRL5', // Technology validated in relevant environment
  TRL6 = 'TRL6', // Technology demonstrated in relevant environment
  TRL7 = 'TRL7', // System prototype demonstration
  TRL8 = 'TRL8', // System complete and qualified
  TRL9 = 'TRL9'  // Actual system proven in operational environment
}

// Solution Types
export enum SolutionStatus {
  PENDING = 'pending',
  PASS = 'pass',
  FAIL = 'fail',
  APPROVED = 'approved'
}

export interface Solution {
  id: string;
  threadId: string;
  author: User;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
  upvotes: number;
  downvotes: number;
  hasUserVoted: 'up' | 'down' | null;
  isAccepted: boolean;
  status: SolutionStatus;
  statusUpdatedBy?: string;
  statusUpdatedAt?: Date;
  statusNote?: string;
  attachments: Attachment[];
  mediaAttachments?: {
    images: string[];
    videos: string[];
    documents: string[];
  };
  technicalSpecs?: {
    hardware?: string[];
    software?: string[];
    requirements?: string[];
    estimatedCost?: number;
    implementationTime?: string;
    trlLevel?: TRLLevel;
  };
  comments: Comment[];
  thread: {
    id: string;
    title: string;
    status: ThreadStatus;
  };
}

export interface TechnicalSpecification {
  id: string;
  name: string;
  value: string;
  unit?: string;
  description?: string;
}

export interface ImplementationStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime?: string;
  requiredResources?: string[];
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  mitigation: string[];
}

// Comment Types
export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  hasUserVoted: 'up' | 'down' | null;
  parentId?: string; // For nested replies
  replies?: Comment[];
  isEdited?: boolean;
  editedAt?: Date;
}

// Attachment Types
export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  isImage: boolean;
  isDocument: boolean;
  isVideo: boolean;
}

// Bounty Types
export interface Bounty {
  id: string;
  amount: number;
  currency: string;
  description: string;
  deadline?: Date;
  isActive: boolean;
  winnerId?: string;
  createdBy: string;
  createdAt: Date;
}

// Vote Types
export interface Vote {
  id: string;
  userId: string;
  targetId: string; // thread, solution, or comment ID
  targetType: 'thread' | 'solution' | 'comment';
  voteType: 'upvote' | 'downvote';
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export enum NotificationType {
  NEW_SOLUTION = 'new_solution',
  SOLUTION_ACCEPTED = 'solution_accepted',
  COMMENT_REPLY = 'comment_reply',
  THREAD_UPDATE = 'thread_update',
  BOUNTY_AWARDED = 'bounty_awarded',
  BADGE_EARNED = 'badge_earned',
  MENTION = 'mention'
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  categories?: string[];
  tags?: string[];
  statuses?: ThreadStatus[];
  urgencies?: Urgency[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  authorRole?: UserRole;
  hasAcceptedSolution?: boolean;
  hasBounty?: boolean;
  minUpvotes?: number;
  location?: string;
}

export interface SortOption {
  field: 'createdAt' | 'updatedAt' | 'hotScore' | 'upvotes' | 'views' | 'solutionCount';
  direction: 'asc' | 'desc';
  label: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Component Props Types
export interface ThreadCardProps {
  thread: Thread;
  onUpvote: (threadId: string) => void;
  onDownvote: (threadId: string) => void;
  onView: (threadId: string) => void;
}

export interface SolutionCardProps {
  solution: Solution;
  onUpvote: (solutionId: string) => void;
  onDownvote: (solutionId: string) => void;
  onAccept: (solutionId: string) => void;
  canAccept: boolean;
}

// Form Types
export interface CreateThreadForm {
  title: string;
  description: string;
  category: string;
  tags: string[];
  urgency: Urgency;
  location?: string;
  attachments: File[];
  bountyAmount?: number;
}

export interface CreateSolutionForm {
  content: string;
  attachments: File[];
  techSpecs: TechnicalSpecification[];
  implementationSteps: ImplementationStep[];
  estimatedCost?: number;
  estimatedTime?: string;
  riskAssessment?: RiskAssessment;
}

export interface ThreadActivity {
  id: string;
  type: 'solution_added' | 'comment_added' | 'thread_updated' | 'solution_accepted' | 'bounty_awarded';
  author: User;
  timestamp: Date;
  description: string;
  metadata?: Record<string, any>;
} 