import { useState, useEffect, useCallback, useRef } from 'react';
import { threadsAPI, categoriesAPI, tagsAPI } from '../services/api';
import type { Thread, Category, Tag, Priority, ThreadStatus, Urgency, TRLLevel } from '../types';

interface UseThreadsParams {
  page?: number;
  limit?: number;
  category?: string;
  tags?: string[];
  priority?: Priority;
  status?: ThreadStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  autoFetch?: boolean;
}

export const useThreads = (params: UseThreadsParams = {}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Refs to prevent unnecessary re-fetches
  const hasFetchedCategories = useRef(false);
  const hasFetchedTags = useRef(false);

  const fetchThreads = useCallback(async (searchParams: UseThreadsParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await threadsAPI.getAll({
        page: searchParams.page || params.page || 1,
        limit: searchParams.limit || params.limit || 10,
        category: searchParams.category || params.category,
        tags: searchParams.tags || params.tags,
        priority: searchParams.priority || params.priority,
        status: searchParams.status || params.status,
        search: searchParams.search || params.search,
        sortBy: searchParams.sortBy || params.sortBy || 'createdAt',
        sortOrder: searchParams.sortOrder || params.sortOrder || 'desc',
      });

      // Transform the thread data to match frontend types
      const transformedThreads = (response.threads || response.data || []).map(transformThread);
      setThreads(transformedThreads);
      setTotal(response.total || 0);
      setHasMore(response.hasMore || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch threads');
      console.error('Error fetching threads:', err);
    } finally {
      setLoading(false);
    }
  }, [params.page, params.limit, params.category, params.tags, params.priority, params.status, params.search, params.sortBy, params.sortOrder]);

  // Helper function to transform thread data from API to frontend format
  const transformThread = (apiThread: any) => {
    return {
      ...apiThread,
      tags: apiThread.tags?.map((tagWrapper: any) => tagWrapper.tag) || [],
      createdAt: new Date(apiThread.createdAt),
      updatedAt: new Date(apiThread.updatedAt),
      // Transform bounty deadline if it exists
      bounty: apiThread.bounty ? {
        ...apiThread.bounty,
        deadline: apiThread.bounty.deadline ? new Date(apiThread.bounty.deadline) : null,
        createdAt: new Date(apiThread.bounty.createdAt),
      } : null,
    };
  };

  const fetchCategories = useCallback(async () => {
    if (hasFetchedCategories.current) return;

    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.categories || response.data || []);
      hasFetchedCategories.current = true;
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    if (hasFetchedTags.current) return;

    try {
      const response = await tagsAPI.getAll();
      setAllTags(response.tags || response.data || []);
      hasFetchedTags.current = true;
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  }, []);

  const createThread = useCallback(async (threadData: {
    title: string;
    description: string;
    categoryId: string;
    tags: string[];
    priority: Priority;
    urgency: Urgency;
    trlLevel?: TRLLevel;
    domain?: string;
    location?: string;
    isAnonymous?: boolean;
  }) => {
    try {
      const response = await threadsAPI.create(threadData);
      // Refresh the threads list
      await fetchThreads();
      return response;
    } catch (err) {
      throw err;
    }
  }, [fetchThreads]);

  const voteOnThread = useCallback(async (threadId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    try {
      await threadsAPI.vote(threadId, voteType);
      // Update the local thread in the list
      setThreads(prev => prev.map(thread => {
        if (thread.id === threadId) {
          const isUpvote = voteType === 'UPVOTE';
          return {
            ...thread,
            upvotes: isUpvote ? thread.upvotes + 1 : thread.upvotes,
            downvotes: !isUpvote ? thread.downvotes + 1 : thread.downvotes,
          };
        }
        return thread;
      }));
    } catch (err) {
      console.error('Error voting on thread:', err);
      throw err;
    }
  }, []);

  const toggleBookmark = useCallback(async (threadId: string) => {
    try {
      await threadsAPI.toggleBookmark(threadId);
      // You might want to track bookmarked state locally or refetch
    } catch (err) {
      console.error('Error bookmarking thread:', err);
      throw err;
    }
  }, []);

  // Auto-fetch on mount if enabled - simplified dependencies
  useEffect(() => {
    if (params.autoFetch !== false) {
      fetchThreads();
      fetchCategories();
      fetchTags();
    }
  }, [params.autoFetch]); // Only depend on autoFetch to prevent infinite loops

  // Separate effect for threads refetch when params change
  useEffect(() => {
    if (params.autoFetch !== false) {
      fetchThreads();
    }
  }, [fetchThreads]);

  return {
    threads,
    categories,
    allTags,
    loading,
    error,
    total,
    hasMore,
    fetchThreads,
    createThread,
    voteOnThread,
    toggleBookmark,
    refetch: () => fetchThreads(),
  };
};

