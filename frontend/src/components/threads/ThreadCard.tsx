import React from 'react';
import {
  MapPin,
  Clock,
  MessageCircle,
  Users,
  Eye,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Bookmark,
  Globe,
  Shield,
  UserX,
  Zap
} from 'lucide-react';
import type { Thread } from '../../types';
import { UserRole } from '../../types';
import {
  formatTimeAgo,
  formatNumber,
  formatCurrency,
  truncateText,
  getPriorityColor,
  getUrgencyColor,
  getStatusColor,
  getTRLColor
} from '../../utils';
import { useBookmarks } from '../../contexts/BookmarkContext';

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
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const isBookmarkedThread = isBookmarked('thread', thread.id);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isBookmarkedThread) {
        await removeBookmark('thread', thread.id);
      } else {
        await addBookmark('thread', thread.id);
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleClick = () => {
    onView(thread.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-surface border border-border rounded-xl hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer relative ${thread.isSticky ? 'ring-2 ring-primary/20 bg-gradient-to-r from-primary/5 to-transparent' : ''
        } ${compact ? 'p-4' : 'p-6'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {/* Title and Badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className={`font-bold text-primary hover:text-primary-hover ${compact ? 'text-base' : 'text-lg'
                  } line-clamp-2 leading-tight`}>
                  {thread.title}
                </h3>
              </div>

              {/* Status and Priority Badges */}
              <div className="flex items-center flex-wrap gap-2 mb-4">
                <span
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-sm"
                  style={{
                    backgroundColor: `${getStatusColor(thread.status)}15`,
                    color: getStatusColor(thread.status),
                    borderColor: `${getStatusColor(thread.status)}30`
                  }}
                >
                  {thread.status.replace('_', ' ').toUpperCase()}
                </span>

                <span
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-sm"
                  style={{
                    backgroundColor: `${getUrgencyColor(thread.urgency)}15`,
                    color: getUrgencyColor(thread.urgency),
                    borderColor: `${getUrgencyColor(thread.urgency)}30`
                  }}
                >
                  {thread.urgency.toUpperCase()}
                </span>

                {thread.trlLevel && (
                  <span
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-sm"
                    style={{
                      backgroundColor: `${getTRLColor(thread.trlLevel)}15`,
                      color: getTRLColor(thread.trlLevel),
                      borderColor: `${getTRLColor(thread.trlLevel)}30`
                    }}
                  >
                    <Zap size={12} />
                    <span>{thread.trlLevel.toUpperCase()}</span>
                  </span>
                )}

                {thread.domain && (
                  <span className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm">
                    <Globe size={12} />
                    <span>{thread.domain}</span>
                  </span>
                )}

                {thread.isAcceptedSolution && (
                  <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-success/15 text-success text-xs font-semibold rounded-lg border border-success/30 shadow-sm">
                    <CheckCircle size={12} />
                    <span>SOLVED</span>
                  </span>
                )}
              </div>
            </div>

            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              className={`p-2.5 rounded-lg transition-all ${isBookmarkedThread ? 'text-warning bg-warning/20' : 'text-muted hover:text-warning hover:bg-warning/10'
                }`}
            >
              <Bookmark size={16} fill={isBookmarkedThread ? 'currentColor' : 'none'} />
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
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm hover:shadow-md transition-all">
              {thread.category.name}
            </span>
            {thread.tags.slice(0, 3).map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {tag.name}
              </span>
            ))}
            {thread.tags.length > 3 && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs bg-primary/5 text-primary/70 rounded-lg border border-primary/15 shadow-sm">
                +{thread.tags.length - 3} more
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
          <div className="flex items-center justify-between text-xs text-muted border-t border-border pt-3 mt-4">
            <div className="flex items-center space-x-4">
              {/* Author */}
              <div className="flex items-center space-x-2">
                <div className="relative">
                  {thread.isAnonymous ? (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserX size={14} className="text-gray-500" />
                    </div>
                  ) : (
                    <>
                      <img
                        src={thread.author.avatar}
                        alt={thread.author.fullName}
                        className="w-6 h-6 rounded-full ring-2 ring-primary/20"
                      />
                      {thread.author.isVerified && (
                        <Shield size={10} className="absolute -bottom-0.5 -right-0.5 text-primary bg-white rounded-full p-0.5" />
                      )}
                    </>
                  )}
                </div>
                <span className="font-semibold">
                  {thread.isAnonymous ? 'Anonymous' : thread.author.username}
                </span>
                {!thread.isAnonymous && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${thread.author.role === UserRole.WARFIGHTER ? 'bg-primary/10 text-primary' :
                      thread.author.role === UserRole.INNOVATOR ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                    }`}>
                    {thread.author.role}
                  </div>
                )}
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
  );
}; 