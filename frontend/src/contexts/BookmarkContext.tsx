import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usersAPI } from '../services/api';
import type { User, Thread } from '../types';

interface BookmarkContextType {
    bookmarkedThreads: Thread[];
    bookmarkedUsers: User[];
    addBookmark: (type: 'thread' | 'user', id: string) => Promise<void>;
    removeBookmark: (type: 'thread' | 'user', id: string) => Promise<void>;
    isBookmarked: (type: 'thread' | 'user', id: string) => boolean;
    refreshBookmarks: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();
    const [bookmarkedThreads, setBookmarkedThreads] = useState<Thread[]>([]);
    const [bookmarkedUsers, setBookmarkedUsers] = useState<User[]>([]);

    const refreshBookmarks = useCallback(async () => {
        if (!currentUser) {
            console.log('No current user, clearing bookmarks');
            setBookmarkedThreads([]);
            setBookmarkedUsers([]);
            return;
        }

        try {
            console.log('Fetching bookmarks for user:', currentUser.id);
            const response = await usersAPI.getUserBookmarks(currentUser.id);
            console.log('Bookmarks API response:', response);

            if (response.bookmarks) {
                setBookmarkedThreads(response.bookmarks.threads || []);
                setBookmarkedUsers(response.bookmarks.users || []);
                console.log('Updated bookmarks:', {
                    threads: response.bookmarks.threads?.length || 0,
                    users: response.bookmarks.users?.length || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch bookmarks:', error);
        }
    }, [currentUser]);

    const addBookmark = useCallback(async (type: 'thread' | 'user', id: string) => {
        if (!currentUser) return;

        try {
            console.log(`Adding ${type} bookmark for ID:`, id);
            await usersAPI.addBookmark(currentUser.id, type, id);
            await refreshBookmarks();
        } catch (error) {
            console.error('Failed to add bookmark:', error);
            throw error;
        }
    }, [currentUser, refreshBookmarks]);

    const removeBookmark = useCallback(async (type: 'thread' | 'user', id: string) => {
        if (!currentUser) return;

        try {
            console.log(`Removing ${type} bookmark for ID:`, id);
            await usersAPI.removeBookmark(currentUser.id, type, id);
            await refreshBookmarks();
        } catch (error) {
            console.error('Failed to remove bookmark:', error);
            throw error;
        }
    }, [currentUser, refreshBookmarks]);

    const isBookmarked = useCallback((type: 'thread' | 'user', id: string) => {
        const result = type === 'thread'
            ? bookmarkedThreads.some(thread => thread.id === id)
            : bookmarkedUsers.some(user => user.id === id);
        console.log(`Checking if ${type} ${id} is bookmarked:`, result);
        return result;
    }, [bookmarkedThreads, bookmarkedUsers]);

    useEffect(() => {
        console.log('BookmarkContext useEffect triggered, currentUser:', currentUser?.id);
        refreshBookmarks();
    }, [currentUser?.id, refreshBookmarks]);

    const contextValue = {
        bookmarkedThreads,
        bookmarkedUsers,
        addBookmark,
        removeBookmark,
        isBookmarked,
        refreshBookmarks,
    };

    console.log('BookmarkContext current state:', {
        bookmarkedThreadsCount: bookmarkedThreads.length,
        bookmarkedUsersCount: bookmarkedUsers.length
    });

    return (
        <BookmarkContext.Provider value={contextValue}>
            {children}
        </BookmarkContext.Provider>
    );
};

export const useBookmarks = () => {
    const context = useContext(BookmarkContext);
    if (context === undefined) {
        throw new Error('useBookmarks must be used within a BookmarkProvider');
    }
    return context;
}; 