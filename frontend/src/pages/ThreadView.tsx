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
  Image as ImageIcon,
  FileText,
  Video
} from 'lucide-react';
import { Header } from '../components/Header';
import { SolutionEditor } from '../components/SolutionEditor';
import { SolutionStatusManager } from '../components/SolutionStatusManager';
import { mockThreads, mockSolutions, mockComments, mockThreadActivities } from '../data/mockData';
import type { Thread, Solution, Comment, ThreadActivity, TRLLevel, SolutionStatus } from '../types';

export const ThreadView: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'solutions' | 'activity' | 'details'>('solutions');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [editingSolution, setEditingSolution] = useState<string | null>(null);

  // Mock current user for permissions
  const currentUser = { 
    id: '1', // warfighter_alpha - thread author
    role: 'warfighter' 
  };

  // Find the thread
  const thread = mockThreads.find(t => t.id === threadId);
  if (!thread) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Thread Not Found</h2>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Get solutions and comments for this thread
  const threadSolutions = mockSolutions.filter(s => s.threadId === threadId);
  const threadComments = mockComments;
  const threadActivities = mockThreadActivities;

  const getTRLColor = (trl?: TRLLevel): string => {
    if (!trl) return 'bg-gray-100 text-gray-800';
    const level = parseInt(trl.replace('trl', ''));
    if (level <= 3) return 'bg-red-100 text-red-800';
    if (level <= 6) return 'bg-orange-100 text-orange-800';
    if (level <= 8) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const handleVote = (type: 'up' | 'down', targetType: 'thread' | 'solution' | 'comment', targetId: string) => {
    console.log(`${type}vote ${targetType} ${targetId}`);
    // TODO: Implement voting logic
  };

  const handleSolutionSubmit = (content: string, attachments: File[], mediaFiles: File[]) => {
    console.log('Submit solution:', { content, attachments, mediaFiles });
    setShowSolutionForm(false);
    // TODO: Implement solution submission
  };

  const handleSolutionEdit = (solutionId: string, content: string, attachments: File[], mediaFiles: File[]) => {
    console.log('Edit solution:', { solutionId, content, attachments, mediaFiles });
    setEditingSolution(null);
    // TODO: Implement solution editing
  };

  const handleStatusUpdate = (solutionId: string, status: SolutionStatus, note: string) => {
    console.log('Update solution status:', { solutionId, status, note });
    // TODO: Implement status update
  };

  const canManageStatus = (solution: Solution) => {
    return currentUser.id === thread.authorId; // Only thread author can manage status
  };

  const canEditSolution = (solution: Solution) => {
    return currentUser.id === solution.author.id; // Only solution author can edit
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery=""
        onSearchChange={() => {}}
        onCreateThread={() => navigate('/create-challenge')}
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-muted mb-6">
          <Link to="/home" className="hover:text-primary">Home</Link>
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
                      <img
                        src={thread.author.avatar}
                        alt={thread.author.fullName}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-medium">{thread.author.username}</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs capitalize">
                        {thread.author.role}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>{formatTimeAgo(thread.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye size={16} />
                      <span>{thread.views} views</span>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      thread.priority === 'critical' ? 'bg-error/10 text-error' :
                      thread.priority === 'high' ? 'bg-warning/10 text-warning' :
                      thread.priority === 'medium' ? 'bg-info/10 text-info' :
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
                  <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors">
                    <Bookmark size={16} />
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {thread.attachments.map((attachment, index) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          {attachment.isImage ? <ImageIcon size={16} className="text-blue-500" /> :
                           attachment.isVideo ? <Video size={16} className="text-purple-500" /> :
                           <FileText size={16} className="text-gray-500" />}
                          <span className="text-sm font-medium truncate">{attachment.originalName}</span>
                        </div>
                        <p className="text-xs text-muted mt-1">{(attachment.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-border">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('solutions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'solutions'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-secondary'
                  }`}
                >
                  Solutions ({threadSolutions.length})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'activity'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-secondary'
                  }`}
                >
                  Activity ({threadActivities.length})
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
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
                        onSubmit={(content, attachments, mediaFiles) => 
                          handleSolutionEdit(solution.id, content, attachments, mediaFiles)
                        }
                        onCancel={() => setEditingSolution(null)}
                        isEdit={true}
                      />
                    ) : (
                      <div
                        className={`bg-surface border rounded-xl p-6 ${
                          solution.isAccepted ? 'border-success shadow-lg' : 'border-border'
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
                              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                                solution.hasUserVoted === 'up'
                                  ? 'bg-success/10 text-success'
                                  : 'hover:bg-surface-hover'
                              }`}
                            >
                              <ThumbsUp size={16} />
                              <span>{solution.upvotes}</span>
                            </button>
                            <button
                              onClick={() => handleVote('down', 'solution', solution.id)}
                              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                                solution.hasUserVoted === 'down'
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

                        {/* Media Attachments */}
                        {solution.mediaAttachments && (
                          <div className="mb-6">
                            {(solution.mediaAttachments.images.length > 0 || solution.mediaAttachments.videos.length > 0) && (
                              <div>
                                <h4 className="font-medium text-primary mb-3">Media Attachments</h4>
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
                                <h4 className="font-medium text-primary mb-3">Documents</h4>
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
                                  </div>
                                  <p className="text-sm text-secondary mt-1">{comment.content}</p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <button className="flex items-center space-x-1 text-xs text-muted hover:text-primary">
                                      <ThumbsUp size={12} />
                                      <span>{comment.upvotes}</span>
                                    </button>
                                    <button className="text-xs text-muted hover:text-primary">
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
                          </div>

                          {/* Add Comment */}
                          <div className="mt-4 flex space-x-3">
                            <img
                              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                              alt="Current user"
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1">
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                rows={2}
                              />
                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={() => {
                                    console.log('Submit comment:', newComment);
                                    setNewComment('');
                                  }}
                                  disabled={!newComment.trim()}
                                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Send size={14} />
                                  <span>Comment</span>
                                </button>
                              </div>
                            </div>
                          </div>
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
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-2 ${
                      activity.type === 'solution_accepted' ? 'bg-success' :
                      activity.type === 'bounty_awarded' ? 'bg-warning' :
                      'bg-info'
                    }`} />
                  </div>
                ))}
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
                            Deadline: {thread.bounty.deadline.toLocaleDateString()}
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
            {/* Quick Stats */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Solutions</span>
                  <span className="font-medium">{threadSolutions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Comments</span>
                  <span className="font-medium">{thread.commentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Views</span>
                  <span className="font-medium">{thread.views}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Upvotes</span>
                  <span className="font-medium">{thread.upvotes}</span>
                </div>
              </div>
            </div>

            {/* Author Info */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Author</h3>
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={thread.author.avatar}
                  alt={thread.author.fullName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium text-primary">{thread.author.username}</p>
                  <p className="text-sm text-muted capitalize">{thread.author.role}</p>
                  <div className="flex items-center space-x-1 text-xs text-warning">
                    <Star size={12} fill="currentColor" />
                    <span>{thread.author.reputation}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Threads Created</span>
                  <span className="font-medium">{thread.author.stats.threadsCreated}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Solutions Posted</span>
                  <span className="font-medium">{thread.author.stats.solutionsPosted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Success Rate</span>
                  <span className="font-medium text-success">
                    {Math.round((thread.author.stats.solutionsAccepted / Math.max(thread.author.stats.solutionsPosted, 1)) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Related Threads */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Related Challenges</h3>
              <div className="space-y-3">
                {mockThreads.slice(0, 3).filter(t => t.id !== threadId).map((relatedThread) => (
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