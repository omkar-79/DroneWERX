import { useState, useEffect, useCallback } from 'react';
import { threadsAPI } from '../services/api';
import type { ThreadActivity } from '../types';

// Helper function to transform activity data from API to frontend format
const transformActivity = (apiActivity: any): ThreadActivity => {
  return {
    ...apiActivity,
    timestamp: new Date(apiActivity.timestamp),
  };
};

export const useActivities = (threadId: string | null) => {
  const [activities, setActivities] = useState<ThreadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!threadId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await threadsAPI.getActivities(threadId);
      const rawActivities = response.activities || [];
      const transformedActivities = rawActivities.map(transformActivity);
      setActivities(transformedActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    if (threadId) {
      fetchActivities();
    }
  }, [fetchActivities, threadId]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
}; 