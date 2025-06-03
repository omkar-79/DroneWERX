import { formatDistanceToNow, format } from 'date-fns';
import type { Thread, SearchFilters, SortOption, Priority, Urgency, Classification, ThreadStatus } from '../types';

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
export const getPriorityColor = (priority: Priority): string => {
  switch (priority) {
    case 'critical':
      return 'var(--error-500)';
    case 'high':
      return 'var(--warning-500)';
    case 'medium':
      return 'var(--info-500)';
    case 'low':
      return 'var(--success-500)';
    default:
      return 'var(--gray-500)';
  }
};

export const getUrgencyColor = (urgency: Urgency): string => {
  switch (urgency) {
    case 'flash':
      return 'var(--error-600)';
    case 'immediate':
      return 'var(--error-500)';
    case 'priority':
      return 'var(--warning-500)';
    case 'routine':
      return 'var(--gray-500)';
    default:
      return 'var(--gray-500)';
  }
};

export const getClassificationColor = (classification: Classification): string => {
  switch (classification) {
    case 'confidential':
      return 'var(--error-500)';
    case 'restricted':
      return 'var(--warning-500)';
    case 'public':
      return 'var(--success-500)';
    default:
      return 'var(--gray-500)';
  }
};

export const getStatusColor = (status: ThreadStatus): string => {
  switch (status) {
    case 'open':
      return 'var(--primary-500)';
    case 'in_progress':
      return 'var(--warning-500)';
    case 'solved':
      return 'var(--success-500)';
    case 'closed':
      return 'var(--gray-500)';
    case 'archived':
      return 'var(--gray-400)';
    default:
      return 'var(--gray-500)';
  }
};

// Search and filter utilities
export const filterThreads = (threads: Thread[], filters: SearchFilters): Thread[] => {
  return threads.filter(thread => {
    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const searchableText = [
        thread.title,
        thread.description,
        thread.author.fullName,
        thread.author.username,
        ...thread.tags.map(tag => tag.name),
        thread.category.name
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) {
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

    // Priority filter
    if (filters.priorities && filters.priorities.length > 0) {
      if (!filters.priorities.includes(thread.priority)) {
        return false;
      }
    }

    // Status filter
    if (filters.statuses && filters.statuses.length > 0) {
      if (!filters.statuses.includes(thread.status)) {
        return false;
      }
    }

    // Classification filter
    if (filters.classifications && filters.classifications.length > 0) {
      if (!filters.classifications.includes(thread.classification)) {
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
      const threadDate = thread.createdAt;
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

    // Has accepted solution filter
    if (filters.hasAcceptedSolution !== undefined) {
      if (thread.isAcceptedSolution !== filters.hasAcceptedSolution) {
        return false;
      }
    }

    // Has bounty filter
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
      const location = filters.location.toLowerCase();
      const threadLocation = thread.location?.toLowerCase() || '';
      if (!threadLocation.includes(location)) {
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
        aValue = a[sortOption.field].getTime();
        bValue = b[sortOption.field].getTime();
        break;
      case 'hotScore':
      case 'upvotes':
      case 'views':
      case 'solutionCount':
        aValue = a[sortOption.field];
        bValue = b[sortOption.field];
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