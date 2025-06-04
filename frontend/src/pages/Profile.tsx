import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Star,
  Award,
  Lightbulb,
  Shield,
  MessageCircle,
  ThumbsUp,
  TrendingUp,
  Users,
  Eye,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Edit3,
  Download,
  Filter,
  BarChart3,
  Activity,
  Zap,
  Bookmark,
  X,
  Save,
  UserPlus,
  UserX,
  Search,
  SortDesc
} from 'lucide-react';
import { Header } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarkContext';
import { useThreads } from '../hooks';
import { UserRole } from '../types';
import { formatTimeAgo, formatDate } from '../utils';
import type { User, Thread, Solution, UserStats } from '../types';
import { Priority } from '../types';
import { authAPI, usersAPI } from '../services/api';

export const Profile: React.FC = () => {
  const { user: currentUser, logout } = useAuth();
  const { bookmarkedThreads, bookmarkedUsers } = useBookmarks();
  const { id: userId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Determine if viewing own profile or another user's profile - MOVED UP
  const isOwnProfile = !userId || userId === currentUser?.id;
  const profileUserId = isOwnProfile ? currentUser?.id : userId;

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'portfolio' | 'stats' | 'bookmarks'>('overview');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(isOwnProfile ? currentUser : null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    bio: '',
    location: '',
    expertise: [] as string[],
    email: ''
  });

  // State for user data from API
  const [userThreads, setUserThreads] = useState<Thread[]>([]);
  const [userSolutions, setUserSolutions] = useState<Solution[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!profileUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load user profile (only if not own profile, since we already have currentUser)
        if (!isOwnProfile) {
          const userResponse = await usersAPI.getById(profileUserId);
          setProfileUser(userResponse.user);
        } else if (currentUser) {
          setProfileUser(currentUser);
        }

        // Load user data in parallel
        const promises = [
          usersAPI.getUserThreads(profileUserId, { page: 1, limit: 10 }),
          usersAPI.getUserSolutions(profileUserId, { page: 1, limit: 10 }),
          usersAPI.getUserStats(profileUserId),
          usersAPI.getUserBadges(profileUserId),
          usersAPI.getUserActivities(profileUserId, { page: 1, limit: 10 }),
        ];

        const results = await Promise.all(promises);
        const [threadsResponse, solutionsResponse, statsResponse, badgesResponse, activitiesResponse] = results;

        setUserThreads(threadsResponse.threads || []);
        setUserSolutions(solutionsResponse.solutions || []);
        setUserStats(statsResponse.stats || {});
        setUserBadges(badgesResponse.badges || []);
        setUserActivities(activitiesResponse.activities || []);
      } catch (error) {
        console.error('Failed to load user data:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [profileUserId, isOwnProfile, currentUser]);

  // Handle follow user
  const handleFollowUser = async () => {
    if (!profileUserId || isOwnProfile) return;

    try {
      await usersAPI.followUser(profileUserId);
      // You could update UI state here to show followed status
      console.log('User followed successfully');
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  // Initialize edit form with current user data
  useEffect(() => {
    if (profileUser) {
      setEditForm({
        fullName: profileUser.fullName,
        bio: profileUser.bio || '',
        location: profileUser.location || '',
        expertise: [...profileUser.expertise],
        email: profileUser.email
      });
    }
  }, [profileUser]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          searchQuery=""
          onSearchChange={() => { }}
          onCreateThread={() => navigate('/create-challenge')}
        />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          searchQuery=""
          onSearchChange={() => { }}
          onCreateThread={() => navigate('/create-challenge')}
        />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-4">Error Loading Profile</h2>
              <p className="text-muted mb-6">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          searchQuery=""
          onSearchChange={() => { }}
          onCreateThread={() => navigate('/create-challenge')}
        />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary mb-4">User Not Found</h2>
              <p className="text-muted mb-6">The user you're looking for doesn't exist or has been deactivated.</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.WARFIGHTER:
        return <Shield className="text-primary" size={16} />;
      case UserRole.INNOVATOR:
        return <Lightbulb className="text-warning" size={16} />;
      case UserRole.MODERATOR:
        return <Award className="text-success" size={16} />;
      case UserRole.ADMIN:
        return <Star className="text-error" size={16} />;
      default:
        return <Users className="text-muted" size={16} />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.WARFIGHTER:
        return 'text-primary bg-primary/10 border-primary/20';
      case UserRole.INNOVATOR:
        return 'text-warning bg-warning/10 border-warning/20';
      case UserRole.MODERATOR:
        return 'text-success bg-success/10 border-success/20';
      case UserRole.ADMIN:
        return 'text-error bg-error/10 border-error/20';
      default:
        return 'text-muted bg-background-alt border-border';
    }
  };

  const handleSaveProfile = async () => {
    if (!profileUser || !isOwnProfile) return;

    try {
      const response = await usersAPI.updateUserProfile(profileUser.id, editForm);
      setProfileUser(response.user);
      setIsEditModalOpen(false);
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      // You could show an error message to the user here
    }
  };

  const addExpertise = (expertise: string) => {
    if (expertise.trim() && !editForm.expertise.includes(expertise.trim())) {
      setEditForm(prev => ({
        ...prev,
        expertise: [...prev.expertise, expertise.trim()]
      }));
    }
  };

  const removeExpertise = (expertiseToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      expertise: prev.expertise.filter(exp => exp !== expertiseToRemove)
    }));
  };

  const renderRoleSpecificContent = () => {
    switch (profileUser.role) {
      case UserRole.WARFIGHTER:
        return (
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Recent Challenges</h3>
              <div className="space-y-3">
                {userThreads.slice(0, 3).map(thread => (
                  <Link
                    key={thread.id}
                    to={`/thread/${thread.id}`}
                    className="flex items-center justify-between p-3 bg-background-alt rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <div>
                      <p className="font-medium text-primary line-clamp-1">{thread.title}</p>
                      <p className="text-sm text-muted">{thread.solutionCount} solutions • {formatTimeAgo(thread.createdAt)}</p>
                    </div>
                    <ExternalLink size={16} className="text-muted" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );

      case UserRole.INNOVATOR:
        return (
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Top Solutions</h3>
              <div className="space-y-3">
                {userSolutions.slice(0, 3).map(solution => {
                  const relatedThread = userThreads.find(t => t.id === solution.threadId);
                  return (
                    <Link
                      key={solution.id}
                      to={`/thread/${solution.threadId}`}
                      className="block p-3 bg-background-alt rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary">Solution #{solution.id}</span>
                        <div className="flex items-center space-x-2">
                          <ThumbsUp size={14} className="text-muted" />
                          <span className="text-sm text-muted">{solution.upvotes}</span>
                          <ExternalLink size={12} className="text-muted" />
                        </div>
                      </div>
                      {relatedThread && (
                        <p className="text-xs text-info mb-2">→ {relatedThread.title}</p>
                      )}
                      <p className="text-sm text-muted line-clamp-2" dangerouslySetInnerHTML={{ __html: solution.content }} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case UserRole.MODERATOR:
        return (
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4 flex items-center space-x-2">
                <Shield size={20} />
                <span>Administrative Access</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted">Role:</span>
                  <p className="font-medium">Platform Administrator</p>
                </div>
                <div>
                  <span className="text-muted">Permissions:</span>
                  <p className="font-medium">Full Solution Management</p>
                </div>
                <div>
                  <span className="text-muted">User Management:</span>
                  <p className="font-medium">Active User Oversight</p>
                </div>
                <div>
                  <span className="text-muted">Content Control:</span>
                  <p className="font-medium">Thread & Solution Validation</p>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4 flex items-center space-x-2">
                <UserPlus size={20} />
                <span>User Validation</span>
              </h3>
              <div className="space-y-4">
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                        alt="Pending user"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-primary">Dr. Michael Zhang</p>
                        <p className="text-sm text-muted">@tech_specialist • Pending Validation</p>
                        <p className="text-xs text-muted">Applied for: Innovator Role</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-success/10 text-success border border-success/20 rounded-lg hover:bg-success/20 transition-colors text-sm">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-error/10 text-error border border-error/20 rounded-lg hover:bg-error/20 transition-colors text-sm">
                        Reject
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-muted">
                    <p><strong>Credentials:</strong> PhD in Robotics, MIT • 12+ years experience</p>
                    <p><strong>Specialization:</strong> Autonomous Systems, AI/ML, Drone Hardware</p>
                    <p><strong>Security Clearance:</strong> Secret Level</p>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face"
                        alt="Pending user"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-primary">Sergeant Jake Miller</p>
                        <p className="text-sm text-muted">@combat_ops • Pending Validation</p>
                        <p className="text-xs text-muted">Applied for: Warfighter Role</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-success/10 text-success border border-success/20 rounded-lg hover:bg-success/20 transition-colors text-sm">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-error/10 text-error border border-error/20 rounded-lg hover:bg-error/20 transition-colors text-sm">
                        Reject
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-muted">
                    <p><strong>Service:</strong> U.S. Army Rangers • 6 years active duty</p>
                    <p><strong>Specialization:</strong> Combat Operations, Tactical Reconnaissance</p>
                    <p><strong>Deployments:</strong> Afghanistan, Iraq</p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button className="text-sm text-primary hover:underline">
                    View All Pending Validations (5 more)
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4 flex items-center space-x-2">
                <Users size={20} />
                <span>User Management</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-info/10 border border-info/20 rounded-lg p-4 text-center">
                    <Users className="text-info mx-auto mb-2" size={24} />
                    <div className="text-2xl font-bold text-info">-</div>
                    <div className="text-sm text-muted">Total Users</div>
                  </div>
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-center">
                    <Shield className="text-warning mx-auto mb-2" size={24} />
                    <div className="text-2xl font-bold text-warning">-</div>
                    <div className="text-sm text-muted">Warfighters</div>
                  </div>
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                    <Lightbulb className="text-success mx-auto mb-2" size={24} />
                    <div className="text-2xl font-bold text-success">-</div>
                    <div className="text-sm text-muted">Innovators</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4 flex items-center space-x-2">
                <BarChart3 size={20} />
                <span>Platform Statistics</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{userThreads.length}</div>
                  <div className="text-sm text-muted">Active Threads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{userSolutions.length}</div>
                  <div className="text-sm text-muted">Total Solutions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">
                    {userSolutions.filter(s => s.status === 'approved').length}
                  </div>
                  <div className="text-sm text-muted">Approved Solutions</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery=""
        onSearchChange={() => { }}
        onCreateThread={() => navigate('/create-challenge')}
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-muted hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-surface border border-border rounded-xl p-6 text-center">
              <div className="relative mb-4">
                <img
                  src={profileUser.avatar}
                  alt={profileUser.fullName}
                  className="w-24 h-24 rounded-full mx-auto border-4 border-background shadow-lg"
                />
              </div>

              <h2 className="text-xl font-bold text-primary mb-1">{profileUser.fullName}</h2>
              <p className="text-muted mb-3">@{profileUser.username}</p>

              <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-lg border text-sm font-medium mb-4 ${getRoleColor(profileUser.role)}`}>
                {getRoleIcon(profileUser.role)}
                <span className="capitalize">{profileUser.role}</span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm text-left border-t border-border pt-4">
                {profileUser.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin size={16} className="text-muted" />
                    <span>{profileUser.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-muted" />
                  <span>Joined {formatTimeAgo(profileUser.joinDate)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-6">
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    <Edit3 size={16} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                      <Mail size={16} className="mx-auto" />
                    </button>
                    <button className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors">
                      <Bookmark size={16} className="mx-auto" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Expertise */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {profileUser.expertise.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Bio */}
            {profileUser.bio && (
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold text-primary mb-3">About</h3>
                <p className="text-secondary leading-relaxed">{profileUser.bio}</p>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-b border-border">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-secondary'
                    }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'activity'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-secondary'
                    }`}
                >
                  Activity
                </button>
                {profileUser.role !== UserRole.MODERATOR && (
                  <>
                    <button
                      onClick={() => setActiveTab('portfolio')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'portfolio'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted hover:text-secondary'
                        }`}
                    >
                      Portfolio
                    </button>
                    <button
                      onClick={() => setActiveTab('stats')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'stats'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted hover:text-secondary'
                        }`}
                    >
                      Statistics
                    </button>
                  </>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab('bookmarks')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookmarks'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted hover:text-secondary'
                      }`}
                  >
                    Bookmarks
                  </button>
                )}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {renderRoleSpecificContent()}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="bg-surface border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-primary">Recent Activity</h3>
                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value as any)}
                      className="px-3 py-2 border border-border rounded-lg text-sm"
                    >
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                      <option value="year">Past Year</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    {userActivities.map(activity => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-background-alt rounded-lg">
                        <div className={`w-3 h-3 rounded-full mt-2 ${activity.type === 'solution_accepted' ? 'bg-success' :
                          activity.type === 'bounty_awarded' ? 'bg-warning' :
                            'bg-info'
                          }`} />
                        <div className="flex-1">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted mt-1">{formatTimeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                {/* For Innovators - Show only Solutions */}
                {profileUser.role === UserRole.INNOVATOR && (
                  <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="font-semibold text-primary mb-4">Solutions Contributed</h3>
                    <div className="space-y-3">
                      {userSolutions.map(solution => {
                        return (
                          <Link
                            key={solution.id}
                            to={`/thread/${solution.thread.id}`}
                            className="block p-3 bg-background-alt rounded-lg hover:bg-surface-hover transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-primary">
                                Solution #{solution.id}
                              </span>
                              <div className="flex items-center space-x-1">
                                <ThumbsUp size={12} className="text-muted" />
                                <span className="text-xs text-muted">{solution.upvotes}</span>
                                <ExternalLink size={10} className="text-muted" />
                              </div>
                            </div>
                            <p className="text-xs text-info mb-1">→ {solution.thread.title}</p>
                            <p className="text-xs text-muted line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: solution.content }} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* For Warfighters - Show only Challenges */}
                {profileUser.role === UserRole.WARFIGHTER && (
                  <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="font-semibold text-primary mb-4">Challenges Posted</h3>
                    <div className="space-y-3">
                      {userThreads.map(thread => (
                        <Link
                          key={thread.id}
                          to={`/thread/${thread.id}`}
                          className="block p-3 bg-background-alt rounded-lg hover:bg-surface-hover transition-colors"
                        >
                          <p className="font-medium text-primary line-clamp-2 mb-1">{thread.title}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted">
                            <span>{thread.solutionCount} solutions</span>
                            <span>{thread.upvotes} upvotes</span>
                            <span>{formatTimeAgo(thread.createdAt)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* For Other Roles - Show both */}
                {(profileUser.role !== UserRole.WARFIGHTER && profileUser.role !== UserRole.INNOVATOR) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Threads */}
                    <div className="bg-surface border border-border rounded-xl p-6">
                      <h3 className="font-semibold text-primary mb-4">Challenges Posted</h3>
                      <div className="space-y-3">
                        {userThreads.map(thread => (
                          <Link
                            key={thread.id}
                            to={`/thread/${thread.id}`}
                            className="block p-3 bg-background-alt rounded-lg hover:bg-surface-hover transition-colors"
                          >
                            <p className="font-medium text-primary line-clamp-2 mb-1">{thread.title}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted">
                              <span>{thread.solutionCount} solutions</span>
                              <span>{thread.upvotes} upvotes</span>
                              <span>{formatTimeAgo(thread.createdAt)}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Solutions */}
                    <div className="bg-surface border border-border rounded-xl p-6">
                      <h3 className="font-semibold text-primary mb-4">Solutions Contributed</h3>
                      <div className="space-y-3">
                        {userSolutions.map(solution => {
                          const relatedThread = userThreads.find(t => t.id === solution.threadId);
                          return (
                            <Link
                              key={solution.id}
                              to={`/thread/${solution.threadId}`}
                              className="block p-3 bg-background-alt rounded-lg hover:bg-surface-hover transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-primary">
                                  Solution #{solution.id}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <ThumbsUp size={12} className="text-muted" />
                                  <span className="text-xs text-muted">{solution.upvotes}</span>
                                  <ExternalLink size={10} className="text-muted" />
                                </div>
                              </div>
                              {relatedThread && (
                                <p className="text-xs text-info mb-1">→ {relatedThread.title}</p>
                              )}
                              <p className="text-xs text-muted line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: solution.content }} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="bg-surface border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-primary mb-4 flex items-center space-x-2">
                    <BarChart3 size={20} />
                    <span>
                      {profileUser.role === UserRole.WARFIGHTER ? 'Challenge Metrics' :
                        profileUser.role === UserRole.INNOVATOR ? 'Solution Metrics' :
                          'Contribution Metrics'}
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {profileUser.role === UserRole.WARFIGHTER && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Challenges Posted</span>
                          <span className="font-medium">{profileUser.stats.threadsCreated}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Solutions Received</span>
                          <span className="font-medium">{userThreads.reduce((acc, thread) => acc + thread.solutionCount, 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Solutions Accepted</span>
                          <span className="font-medium">{profileUser.stats.solutionsAccepted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Comments Made</span>
                          <span className="font-medium">{profileUser.stats.commentsPosted}</span>
                        </div>
                      </>
                    )}

                    {profileUser.role === UserRole.INNOVATOR && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Solutions Posted</span>
                          <span className="font-medium">{profileUser.stats.solutionsPosted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Solutions Accepted</span>
                          <span className="font-medium">{profileUser.stats.solutionsAccepted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Comments Made</span>
                          <span className="font-medium">{profileUser.stats.commentsPosted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Upvotes Received</span>
                          <span className="font-medium">{profileUser.stats.upvotesReceived}</span>
                        </div>
                      </>
                    )}

                    {(profileUser.role !== UserRole.WARFIGHTER && profileUser.role !== UserRole.INNOVATOR) && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Threads Created</span>
                          <span className="font-medium">{profileUser.stats.threadsCreated}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Solutions Posted</span>
                          <span className="font-medium">{profileUser.stats.solutionsPosted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Comments Made</span>
                          <span className="font-medium">{profileUser.stats.commentsPosted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Upvotes Received</span>
                          <span className="font-medium">{profileUser.stats.upvotesReceived}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">Solutions Accepted</span>
                          <span className="font-medium">{profileUser.stats.solutionsAccepted}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bookmarks' && isOwnProfile && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bookmarked People */}
                  <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="font-semibold text-primary mb-4 flex items-center space-x-2">
                      <Users size={20} />
                      <span>Bookmarked People</span>
                    </h3>
                    <div className="space-y-4">
                      {bookmarkedUsers.map(user => (
                        <Link
                          key={user.id}
                          to={`/profile/${user.id}`}
                          className="flex items-center space-x-3 p-3 bg-background-alt rounded-lg hover:bg-surface-hover transition-colors"
                        >
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-primary text-sm">{user.fullName}</h4>
                            <p className="text-xs text-muted">@{user.username}</p>
                            <div className="flex items-center space-x-1 mt-1">
                              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                {getRoleIcon(user.role)}
                                <span className="capitalize">{user.role}</span>
                              </div>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-muted" />
                        </Link>
                      ))}
                      {bookmarkedUsers.length === 0 && (
                        <div className="text-center py-6">
                          <UserPlus size={32} className="text-muted mx-auto mb-2" />
                          <p className="text-sm text-muted">No bookmarked people</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bookmarked Threads */}
                  <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="font-semibold text-primary mb-4 flex items-center space-x-2">
                      <FileText size={20} />
                      <span>Bookmarked Threads</span>
                    </h3>
                    <div className="space-y-4">
                      {bookmarkedThreads.map(thread => (
                        <Link
                          key={thread.id}
                          to={`/thread/${thread.id}`}
                          className="block p-3 bg-background-alt rounded-lg hover:bg-surface-hover transition-colors"
                        >
                          <h4 className="font-medium text-primary text-sm line-clamp-2 mb-2">{thread.title}</h4>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 text-xs text-muted">
                              <span>{thread.solutionCount} solutions</span>
                              <span>{thread.upvotes} upvotes</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${thread.priority === Priority.CRITICAL ? 'bg-error/10 text-error' :
                                thread.priority === Priority.HIGH ? 'bg-warning/10 text-warning' :
                                  thread.priority === Priority.MEDIUM ? 'bg-info/10 text-info' :
                                    'bg-success/10 text-success'
                                }`}>
                                {thread.priority.toUpperCase()}
                              </span>
                              <ExternalLink size={12} className="text-muted" />
                            </div>
                          </div>
                        </Link>
                      ))}
                      {bookmarkedThreads.length === 0 && (
                        <div className="text-center py-6">
                          <Bookmark size={32} className="text-muted mx-auto mb-2" />
                          <p className="text-sm text-muted">No bookmarked threads</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-primary">Edit Profile</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-muted hover:text-primary"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="City, State/Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Expertise</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {editForm.expertise.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm border border-primary/20"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => removeExpertise(skill)}
                          className="text-primary hover:text-primary-hover"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add expertise (press Enter)"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addExpertise((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border">
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-background-alt transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 