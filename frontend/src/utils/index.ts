import { formatDistanceToNow, format } from 'date-fns';
import type { Thread, SearchFilters, SortOption } from '../types';
import { Urgency, ThreadStatus, TRLLevel } from '../types';

// Date formatting utilities
export const formatTimeAgo = (date: Date): string => {
  return formatDistanceToNow(date, { addSuffix: true });
};

export const formatDate = (date: Date): string => {
  return format(date, 'MMM dd, yyyy');
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM dd, yyyy HH:mm');
};

// Text formatting utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const highlightSearchText = (text: string, searchQuery: string): string => {
  if (!searchQuery) return text;
  const regex = new RegExp(`(${searchQuery})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// Number formatting utilities
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Priority and urgency utilities
export const getUrgencyColor = (urgency: Urgency): string => {
  switch (urgency) {
    case Urgency.ROUTINE:
      return '#6b7280'; // gray
    case Urgency.PRIORITY:
      return '#3b82f6'; // blue
    case Urgency.IMMEDIATE:
      return '#f59e0b'; // orange
    case Urgency.FLASH:
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

export const getStatusColor = (status: ThreadStatus): string => {
  switch (status) {
    case ThreadStatus.OPEN:
      return '#3b82f6'; // blue
    case ThreadStatus.IN_PROGRESS:
      return '#f59e0b'; // amber
    case ThreadStatus.SOLVED:
      return '#10b981'; // emerald
    case ThreadStatus.CLOSED:
      return '#6b7280'; // gray
    case ThreadStatus.ARCHIVED:
      return '#9ca3af'; // gray
    default:
      return '#3b82f6';
  }
};

export const getTRLColor = (trlLevel: TRLLevel): string => {
  switch (trlLevel) {
    case TRLLevel.TRL1:
    case TRLLevel.TRL2:
    case TRLLevel.TRL3:
      return '#ef4444'; // red
    case TRLLevel.TRL4:
    case TRLLevel.TRL5:
    case TRLLevel.TRL6:
      return '#f59e0b'; // amber
    case TRLLevel.TRL7:
    case TRLLevel.TRL8:
      return '#3b82f6'; // blue
    case TRLLevel.TRL9:
      return '#10b981'; // green
    default:
      return '#6b7280';
  }
};

// Search and filter utilities
export const filterThreads = (threads: Thread[], filters: SearchFilters): Thread[] => {
  return threads.filter(thread => {
    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const searchText = `${thread.title} ${thread.description} ${thread.author.username}`.toLowerCase();
      if (!searchText.includes(query)) {
        return false;
      }
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(thread.category.id)) {
        return false;
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const threadTagIds = thread.tags.map(tag => tag.id);
      if (!filters.tags.some(tagId => threadTagIds.includes(tagId))) {
        return false;
      }
    }

    // Status filter
    if (filters.statuses && filters.statuses.length > 0) {
      if (!filters.statuses.includes(thread.status)) {
        return false;
      }
    }

    // Urgency filter
    if (filters.urgencies && filters.urgencies.length > 0) {
      if (!filters.urgencies.includes(thread.urgency)) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const threadDate = new Date(thread.createdAt);
      if (threadDate < filters.dateRange.from || threadDate > filters.dateRange.to) {
        return false;
      }
    }

    // Author role filter
    if (filters.authorRole) {
      if (thread.author.role !== filters.authorRole) {
        return false;
      }
    }

    // Accepted solution filter
    if (filters.hasAcceptedSolution !== undefined) {
      if (thread.isAcceptedSolution !== filters.hasAcceptedSolution) {
        return false;
      }
    }

    // Bounty filter
    if (filters.hasBounty !== undefined) {
      const hasBounty = !!thread.bounty;
      if (hasBounty !== filters.hasBounty) {
        return false;
      }
    }

    // Minimum upvotes filter
    if (filters.minUpvotes !== undefined) {
      if (thread.upvotes < filters.minUpvotes) {
        return false;
      }
    }

    // Location filter
    if (filters.location) {
      if (!thread.location || !thread.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
};

export const sortThreads = (threads: Thread[], sortOption: SortOption): Thread[] => {
  const sortedThreads = [...threads];
  
  sortedThreads.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortOption.field) {
      case 'createdAt':
      case 'updatedAt':
        aValue = a[sortOption.field] ? new Date(a[sortOption.field] as any).getTime() : 0;
        bValue = b[sortOption.field] ? new Date(b[sortOption.field] as any).getTime() : 0;
        break;
      case 'hotScore':
      case 'upvotes':
      case 'views':
      case 'solutionCount':
        aValue = (a as any)[sortOption.field] ?? 0;
        bValue = (b as any)[sortOption.field] ?? 0;
        break;
      default:
        return 0;
    }

    if (sortOption.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return sortedThreads;
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// File utilities
export const getFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  return imageExtensions.includes(getFileExtension(filename));
};

export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  return videoExtensions.includes(getFileExtension(filename));
};

export const isDocumentFile = (filename: string): boolean => {
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'];
  return documentExtensions.includes(getFileExtension(filename));
};

// URL utilities
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Local storage utilities
export const setLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getLocalStorage = (key: string, defaultValue: any = null): any => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Debounce utility
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Random utilities
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const getRandomColor = (): string => {
  const colors = [
    'var(--primary-500)',
    'var(--secondary-500)',
    'var(--accent-cyan)',
    'var(--accent-emerald)',
    'var(--accent-amber)',
    'var(--accent-orange)',
    'var(--accent-purple)',
    'var(--accent-pink)'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}; 