export const useThread = (threadId: string) => {
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = useCallback(async () => {
    if (!threadId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await threadsAPI.getById(threadId);
      const thread = response.thread || response.data;

      // Transform the thread data to match frontend types
      const transformedThread = thread ? {
        ...thread,
        tags: thread.tags?.map((tagWrapper: any) => tagWrapper.tag) || [],
        createdAt: new Date(thread.createdAt),
        updatedAt: new Date(thread.updatedAt),
        // Transform bounty deadline if it exists
        bounty: thread.bounty ? {
          ...thread.bounty,
          deadline: thread.bounty.deadline ? new Date(thread.bounty.deadline) : null,
          createdAt: new Date(thread.bounty.createdAt),
        } : null,
      } : null;

      setThread(transformedThread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch thread');
      console.error('Error fetching thread:', err);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  const updateThread = useCallback(async (updates: Partial<Thread>) => {
    if (!threadId) return;

    try {
      const response = await threadsAPI.update(threadId, updates);
      setThread(response.thread || response.data);
      return response;
    } catch (err) {
      console.error('Error updating thread:', err);
      throw err;
    }
  }, [threadId]);

  const deleteThread = useCallback(async () => {
    if (!threadId) return;

    try {
      await threadsAPI.delete(threadId);
      setThread(null);
    } catch (err) {
      console.error('Error deleting thread:', err);
      throw err;
    }
  }, [threadId]);

  const handleVote = useCallback(async (voteType: 'UPVOTE' | 'DOWNVOTE') => {
    if (!thread) return;

    try {
      await threadsAPI.vote(threadId, voteType);

      // Update local state optimistically
      setThread(prevThread => {
        if (!prevThread) return null;

        const currentVote = prevThread.hasUserVoted;
        const isUpvote = voteType === 'UPVOTE';

        let newUpvotes = prevThread.upvotes;
        let newDownvotes = prevThread.downvotes;
        let newUserVote: 'up' | 'down' | null = null;

        if (currentVote === null) {
          // No previous vote
          if (isUpvote) {
            newUpvotes += 1;
            newUserVote = 'up';
          } else {
            newDownvotes += 1;
            newUserVote = 'down';
          }
        } else if (currentVote === 'up') {
          if (isUpvote) {
            // Remove upvote
            newUpvotes -= 1;
            newUserVote = null;
          } else {
            // Change to downvote
            newUpvotes -= 1;
            newDownvotes += 1;
            newUserVote = 'down';
          }
        } else if (currentVote === 'down') {
          if (!isUpvote) {
            // Remove downvote
            newDownvotes -= 1;
            newUserVote = null;
          } else {
            // Change to upvote
            newDownvotes -= 1;
            newUpvotes += 1;
            newUserVote = 'up';
          }
        }

        return {
          ...prevThread,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          hasUserVoted: newUserVote,
        };
      });
    } catch (err) {
      console.error('Error voting on thread:', err);
      throw err;
    }
  }, [thread, threadId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  return {
    thread,
    loading,
    error,
    updateThread,
    deleteThread,
    handleVote,
    refetch: fetchThread,
  };
}; 