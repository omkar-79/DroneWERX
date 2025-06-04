import type {
  Thread,
  Solution,
  Comment,
  User,
  Category,
  Tag,
  Priority,
  Urgency,
  TRLLevel,
  SolutionStatus,
  ThreadStatus
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  const token = localStorage.getItem('accessToken');
  console.log('Retrieved token:', token ? `${token.substring(0, 20)}...` : 'null');
  return token;
};

// Helper function to check if user is authenticated
const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) {
    console.warn('No authentication token found');
    return false;
  }

  try {
    // Basic JWT structure check (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid token format');
      return false;
    }

    // Check if token is expired (basic check)
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < currentTime) {
      console.warn('Token has expired');
      localStorage.removeItem('accessToken'); // Remove expired token
      return false;
    }

    console.log('Token appears valid, expires at:', new Date(payload.exp * 1000));
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

// Helper function to make authenticated requests
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  // Check authentication before making request
  if (!isAuthenticated()) {
    throw new Error('Authentication required. Please log in again.');
  }

  const token = getAuthToken();

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
    console.log('Making authenticated request to:', `${API_BASE_URL}${url}`);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

    // Log detailed error information for debugging
    console.error('API Error:', {
      url: `${API_BASE_URL}${url}`,
      status: response.status,
      statusText: response.statusText,
      errorData,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });

    // Handle specific auth errors
    if (response.status === 401) {
      localStorage.removeItem('accessToken'); // Remove invalid token
      throw new Error('Authentication failed. Please log in again.');
    }

    // Show detailed validation errors if available
    if (errorData.details && Array.isArray(errorData.details)) {
      const validationErrors = errorData.details.map((detail: any) =>
        `${detail.path?.join('.')}: ${detail.message}`
      ).join(', ');
      throw new Error(`Validation failed: ${validationErrors}`);
    }

    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Authentication API
export const authAPI = {
  login: async (usernameOrEmail: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    return response.json();
  },

  register: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    return response.json();
  },

  getProfile: async () => {
    return authenticatedFetch('/auth/profile');
  },

  updateProfile: async (profileData: Partial<User>) => {
    return authenticatedFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  logout: async () => {
    return authenticatedFetch('/auth/logout', { method: 'POST' });
  },
};

