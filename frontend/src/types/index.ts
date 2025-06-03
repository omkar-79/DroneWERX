// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  reputation: number;
  badges: Badge[];
  joinDate: Date;
  location?: string;
  bio?: string;
  expertise: string[];
  isVerified: boolean;
  stats: UserStats;
}

export enum UserRole {
  WARFIGHTER = 'warfighter',
  INNOVATOR = 'innovator',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

export interface UserStats {
  threadsCreated: number;
  solutionsPosted: number;
  commentsPosted: number;
  upvotesReceived: number;
  solutionsAccepted: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Thread Types
export interface Thread {
  id: string;
  title: string;
  description: string;
  authorId: string;
  author: User;
  category: Category;
  tags: Tag[];
  priority: Priority;
  status: ThreadStatus;
  classification: Classification;
  location?: string;
  urgency: Urgency;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  upvotes: number;
  downvotes: number;
  solutionCount: number;
  commentCount: number;
  isAcceptedSolution: boolean;
  acceptedSolutionId?: string;
  attachments: Attachment[];
  hotScore: number;
  isSticky: boolean;
  isClosed: boolean;
  bounty?: Bounty;
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

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ThreadStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  SOLVED = 'solved',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

export enum Classification {
  PUBLIC = 'public',
  RESTRICTED = 'restricted',
  CONFIDENTIAL = 'confidential'
}

export enum Urgency {
  ROUTINE = 'routine',
  PRIORITY = 'priority',
  IMMEDIATE = 'immediate',
  FLASH = 'flash'
}

// Solution Types
export interface Solution {
  id: string;
  threadId: string;
  authorId: string;
  author: User;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  updatedAt: Date;
  isAccepted: boolean;
  attachments: Attachment[];
  comments: Comment[];
  commentCount: number;
  techSpecs?: TechnicalSpecification[];
  implementationSteps?: ImplementationStep[];
  estimatedCost?: number;
  estimatedTime?: string;
  feasibilityScore: number;
  riskAssessment?: RiskAssessment;
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
  content: string;
  authorId: string;
  author: User;
  parentId?: string; // For nested comments
  threadId?: string;
  solutionId?: string;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  attachments: Attachment[];
  replies: Comment[];
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
  priorities?: Priority[];
  statuses?: ThreadStatus[];
  classifications?: Classification[];
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
  priority: Priority;
  classification: Classification;
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