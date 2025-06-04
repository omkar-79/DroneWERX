import { useState, useEffect, useCallback } from 'react';
import { commentsAPI } from '../services/api';
import type { Comment } from '../types';

// Helper function to transform comment data from API to frontend format
const transformComment = (apiComment: any): Comment => {
  return {
    ...apiComment,
    createdAt: new Date(apiComment.createdAt),
    editedAt: apiComment.editedAt ? new Date(apiComment.editedAt) : null,
    replies: apiComment.replies?.map(transformComment) || [],
  };
};

export const useComments = (threadId: string | null) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!threadId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await commentsAPI.getByThreadId(threadId);
      const rawComments = response.comments || response.data || [];
      const transformedComments = rawComments.map(transformComment);
      setComments(transformedComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  const createComment = useCallback(async (commentData: {
    content: string;
    parentId?: string;
  }) => {
    if (!threadId) return;
    
    try {
      const response = await commentsAPI.create({
        threadId,
        ...commentData,
      });
      // Refresh comments list
      await fetchComments();
      return response;
    } catch (err) {
      console.error('Error creating comment:', err);
      throw err;
    }
  }, [threadId, fetchComments]);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      const response = await commentsAPI.update(commentId, content);
      // Update local state
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content, isEdited: true, editedAt: new Date() }
          : comment
      ));
      return response;
    } catch (err) {
      console.error('Error updating comment:', err);
      throw err;
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await commentsAPI.delete(commentId);
      // Remove from local state
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  }, []);

  const voteOnComment = useCallback(async (commentId: string, voteType: 'UPVOTE' | 'DOWNVOTE') => {
    try {
      const response = await commentsAPI.vote(commentId, voteType);
      
      // Update local state optimistically
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          const currentVote = comment.hasUserVoted;
          const isUpvote = voteType === 'UPVOTE';
          const isDownvote = voteType === 'DOWNVOTE';
          
          let newUpvotes = comment.upvotes;
          let newDownvotes = comment.downvotes;
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
            if (isDownvote) {
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
            ...comment,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            hasUserVoted: newUserVote,
          };
        }
        return comment;
      }));
      
      return response;
    } catch (err) {
      console.error('Error voting on comment:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (threadId) {
      fetchComments();
    }
  }, [fetchComments, threadId]);

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
    createComment,
    updateComment,
    deleteComment,
    voteOnComment,
  };
}; 