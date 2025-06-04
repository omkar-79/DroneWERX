import { useState, useEffect, useCallback } from 'react';
import { solutionsAPI } from '../services/api';
import { SolutionStatus, TRLLevel } from '../types';
import type { Solution } from '../types';
import { mediaAPI } from '../services/api';

// Helper function to transform solution data from API to frontend format
const transformSolution = (apiSolution: any): Solution => {
  // Normalize status from uppercase API format to lowercase enum format
  const normalizeStatus = (status: string): SolutionStatus => {
    const statusMap: Record<string, SolutionStatus> = {
      'PENDING': SolutionStatus.PENDING,
      'PASS': SolutionStatus.PASS,
      'FAIL': SolutionStatus.FAIL,
      'APPROVED': SolutionStatus.APPROVED,
      // Also handle lowercase versions just in case
      'pending': SolutionStatus.PENDING,
      'pass': SolutionStatus.PASS,
      'fail': SolutionStatus.FAIL,
      'approved': SolutionStatus.APPROVED,
    };
    return statusMap[status] || SolutionStatus.PENDING; // Default to pending if unknown
  };

  return {
    ...apiSolution,
    status: normalizeStatus(apiSolution.status),
    createdAt: new Date(apiSolution.createdAt),
    updatedAt: new Date(apiSolution.updatedAt),
    editedAt: apiSolution.editedAt ? new Date(apiSolution.editedAt) : null,
  };
};

export const useSolutions = (threadId: string) => {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSolutions = useCallback(async () => {
    if (!threadId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await solutionsAPI.getByThreadId(threadId);
      const rawSolutions = response.solutions || response.data || [];
      const transformedSolutions = rawSolutions.map(transformSolution);
      setSolutions(transformedSolutions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch solutions');
      console.error('Error fetching solutions:', err);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  const createSolution = useCallback(async (solutionData: {
    title: string;
    content: string;
    estimatedCost?: number;
    implementationTime?: string;
    trlLevel?: TRLLevel;
  }, files: File[] = []) => {
    try {
      if (files.length > 0) {
        // Use the media-enabled solution creation endpoint
        const response = await solutionsAPI.createWithMedia({
          threadId,
          ...solutionData,
        }, files, []);
        
        // Refresh solutions list
        await fetchSolutions();
        return response;
      } else {
        // Use the standard solution creation endpoint
        const response = await solutionsAPI.create({
          threadId,
          ...solutionData,
        });
        
        // Refresh solutions list
        await fetchSolutions();
        return response;
      }
    } catch (err) {
      console.error('Error creating solution:', err);
      throw err;
    }
  }, [threadId, fetchSolutions]);

  const updateSolution = useCallback(async (solutionId: string, updates: Partial<Solution>) => {
    try {
      const response = await solutionsAPI.update(solutionId, updates);
      // Update local state
      setSolutions(prev => prev.map(solution => 
        solution.id === solutionId 
          ? { ...solution, ...updates }
          : solution
      ));
      return response;
    } catch (err) {
      console.error('Error updating solution:', err);
      throw err;
    }
  }, []);

  const voteOnSolution = useCallback(async (solutionId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    try {
      await solutionsAPI.vote(solutionId, voteType);
      // Update local state
      setSolutions(prev => prev.map(solution => {
        if (solution.id === solutionId) {
          const isUpvote = voteType === 'UPVOTE';
          return {
            ...solution,
            upvotes: isUpvote ? solution.upvotes + 1 : solution.upvotes,
            downvotes: !isUpvote ? solution.downvotes + 1 : solution.downvotes,
            hasUserVoted: voteType === 'UPVOTE' ? 'up' : 'down',
          };
        }
        return solution;
      }));
    } catch (err) {
      console.error('Error voting on solution:', err);
      throw err;
    }
  }, []);

  const updateSolutionStatus = useCallback(async (solutionId: string, status: SolutionStatus, note?: string) => {
    try {
      await solutionsAPI.updateStatus(solutionId, status, note);
      // Update local state
      setSolutions(prev => prev.map(solution => 
        solution.id === solutionId 
          ? { ...solution, status, statusNote: note }
          : solution
      ));
    } catch (err) {
      console.error('Error updating solution status:', err);
      throw err;
    }
  }, []);

  const acceptSolution = useCallback(async (solutionId: string) => {
    try {
      await solutionsAPI.accept(solutionId);
      // Update local state
      setSolutions(prev => prev.map(solution => ({
        ...solution,
        isAccepted: solution.id === solutionId,
      })));
    } catch (err) {
      console.error('Error accepting solution:', err);
      throw err;
    }
  }, []);

  const deleteSolution = useCallback(async (solutionId: string) => {
    try {
      await solutionsAPI.delete(solutionId);
      // Remove from local state
      setSolutions(prev => prev.filter(solution => solution.id !== solutionId));
    } catch (err) {
      console.error('Error deleting solution:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  return {
    solutions,
    loading,
    error,
    createSolution,
    updateSolution,
    voteOnSolution,
    updateSolutionStatus,
    acceptSolution,
    deleteSolution,
    refetch: fetchSolutions,
  };
};

export const useSolution = (solutionId: string) => {
  const [solution, setSolution] = useState<Solution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSolution = useCallback(async () => {
    if (!solutionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await solutionsAPI.getById(solutionId);
      const rawSolution = response.solution || response.data;
      const transformedSolution = rawSolution ? transformSolution(rawSolution) : null;
      setSolution(transformedSolution);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch solution');
      console.error('Error fetching solution:', err);
    } finally {
      setLoading(false);
    }
  }, [solutionId]);

  useEffect(() => {
    fetchSolution();
  }, [fetchSolution]);

  return {
    solution,
    loading,
    error,
    refetch: fetchSolution,
  };
}; 