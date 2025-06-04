import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  Flag,
  Eye,
  Award,
  DollarSign,
  Clock,
  CheckCircle,
  Star,
  Send,
  Target,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
  Edit3,
  Play,
  Download,
  ImageIcon,
  FileText,
  Video,
  UserX
} from 'lucide-react';
import { Header, SolutionEditor, SolutionStatusManager, MediaGallery } from '../components';
import { useThread, useSolutions, useComments, useActivities } from '../hooks';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarkContext';
import type { Thread, Solution, Comment, ThreadActivity, TRLLevel, SolutionStatus } from '../types';
import { UserRole, Priority } from '../types';
import { threadsAPI } from '../services/api';
import { usersAPI } from '../services/api';

export const ThreadView: React.FC = () => {
  const { id: threadId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const [activeTab, setActiveTab] = useState<'solutions' | 'activity' | 'details'>('solutions');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [editingSolution, setEditingSolution] = useState<string | null>(null);

  // Use real API data
  const {
    thread,
    loading: threadLoading,
    error: threadError,
    refetch: refetchThread
  } = useThread(threadId || '');

  const {
    solutions: threadSolutions,
    loading: solutionsLoading,
    error: solutionsError,
    createSolution,
    updateSolution,
    voteOnSolution,
    updateSolutionStatus,
    acceptSolution,
    deleteSolution
  } = useSolutions(threadId || '');

  // Use real comment data
  const {
    comments: threadComments,
    loading: commentsLoading,
    error: commentsError,
    createComment,
    updateComment,
    deleteComment,
    voteOnComment
  } = useComments(threadId || '');

  // Use real activity data
  const {
    activities: threadActivities,
    loading: activitiesLoading,
    error: activitiesError
  } = useActivities(threadId || '');

  // Show loading state
  if (threadLoading || solutionsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          searchQuery=""
          onSearchChange={() => { }}
          onCreateThread={() => navigate('/create-challenge')}
        />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (threadError || solutionsError || !thread) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          searchQuery=""
          onSearchChange={() => { }}
          onCreateThread={() => navigate('/create-challenge')}
        />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {threadError || solutionsError ? 'Failed to Load Thread' : 'Thread Not Found'}
            </h2>
            <p className="text-muted mb-4">
              {threadError || solutionsError || 'The thread you are looking for does not exist.'}
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                Return to Home
              </button>
              {(threadError || solutionsError) && (
                <button
                  onClick={() => {
                    refetchThread();
                    window.location.reload(); // Refresh solutions
                  }}
                  className="px-6 py-3 bg-surface border border-border text-primary rounded-lg hover:bg-surface-hover"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getTRLColor = (trl?: TRLLevel): string => {
    if (!trl) return 'bg-gray-100 text-gray-800';
    const level = parseInt(trl.replace('trl', ''));
    if (level <= 3) return 'bg-red-100 text-red-800';
    if (level <= 6) return 'bg-orange-100 text-orange-800';
    if (level <= 8) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const formatTimeAgo = (date: Date | string): string => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Unknown';
      }

      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      if (days < 0) return 'Future';

      return `${days} days ago`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  // Helper function to safely format dates for display
  const formatDate = (date: Date | string | null | undefined): string => {
    try {
      if (!date) return 'Not specified';
      const dateObj = date instanceof Date ? date : new Date(date);

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }

      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleVote = async (type: 'up' | 'down', targetType: 'thread' | 'solution' | 'comment', targetId: string) => {
    if (!currentUser) {
      console.log('User must be logged in to vote');
      return;
    }

    const voteType = type === 'up' ? 'UPVOTE' : 'DOWNVOTE';

    try {
      if (targetType === 'thread') {
        await threadsAPI.vote(targetId, voteType);
        // Refetch thread to get updated vote counts
        refetchThread();
      } else if (targetType === 'solution') {
        await voteOnSolution(targetId, voteType);
        // The voteOnSolution hook already updates local state
      } else if (targetType === 'comment') {
        await voteOnComment(targetId, voteType);
        // The voteOnComment hook already updates local state
      }
    } catch (error) {
      console.error(`Failed to ${type}vote ${targetType}:`, error);
      // TODO: Show error toast to user
    }
  };

  const handleBookmark = async () => {
    if (!currentUser || !thread) {
      console.log('User must be logged in to bookmark');
      return;
    }

    try {
      if (isBookmarked('thread', thread.id)) {
        await removeBookmark('thread', thread.id);
      } else {
        await addBookmark('thread', thread.id);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      // TODO: Show error toast to user
    }
  };

  const handleCommentSubmit = async () => {
    if (!currentUser || !newComment.trim()) {
      return;
    }

    try {
      await createComment({
        content: newComment,
        parentId: replyingTo || undefined,
      });
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to create comment:', error);
      // TODO: Show error toast to user
    }
  };

  const handleSolutionSubmit = async (content: string, files: File[]) => {
    if (!threadId || !thread) return;

    // Generate a proper title that meets backend validation (min 5 chars)
    const contentPreview = content.replace(/[*#\[\]()]/g, '').trim().substring(0, 50);
    const solutionTitle = contentPreview.length >= 5
      ? contentPreview
      : `Solution for ${thread.title}`.substring(0, 200);

    try {
      // Create solution with files
      await createSolution({
        title: solutionTitle,
        content: content.trim(),
        estimatedCost: undefined,
        implementationTime: undefined,
        trlLevel: undefined
      }, files);

      setShowSolutionForm(false);
    } catch (err) {
      console.error('Failed to create solution:', err);
      // TODO: Show error toast
    }
  };

  const handleSolutionEdit = async (solutionId: string, content: string, files: File[]) => {
    try {
      await updateSolution(solutionId, { content });
      setEditingSolution(null);
    } catch (err) {
      console.error('Failed to update solution:', err);
      // TODO: Show error toast
    }
  };

  const handleStatusUpdate = (solutionId: string, status: SolutionStatus, note: string) => {
    updateSolutionStatus(solutionId, status, note).catch(err => {
      console.error('Failed to update status:', err);
      // TODO: Show error toast
    });
  };

  const canManageStatus = (solution: Solution) => {
    if (!currentUser) return false;
    return currentUser.id === thread.authorId || currentUser.role === UserRole.MODERATOR || currentUser.role === UserRole.ADMIN;
  };

  const canEditSolution = (solution: Solution) => {
    if (!currentUser) return false;
    return currentUser.id === solution.author.id;
  };

  const renderMediaAttachment = (url: string, type: 'image' | 'video') => {
    if (type === 'image') {
      return (
        <div className="relative group">
          <img
            src={url}
            alt="Solution attachment"
            className="w-full h-48 object-cover rounded-lg border border-border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <Eye className="text-white" size={20} />
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative group">
          <div className="w-full h-48 bg-background-alt rounded-lg border border-border flex items-center justify-center">
            <div className="text-center">
              <Video size={48} className="text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Video Attachment</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <button className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <Play className="text-white" size={24} />
            </button>
          </div>
        </div>
      );
    }
  };

  // Mock data for features not yet implemented in API
  const relatedThreads: Thread[] = []; // TODO: Implement related threads API

  const canEditThread = () => {
    if (!currentUser || !thread) return false;
    return currentUser.id === thread.authorId ||
      currentUser.role === UserRole.MODERATOR ||
      currentUser.role === UserRole.ADMIN;
  };

  const canDeleteAttachment = (attachment: any) => {
    if (!currentUser) return false;
    return currentUser.id === attachment.uploadedBy ||
      currentUser.role === UserRole.MODERATOR ||
      currentUser.role === UserRole.ADMIN;
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    // The MediaGallery component will handle the API call
    // We just need to refetch the thread data to update the UI
    await refetchThread();
  };

  const handleSolutionAttachmentDelete = async (attachmentId: string) => {
    // The MediaGallery component will handle the API call
    // We just need to refetch the solutions data to update the UI
    window.location.reload(); // For now, reload to get fresh data
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery=""
        onSearchChange={() => { }}
        onCreateThread={() => navigate('/create-challenge')}
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-muted mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link to={`/categories/${thread.category.id}`} className="hover:text-primary">
            {thread.category.name}
          </Link>
          <span>/</span>
          <span className="text-primary font-medium line-clamp-1">{thread.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Thread Header */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-primary mb-4">{thread.title}</h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted mb-4">
                    <div className="flex items-center space-x-2">
                      {thread.isAnonymous ? (
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserX size={14} className="text-gray-500" />
                        </div>
                      ) : (
                        <img
                          src={thread.author.avatar}
                          alt={thread.author.fullName}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-primary">
                          {thread.isAnonymous ? 'Anonymous' : thread.author.fullName}
                        </h3>
                        <p className="text-sm text-muted">
                          {thread.isAnonymous ? 'Anonymous User' : `@${thread.author.username}`}
                        </p>
                        {!thread.isAnonymous && (
                          <div className="flex items-center space-x-3 mt-1">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${thread.author.role === UserRole.WARFIGHTER ? 'bg-primary/10 text-primary' :
                              thread.author.role === UserRole.INNOVATOR ? 'bg-warning/10 text-warning' :
                                'bg-success/10 text-success'
                              }`}>
                              {thread.author.role}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>{formatTimeAgo(thread.createdAt)}</span>
                    </div>
                    {thread.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin size={16} />
                        <span>{thread.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags and Metadata */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {/* Priority */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${thread.priority === Priority.CRITICAL ? 'bg-error/10 text-error' :
                      thread.priority === Priority.HIGH ? 'bg-warning/10 text-warning' :
                        thread.priority === Priority.MEDIUM ? 'bg-info/10 text-info' :
                          'bg-success/10 text-success'
                      }`}>
                      {thread.priority.toUpperCase()} Priority
                    </span>

                    {/* Urgency */}
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {thread.urgency.toUpperCase()} Urgency
                    </span>

                    {/* TRL Level */}
                    {thread.trlLevel && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTRLColor(thread.trlLevel)}`}>
                        {thread.trlLevel.toUpperCase()}
                      </span>
                    )}

                    {/* Status */}
                    {thread.isAcceptedSolution && (
                      <span className="px-3 py-1 bg-success/10 text-success rounded-full text-xs font-medium flex items-center space-x-1">
                        <CheckCircle size={12} />
                        <span>SOLVED</span>
                      </span>
                    )}

                    {/* Bounty */}
                    {thread.bounty && (
                      <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium flex items-center space-x-1">
                        <DollarSign size={12} />
                        <span>${thread.bounty.amount.toLocaleString()}</span>
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {thread.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm border border-primary/20"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleVote('up', 'thread', thread.id)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <ThumbsUp size={16} />
                    <span>{thread.upvotes}</span>
                  </button>
                  <button
                    onClick={() => handleVote('down', 'thread', thread.id)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <ThumbsDown size={16} />
                    <span>{thread.downvotes}</span>
                  </button>
                  <button
                    onClick={handleBookmark}
                    className={`p-2 rounded-lg transition-colors ${isBookmarked('thread', thread.id)
                        ? 'text-warning bg-warning/20'
                        : 'hover:bg-surface-hover text-muted hover:text-warning'
                      }`}
                    title={isBookmarked('thread', thread.id) ? 'Remove bookmark' : 'Bookmark this thread'}
                  >
                    <Bookmark size={16} fill={isBookmarked('thread', thread.id) ? 'currentColor' : 'none'} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors">
                    <Share2 size={16} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted">
                    <Flag size={16} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div
                className="prose prose-sm max-w-none text-secondary"
                dangerouslySetInnerHTML={{ __html: thread.description }}
              />

              {/* Attachments */}
              {thread.attachments.length > 0 && (
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="font-semibold text-primary mb-3">Attachments</h3>
                  <MediaGallery
                    attachments={thread.attachments}
                    showActions={true}
                    onDelete={canEditThread() ? handleAttachmentDelete : undefined}
                  />
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-border">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('solutions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'solutions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-secondary'
                    }`}
                >
                  Solutions ({threadSolutions.length})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-secondary'
                    }`}
                >
                  Activity ({threadActivities.length})
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-secondary'
                    }`}
                >
                  Technical Details
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'solutions' && (
              <div className="space-y-6">
                {/* Add Solution Button */}
                {!showSolutionForm && !editingSolution && (
                  <button
                    onClick={() => setShowSolutionForm(true)}
                    className="w-full flex items-center justify-center space-x-2 py-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <Target size={20} className="text-primary" />
                    <span className="font-medium text-primary">Submit Your Solution</span>
                  </button>
                )}

                {/* Solution Form */}
                {showSolutionForm && (
                  <SolutionEditor
                    onSubmit={handleSolutionSubmit}
                    onCancel={() => setShowSolutionForm(false)}
                  />
                )}

                {/* Solutions List */}
                {threadSolutions.map((solution) => (
                  <div key={solution.id}>
                    {editingSolution === solution.id ? (
                      <SolutionEditor
                        solution={solution}
                        onSubmit={(content, files) =>
                          handleSolutionEdit(solution.id, content, files)
                        }
                        onCancel={() => setEditingSolution(null)}
                        isEdit={true}
                      />
                    ) : (
                      <div
                        className={`bg-surface border rounded-xl p-6 ${solution.isAccepted ? 'border-success shadow-lg' : 'border-border'
                          }`}
                      >
                        {/* Solution Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={solution.author.avatar}
                              alt={solution.author.fullName}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-primary">{solution.author.username}</p>
                                {solution.isEdited && (
                                  <span className="text-xs text-muted">(edited)</span>
                                )}
                              </div>
                              <p className="text-sm text-muted">{formatTimeAgo(solution.createdAt)}</p>
                            </div>
                            {solution.isAccepted && (
                              <div className="flex items-center space-x-1 px-3 py-1 bg-success/10 text-success rounded-full text-sm font-medium">
                                <Award size={14} />
                                <span>Accepted Solution</span>
                              </div>
                            )}
                          </div>

                          {/* Solution Actions */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleVote('up', 'solution', solution.id)}
                              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${solution.hasUserVoted === 'up'
                                ? 'bg-success/10 text-success'
                                : 'hover:bg-surface-hover'
                                }`}
                            >
                              <ThumbsUp size={16} />
                              <span>{solution.upvotes}</span>
                            </button>
                            <button
                              onClick={() => handleVote('down', 'solution', solution.id)}
                              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${solution.hasUserVoted === 'down'
                                ? 'bg-error/10 text-error'
                                : 'hover:bg-surface-hover'
                                }`}
                            >
                              <ThumbsDown size={16} />
                              <span>{solution.downvotes}</span>
                            </button>
                            {canEditSolution(solution) && (
                              <button
                                onClick={() => setEditingSolution(solution.id)}
                                className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                                title="Edit Solution"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Status Management */}
                        <div className="mb-4">
                          <SolutionStatusManager
                            currentStatus={solution.status}
                            canManageStatus={canManageStatus(solution)}
                            statusNote={solution.statusNote}
                            onStatusUpdate={(status, note) => handleStatusUpdate(solution.id, status, note)}
                          />
                        </div>

                        {/* Solution Content */}
                        <div
                          className="prose prose-sm max-w-none mb-6"
                          dangerouslySetInnerHTML={{ __html: solution.content }}
                        />

                        {/* Attachments - Use new MediaGallery component */}
                        {solution.attachments && solution.attachments.length > 0 && (
                          <div className="mb-6">
                            <MediaGallery
                              attachments={solution.attachments}
                              showActions={true}
                              onDelete={canEditSolution(solution) ? handleSolutionAttachmentDelete : undefined}
                            />
                          </div>
                        )}

                        {/* Legacy Media Attachments - Keep for backward compatibility */}
                        {solution.mediaAttachments && (
                          <div className="mb-6">
                            {(solution.mediaAttachments.images.length > 0 || solution.mediaAttachments.videos.length > 0) && (
                              <div>
                                <h4 className="font-medium text-primary mb-3">Legacy Media Attachments</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                  {solution.mediaAttachments.images.map((url, index) => (
                                    <div key={`img-${index}`}>
                                      {renderMediaAttachment(url, 'image')}
                                    </div>
                                  ))}
                                  {solution.mediaAttachments.videos.map((url, index) => (
                                    <div key={`vid-${index}`}>
                                      {renderMediaAttachment(url, 'video')}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {solution.mediaAttachments.documents.length > 0 && (
                              <div>
                                <h4 className="font-medium text-primary mb-3">Legacy Documents</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                  {solution.mediaAttachments.documents.map((doc, index) => (
                                    <div key={index} className="flex items-center space-x-2 p-3 bg-background-alt rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                                      <FileText size={16} className="text-primary" />
                                      <span className="text-sm font-medium flex-1 truncate">{doc}</span>
                                      <Download size={14} className="text-muted" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Technical Specs */}
                        {solution.technicalSpecs && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-background-alt rounded-lg">
                            {solution.technicalSpecs.hardware && (
                              <div>
                                <h4 className="font-medium text-primary mb-2">Hardware</h4>
                                <ul className="text-sm text-muted space-y-1">
                                  {solution.technicalSpecs.hardware.map((item, index) => (
                                    <li key={index}>• {item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {solution.technicalSpecs.software && (
                              <div>
                                <h4 className="font-medium text-primary mb-2">Software</h4>
                                <ul className="text-sm text-muted space-y-1">
                                  {solution.technicalSpecs.software.map((item, index) => (
                                    <li key={index}>• {item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <div className="flex items-center space-x-4 text-sm">
                              {solution.technicalSpecs.estimatedCost && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign size={14} className="text-warning" />
                                  <span>${solution.technicalSpecs.estimatedCost.toLocaleString()}</span>
                                </div>
                              )}
                              {solution.technicalSpecs.implementationTime && (
                                <div className="flex items-center space-x-1">
                                  <Clock size={14} className="text-info" />
                                  <span>{solution.technicalSpecs.implementationTime}</span>
                                </div>
                              )}
                              {solution.technicalSpecs.trlLevel && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getTRLColor(solution.technicalSpecs.trlLevel)}`}>
                                  {solution.technicalSpecs.trlLevel.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Solution Comments */}
                        <div className="border-t border-border pt-4">
                          <h4 className="font-medium text-primary mb-3">Discussion</h4>

                          {commentsLoading ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          ) : commentsError ? (
                            <div className="text-center py-4 text-red-500">
                              <p>Failed to load comments: {commentsError}</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {threadComments.map((comment) => (
                                <div key={comment.id} className="flex space-x-3">
                                  <img
                                    src={comment.author.avatar}
                                    alt={comment.author.fullName}
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-primary">{comment.author.username}</span>
                                      <span className="text-xs text-muted">{formatTimeAgo(comment.createdAt)}</span>
                                      {comment.isEdited && (
                                        <span className="text-xs text-muted">(edited)</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-secondary mt-1">{comment.content}</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                      <button
                                        onClick={() => handleVote('up', 'comment', comment.id)}
                                        className={`flex items-center space-x-1 text-xs hover:text-primary transition-colors ${comment.hasUserVoted === 'up' ? 'text-primary' : 'text-muted'
                                          }`}
                                      >
                                        <ThumbsUp size={12} />
                                        <span>{comment.upvotes}</span>
                                      </button>
                                      <button
                                        onClick={() => handleVote('down', 'comment', comment.id)}
                                        className={`flex items-center space-x-1 text-xs hover:text-primary transition-colors ${comment.hasUserVoted === 'down' ? 'text-primary' : 'text-muted'
                                          }`}
                                      >
                                        <ThumbsDown size={12} />
                                        <span>{comment.downvotes}</span>
                                      </button>
                                      <button
                                        onClick={() => setReplyingTo(comment.id)}
                                        className="text-xs text-muted hover:text-primary"
                                      >
                                        Reply
                                      </button>
                                    </div>

                                    {/* Nested Replies */}
                                    {comment.replies && comment.replies.map((reply) => (
                                      <div key={reply.id} className="flex space-x-3 mt-3 ml-6">
                                        <img
                                          src={reply.author.avatar}
                                          alt={reply.author.fullName}
                                          className="w-6 h-6 rounded-full flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-medium text-primary text-sm">{reply.author.username}</span>
                                            <span className="text-xs text-muted">{formatTimeAgo(reply.createdAt)}</span>
                                          </div>
                                          <p className="text-sm text-secondary mt-1">{reply.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              {threadComments.length === 0 && (
                                <div className="text-center py-8 text-muted">
                                  <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
                                  <p>No comments yet. Be the first to comment!</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Add Comment */}
                          {currentUser && (
                            <div className="mt-4 flex space-x-3">
                              <img
                                src={currentUser.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
                                alt={currentUser.fullName}
                                className="w-8 h-8 rounded-full flex-shrink-0"
                              />
                              <div className="flex-1">
                                <textarea
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                  rows={2}
                                />
                                <div className="flex justify-between items-center mt-2">
                                  {replyingTo && (
                                    <button
                                      onClick={() => setReplyingTo(null)}
                                      className="text-xs text-muted hover:text-primary"
                                    >
                                      Cancel reply
                                    </button>
                                  )}
                                  <div className="flex-1"></div>
                                  <button
                                    onClick={handleCommentSubmit}
                                    disabled={!newComment.trim()}
                                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Send size={14} />
                                    <span>{replyingTo ? 'Reply' : 'Comment'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary">Recent Activity</h3>

                {activitiesLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : activitiesError ? (
                  <div className="text-center py-4 text-red-500">
                    <p>Failed to load activities: {activitiesError}</p>
                  </div>
                ) : (
                  <>
                    {threadActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-4 bg-surface border border-border rounded-lg">
                        <img
                          src={activity.author.avatar}
                          alt={activity.author.fullName}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium text-primary">{activity.author.username}</span>
                            {' '}{activity.description}
                          </p>
                          <p className="text-xs text-muted mt-1">{formatTimeAgo(activity.timestamp)}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-2 ${activity.type === 'solution_accepted' ? 'bg-success' :
                          activity.type === 'bounty_awarded' ? 'bg-warning' :
                            'bg-info'
                          }`} />
                      </div>
                    ))}
                    {threadActivities.length === 0 && (
                      <div className="text-center py-8 text-muted">
                        <Activity size={24} className="mx-auto mb-2 opacity-50" />
                        <p>No activity yet</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold text-primary mb-4">Technical Requirements & Details</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-secondary mb-2">Domain</h4>
                    <p className="text-muted">{thread.domain || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-secondary mb-2">Location</h4>
                    <p className="text-muted">{thread.location || 'Not specified'}</p>
                  </div>
                  {thread.bounty && (
                    <div>
                      <h4 className="font-medium text-secondary mb-2">Bounty Details</h4>
                      <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="text-warning" size={20} />
                          <span className="font-bold text-warning">${thread.bounty.amount.toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted mt-2">{thread.bounty.description}</p>
                        {thread.bounty.deadline && (
                          <p className="text-xs text-muted mt-1">
                            Deadline: {formatDate(thread.bounty.deadline)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Related Threads */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Related Challenges</h3>
              <div className="space-y-3">
                {relatedThreads.map((relatedThread) => (
                  <Link
                    key={relatedThread.id}
                    to={`/thread/${relatedThread.id}`}
                    className="block p-3 rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <p className="font-medium text-primary text-sm line-clamp-2">
                      {relatedThread.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-muted">
                      <span>{relatedThread.solutionCount} solutions</span>
                      <span>•</span>
                      <span>{formatTimeAgo(relatedThread.createdAt)}</span>
                    </div>
                  </Link>
                ))}
                {relatedThreads.length === 0 && (
                  <div className="text-center py-4 text-muted">
                    <p className="text-sm">No related challenges found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Info */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Category</h3>
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white`} style={{ backgroundColor: thread.category.color }}>
                  <span className="text-lg">{thread.category.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-primary">{thread.category.name}</p>
                  <p className="text-sm text-muted">{thread.category.threadCount} threads</p>
                </div>
              </div>
              <p className="text-sm text-muted">{thread.category.description}</p>
              <Link
                to={`/categories/${thread.category.id}`}
                className="inline-flex items-center space-x-1 text-sm text-primary hover:underline mt-3"
              >
                <span>View all in category</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};