// Threads API
export const threadsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    tags?: string[];
    priority?: Priority;
    status?: ThreadStatus;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(key, item));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }

    const queryString = searchParams.toString();
    return authenticatedFetch(`/threads${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id: string) => {
    return authenticatedFetch(`/threads/${id}`);
  },

  create: async (threadData: {
    title: string;
    description: string;
    categoryId: string;
    tags: string[];
    priority: Priority;
    urgency: Urgency;
    trlLevel?: TRLLevel;
    domain?: string;
    location?: string;
    deadline?: string;
    isAnonymous?: boolean;
    bountyAmount?: number;
    bountyDescription?: string;
    bountyDeadline?: string;
  }) => {
    return authenticatedFetch('/threads', {
      method: 'POST',
      body: JSON.stringify(threadData),
    });
  },

  update: async (id: string, threadData: Partial<Thread>) => {
    return authenticatedFetch(`/threads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(threadData),
    });
  },

  delete: async (id: string) => {
    return authenticatedFetch(`/threads/${id}`, { method: 'DELETE' });
  },

  vote: async (id: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    return authenticatedFetch(`/threads/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type: voteType }),
    });
  },

  toggleBookmark: async (id: string) => {
    return authenticatedFetch(`/threads/${id}/bookmark`, { method: 'POST' });
  },

  getActivities: async (id: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return authenticatedFetch(`/threads/${id}/activities${queryString ? `?${queryString}` : ''}`);
  },
};

// Solutions API
export const solutionsAPI = {
  getByThreadId: async (threadId: string) => {
    return authenticatedFetch(`/solutions/thread/${threadId}`);
  },

  getById: async (id: string) => {
    return authenticatedFetch(`/solutions/${id}`);
  },

  create: async (solutionData: {
    threadId: string;
    title: string;
    content: string;
    estimatedCost?: number;
    implementationTime?: string;
    trlLevel?: TRLLevel;
  }) => {
    return authenticatedFetch('/solutions', {
      method: 'POST',
      body: JSON.stringify(solutionData),
    });
  },

  createWithMedia: async (solutionData: {
    threadId: string;
    title: string;
    content: string;
    estimatedCost?: number;
    implementationTime?: string;
    trlLevel?: TRLLevel;
  }, attachments: File[], mediaFiles: File[]) => {
    const formData = new FormData();

    // Add solution data
    Object.entries(solutionData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Add all files with the 'files' field name (as expected by backend)
    const allFiles = [...attachments, ...mediaFiles];
    allFiles.forEach(file => {
      formData.append('files', file);
    });

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/solutions/with-media`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  update: async (id: string, solutionData: Partial<Solution>) => {
    return authenticatedFetch(`/solutions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(solutionData),
    });
  },

  delete: async (id: string) => {
    return authenticatedFetch(`/solutions/${id}`, { method: 'DELETE' });
  },

  vote: async (id: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    return authenticatedFetch(`/solutions/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type: voteType }),
    });
  },

  updateStatus: async (id: string, status: SolutionStatus, note?: string) => {
    return authenticatedFetch(`/solutions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: status.toUpperCase(), note }),
    });
  },

  accept: async (id: string) => {
    return authenticatedFetch(`/solutions/${id}/accept`, { method: 'POST' });
  },
};

// Comments API
export const commentsAPI = {
  getByThreadId: async (threadId: string) => {
    return authenticatedFetch(`/threads/${threadId}/comments`);
  },

  getBySolutionId: async (solutionId: string) => {
    return authenticatedFetch(`/solutions/${solutionId}/comments`);
  },

  create: async (commentData: {
    threadId?: string;
    solutionId?: string;
    content: string;
    parentId?: string;
  }) => {
    // Determine the correct endpoint based on whether it's a thread or solution comment
    if (commentData.threadId) {
      return authenticatedFetch(`/threads/${commentData.threadId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: commentData.content,
          parentId: commentData.parentId
        }),
      });
    } else if (commentData.solutionId) {
      return authenticatedFetch(`/solutions/${commentData.solutionId}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: commentData.content,
          parentId: commentData.parentId
        }),
      });
    } else {
      throw new Error('Either threadId or solutionId must be provided');
    }
  },

  update: async (id: string, content: string) => {
    return authenticatedFetch(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  delete: async (id: string) => {
    return authenticatedFetch(`/comments/${id}`, { method: 'DELETE' });
  },

  vote: async (id: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    return authenticatedFetch(`/comments/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type: voteType }),
    });
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    return authenticatedFetch('/threads/categories');
  },

  getById: async (id: string) => {
    return authenticatedFetch(`/categories/${id}`);
  },
};

// Tags API
export const tagsAPI = {
  getAll: async () => {
    return authenticatedFetch('/threads/tags');
  },

  search: async (query: string) => {
    return authenticatedFetch(`/tags/search?q=${encodeURIComponent(query)}`);
  },
};

