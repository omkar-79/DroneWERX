import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Thread, SearchFilters, SortOption } from '../types';
import { filterThreads, sortThreads, debounce, getLocalStorage, setLocalStorage } from '../utils';
import { useThreads } from './useThreads';

// Export new API-integrated hooks
export { useThreads, useThread } from './useThreads';
export { useSolutions, useSolution } from './useSolutions';
export { useComments } from './useComments';
export { useActivities } from './useActivities';

// Enhanced hook for managing search and filters with real API data
export const useThreadSearch = (initialFilters: SearchFilters = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'hotScore',
    direction: 'desc',
    label: 'Hot'
  });

  // Use real API data
  const {
    threads: allThreads,
    loading,
    error,
    categories,
    allTags,
    fetchThreads
  } = useThreads({ autoFetch: true });

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debouncedSetQuery = useMemo(
    () => debounce((query: string) => setDebouncedQuery(query), 300),
    []
  );

  useEffect(() => {
    debouncedSetQuery(searchQuery);
  }, [searchQuery, debouncedSetQuery]);

  // Filter and sort threads locally (can be optimized to use server-side filtering)
  const filteredAndSortedThreads = useMemo(() => {
    const filtersWithQuery = { ...filters, query: debouncedQuery };
    const filtered = filterThreads(allThreads, filtersWithQuery);
    return sortThreads(filtered, sortOption);
  }, [allThreads, debouncedQuery, filters, sortOption]);

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  // Refresh data
  const refetch = useCallback(() => {
    fetchThreads();
  }, [fetchThreads]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    updateFilter,
    clearFilters,
    sortOption,
    setSortOption,
    filteredAndSortedThreads,
    totalResults: filteredAndSortedThreads.length,
    loading,
    error,
    categories,
    allTags,
    refetch
  };
};

// Hook for managing pagination
export const usePagination = <T>(data: T[], itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  return {
    currentPage,
    totalPages,
    currentData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, data.length),
    totalItems: data.length
  };
};

// Hook for managing local storage
export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    return getLocalStorage(key, defaultValue);
  });

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const valueToStore = newValue instanceof Function ? newValue(prev) : newValue;
      setLocalStorage(key, valueToStore);
      return valueToStore;
    });
  }, [key]);

  return [value, setStoredValue] as const;
};

// Hook for managing voting
export const useVoting = () => {
  const [votes, setVotes] = useLocalStorage<Record<string, 'upvote' | 'downvote' | undefined>>('user_votes', {});

  const vote = useCallback((targetId: string, voteType: 'upvote' | 'downvote') => {
    setVotes(prev => ({
      ...prev,
      [targetId]: prev[targetId] === voteType ? undefined : voteType
    }));
  }, [setVotes]);

  const getUserVote = useCallback((targetId: string) => {
    return votes[targetId];
  }, [votes]);

  return { vote, getUserVote };
};

// Hook for managing thread favorites
export const useFavorites = () => {
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);

  const toggleFavorite = useCallback((threadId: string) => {
    setFavorites(prev => 
      prev.includes(threadId) 
        ? prev.filter(id => id !== threadId)
        : [...prev, threadId]
    );
  }, [setFavorites]);

  const isFavorite = useCallback((threadId: string) => {
    return favorites.includes(threadId);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
};

// Hook for managing window size
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Hook for managing responsive breakpoints
export const useBreakpoint = () => {
  const { width } = useWindowSize();

  return useMemo(() => ({
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isLarge: width >= 1280,
    isXLarge: width >= 1536
  }), [width]);
};

// Hook for managing component visibility
export const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return { value, toggle, setTrue, setFalse, setValue };
};

// Hook for managing async operations
export const useAsync = <T>(asyncFunction: () => Promise<T>, deps: any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  return { data, loading, error, retry };
};

// Hook for managing form state
export const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedFields] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearError = useCallback((name: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const setTouched = useCallback((name: keyof T) => {
    setTouchedFields(prev => ({ ...prev, [name]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedFields({});
  }, [initialValues]);

  const handleChange = useCallback((name: keyof T) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked 
      : event.target.value;
    setValue(name, value);
  }, [setValue]);

  const handleBlur = useCallback((name: keyof T) => () => {
    setTouched(name);
  }, [setTouched]);

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    clearError,
    setTouched,
    reset,
    handleChange,
    handleBlur
  };
};

// Hook for managing keyboard shortcuts
export const useKeyboard = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'cmd',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        event.key.toLowerCase()
      ].filter(Boolean).join('+');

      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Hook for managing click outside
export const useClickOutside = (
  ref: React.RefObject<HTMLElement>, 
  callback: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
}; 