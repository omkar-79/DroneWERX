import React from 'react';
import {
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Eye,
  Clock,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Star,
  Shield,
  Pin,
  Users
} from 'lucide-react';
import type { Thread } from '../types';
import { 
  formatTimeAgo, 
  formatNumber, 
  formatCurrency, 
  truncateText,
  getPriorityColor,
  getUrgencyColor,
  getClassificationColor,
  getStatusColor
} from '../utils';
import { useVoting, useFavorites } from '../hooks';

interface ThreadCardProps {
  thread: Thread;
  onView: (threadId: string) => void;
  compact?: boolean;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({ 
  thread, 
  onView, 
  compact = false 
}) => {
  const { vote, getUserVote } = useVoting();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  const userVote = getUserVote(thread.id);
  const isUpvoted = userVote === 'upvote';
  const isDownvoted = userVote === 'downvote';
  const isFav = isFavorite(thread.id);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    vote(thread.id, 'upvote');
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    vote(thread.id, 'downvote');
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(thread.id);
  };

  const handleClick = () => {
    onView(thread.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-surface border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer relative ${
        thread.isSticky ? 'ring-2 ring-primary/20 bg-gradient-to-r from-primary/5 to-transparent' : ''
      } ${compact ? 'p-4' : 'p-6'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {/* Voting */}
          <div className="flex flex-col items-center space-y-1 flex-shrink-0 bg-background-alt rounded-lg p-2">
            <button
              onClick={handleUpvote}
              className={`p-1.5 rounded-lg transition-all ${
                isUpvoted ? 'text-success bg-success/20 shadow-sm' : 'text-muted hover:text-success hover:bg-success/10'
              }`}
            >
              <ArrowUp size={16} />
            </button>
            <span className={`text-sm font-bold ${
              isUpvoted ? 'text-success' : isDownvoted ? 'text-error' : 'text-secondary'
            }`}>
              {formatNumber(thread.upvotes - thread.downvotes)}
            </span>
            <button
              onClick={handleDownvote}
              className={`p-1.5 rounded-lg transition-all ${
                isDownvoted ? 'text-error bg-error/20 shadow-sm' : 'text-muted hover:text-error hover:bg-error/10'
              }`}
            >
              <ArrowDown size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Badges */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  {thread.isSticky && (
                    <Pin size={14} className="text-primary flex-shrink-0" />
                  )}
                  <h3 className={`font-bold text-primary hover:text-primary-hover ${
                    compact ? 'text-base' : 'text-lg'
                  } line-clamp-2 leading-tight`}>
                    {thread.title}
                  </h3>
                </div>
                
                {/* Status and Priority Badges */}
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span
                    className="px-3 py-1 text-xs font-semibold rounded-full"
                    style={{ 
                      backgroundColor: `${getStatusColor(thread.status)}20`,
                      color: getStatusColor(thread.status)
                    }}
                  >
                    {thread.status.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  <span
                    className="px-3 py-1 text-xs font-semibold rounded-full"
                    style={{ 
                      backgroundColor: `${getPriorityColor(thread.priority)}20`,
                      color: getPriorityColor(thread.priority)
                    }}
                  >
                    {thread.priority.toUpperCase()}
                  </span>

                  <span
                    className="px-3 py-1 text-xs font-semibold rounded-full"
                    style={{ 
                      backgroundColor: `${getUrgencyColor(thread.urgency)}20`,
                      color: getUrgencyColor(thread.urgency)
                    }}
                  >
                    {thread.urgency.toUpperCase()}
                  </span>

                  <span
                    className="px-3 py-1 text-xs font-semibold rounded-full"
                    style={{ 
                      backgroundColor: `${getClassificationColor(thread.classification)}20`,
                      color: getClassificationColor(thread.classification)
                    }}
                  >
                    {thread.classification.toUpperCase()}
                  </span>

                  {thread.isAcceptedSolution && (
                    <span className="flex items-center space-x-1 px-3 py-1 bg-success/10 text-success text-xs font-semibold rounded-full">
                      <CheckCircle size={12} />
                      <span>SOLVED</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Favorite Button */}
              <button
                onClick={handleFavorite}
                className={`p-2 rounded-lg transition-all ${
                  isFav ? 'text-warning bg-warning/20' : 'text-muted hover:text-warning hover:bg-warning/10'
                }`}
              >
                <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Description */}
            {!compact && (
              <p className="text-secondary text-sm mb-4 line-clamp-2 leading-relaxed">
                {truncateText(thread.description, 150)}
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span 
                className="px-3 py-1.5 text-xs font-medium rounded-full border"
                style={{ 
                  backgroundColor: `${thread.category.color}15`,
                  color: thread.category.color,
                  borderColor: `${thread.category.color}30`
                }}
              >
                {thread.category.name}
              </span>
              {thread.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag.id}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border"
                  style={{ 
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                    borderColor: `${tag.color}30`
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {thread.tags.length > 3 && (
                <span className="px-3 py-1.5 text-xs bg-background-alt text-muted rounded-full border border-border">
                  +{thread.tags.length - 3}
                </span>
              )}
            </div>

            {/* Bounty */}
            {thread.bounty && (
              <div className="flex items-center space-x-2 mb-4 p-3 bg-gradient-to-r from-warning/10 to-warning/5 rounded-lg border border-warning/20">
                <DollarSign size={16} className="text-warning" />
                <span className="text-sm font-bold text-warning">
                  {formatCurrency(thread.bounty.amount)} Bounty
                </span>
                {thread.bounty.deadline && (
                  <span className="text-xs text-muted">
                    Expires {formatTimeAgo(thread.bounty.deadline)}
                  </span>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-muted border-t border-border pt-3">
              <div className="flex items-center space-x-4">
                {/* Author */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <img
                      src={thread.author.avatar}
                      alt={thread.author.fullName}
                      className="w-6 h-6 rounded-full ring-2 ring-primary/20"
                    />
                    {thread.author.isVerified && (
                      <Shield size={10} className="absolute -bottom-0.5 -right-0.5 text-primary bg-white rounded-full p-0.5" />
                    )}
                  </div>
                  <span className="font-semibold">{thread.author.username}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    thread.author.role === 'warfighter' 
                      ? 'bg-error/10 text-error' 
                      : 'bg-info/10 text-info'
                  }`}>
                    {thread.author.role}
                  </span>
                </div>

                {/* Location */}
                {thread.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin size={12} />
                    <span>{thread.location}</span>
                  </div>
                )}

                {/* Time */}
                <div className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{formatTimeAgo(thread.createdAt)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Eye size={12} />
                  <span>{formatNumber(thread.views)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle size={12} />
                  <span>{formatNumber(thread.commentCount)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users size={12} />
                  <span>{formatNumber(thread.solutionCount)} solutions</span>
                </div>
                {thread.hotScore > 50 && (
                  <div className="flex items-center space-x-1 text-warning">
                    <AlertTriangle size={12} />
                    <span>Hot</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 