// Users API - NEW
export const usersAPI = {
  getById: async (id: string) => {
    return authenticatedFetch(`/users/${id}`);
  },

  getUserThreads: async (id: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return authenticatedFetch(`/users/${id}/threads${queryString ? `?${queryString}` : ''}`);
  },

  getUserSolutions: async (id: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return authenticatedFetch(`/users/${id}/solutions${queryString ? `?${queryString}` : ''}`);
  },

  getUserStats: async (id: string) => {
    return authenticatedFetch(`/users/${id}/stats`);
  },

  getUserBadges: async (id: string) => {
    return authenticatedFetch(`/users/${id}/badges`);
  },

  getUserActivities: async (id: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return authenticatedFetch(`/users/${id}/activities${queryString ? `?${queryString}` : ''}`);
  },

  getUserBookmarks: async (id: string, type?: 'threads' | 'users' | 'all') => {
    const queryString = type ? `?type=${type}` : '';
    return authenticatedFetch(`/users/${id}/bookmarks${queryString}`);
  },

  updateUserProfile: async (id: string, profileData: Partial<User>) => {
    return authenticatedFetch(`/users/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  followUser: async (id: string) => {
    return authenticatedFetch(`/users/${id}/follow`, { method: 'POST' });
  },

  searchUsers: async (params?: {
    q?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return authenticatedFetch(`/users${queryString ? `?${queryString}` : ''}`);
  },

  // Bookmark endpoints
  addBookmark: async (userId: string, type: 'thread' | 'user', targetId: string) => {
    return authenticatedFetch(`/users/${targetId}/bookmark`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  },

  removeBookmark: async (userId: string, type: 'thread' | 'user', targetId: string) => {
    return authenticatedFetch(`/users/${targetId}/bookmark`, {
      method: 'DELETE',
      body: JSON.stringify({ type }),
    });
  },

  // Get user followers
  getUserFollowers: async (id: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return authenticatedFetch(`/users/${id}/followers${queryString ? `?${queryString}` : ''}`);
  },

  // Get user following
  getUserFollowing: async (id: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return authenticatedFetch(`/users/${id}/following${queryString ? `?${queryString}` : ''}`);
  },
};

// Media API - Modern object storage with Minio
export const mediaAPI = {
  // Upload files directly to a thread
  uploadToThread: async (threadId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/media/thread/${threadId}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Upload files directly to a solution
  uploadToSolution: async (solutionId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/media/solution/${solutionId}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Get thread attachments
  getThreadAttachments: async (threadId: string) => {
    return authenticatedFetch(`/media/thread/${threadId}/attachments`);
  },

  // Get solution attachments
  getSolutionAttachments: async (solutionId: string) => {
    return authenticatedFetch(`/media/solution/${solutionId}/attachments`);
  },

  // Delete attachment
  deleteAttachment: async (attachmentId: string) => {
    return authenticatedFetch(`/media/attachments/${attachmentId}`, {
      method: 'DELETE'
    });
  },

  // Get attachment info/metadata
  getAttachmentInfo: async (attachmentId: string) => {
    return authenticatedFetch(`/media/attachments/${attachmentId}/info`);
  },

  // Generate secure download URL
  getDownloadUrl: async (attachmentId: string, expiry: number = 3600) => {
    return authenticatedFetch(`/media/attachments/${attachmentId}/download-url`, {
      method: 'POST',
      body: JSON.stringify({ expiry }),
    });
  },
};

// Files API - Keep for backward compatibility but use media API internally
export const filesAPI = {
  uploadToThread: mediaAPI.uploadToThread,

  getThreadAttachments: mediaAPI.getThreadAttachments,

  deleteAttachment: mediaAPI.deleteAttachment,

  getFileUrl: (filename: string) => {
    return `${API_BASE_URL}/files/uploads/${filename}`;
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return authenticatedFetch(`/notifications${queryString ? `?${queryString}` : ''}`);
  },

  markAsRead: async (id: string) => {
    return authenticatedFetch(`/notifications/${id}/read`, { method: 'PUT' });
  },

  markAllAsRead: async () => {
    return authenticatedFetch('/notifications/read-all', { method: 'PUT' });
  },
};

// Bounties API
export const bountiesAPI = {
  create: async (bountyData: {
    threadId: string;
    amount: number;
    currency?: string;
    description: string;
    deadline?: string;
  }) => {
    return authenticatedFetch('/bounties', {
      method: 'POST',
      body: JSON.stringify(bountyData),
    });
  },

  getById: async (id: string) => {
    return authenticatedFetch(`/bounties/${id}`);
  },

  getByThreadId: async (threadId: string) => {
    return authenticatedFetch(`/bounties/thread/${threadId}`);
  },

  update: async (id: string, bountyData: {
    amount?: number;
    description?: string;
    deadline?: string;
    isActive?: boolean;
  }) => {
    return authenticatedFetch(`/bounties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bountyData),
    });
  },

  award: async (id: string, solutionId: string) => {
    return authenticatedFetch(`/bounties/${id}/award`, {
      method: 'POST',
      body: JSON.stringify({ solutionId }),
    });
  },

  cancel: async (id: string) => {
    return authenticatedFetch(`/bounties/${id}`, {
      method: 'DELETE',
    });
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    minAmount?: number;
    maxAmount?: number;
  }) => {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    return authenticatedFetch(`/bounties${queryString ? `?${queryString}` : ''}`);
  },
};

// Export all APIs
export default {
  auth: authAPI,
  threads: threadsAPI,
  solutions: solutionsAPI,
  comments: commentsAPI,
  categories: categoriesAPI,
  tags: tagsAPI,
  users: usersAPI,
  files: filesAPI,
  media: mediaAPI,
  notifications: notificationsAPI,
  bounties: bountiesAPI,
}; 