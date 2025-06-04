import express from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { logStructured } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get user by ID (public profile view)
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        bio: true,
        location: true,
        expertise: true,
        role: true,
        joinDate: true,
        lastLoginAt: true,
        serviceBranch: true,
        yearsOfService: true,
        deploymentHistory: true,
        securityClearance: true,
        stats: true,
        _count: {
          select: {
            threads: true,
            solutions: true,
            comments: true,
          }
        }
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logStructured.error('Get user failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user threads
router.get('/:id/threads', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [threads, totalCount] = await Promise.all([
      prisma.thread.findMany({
        where: { authorId: id },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          urgency: true,
          trlLevel: true,
          views: true,
          upvotes: true,
          downvotes: true,
          solutionCount: true,
          commentCount: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            }
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                }
              }
            }
          },
          _count: {
            select: {
              solutions: true,
              comments: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.thread.count({
        where: { authorId: id }
      })
    ]);

    res.json({
      threads: threads.map(thread => ({
        ...thread,
        tags: thread.tags.map(t => t.tag)
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    logStructured.error('Get user threads failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user solutions
router.get('/:id/solutions', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [solutions, totalCount] = await Promise.all([
      prisma.solution.findMany({
        where: { authorId: id },
        select: {
          id: true,
          title: true,
          content: true,
          status: true,
          trlLevel: true,
          estimatedCost: true,
          implementationTime: true,
          upvotes: true,
          downvotes: true,
          isAccepted: true,
          createdAt: true,
          updatedAt: true,
          thread: {
            select: {
              id: true,
              title: true,
              status: true,
            }
          },
          _count: {
            select: {
              comments: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.solution.count({
        where: { authorId: id }
      })
    ]);

    res.json({
      solutions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    logStructured.error('Get user solutions failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user activity/engagement stats
router.get('/:id/stats', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    // Get user stats
    const userStats = await prisma.userStats.findUnique({
      where: { userId: id }
    });

    if (!userStats) {
      res.status(404).json({ error: 'User stats not found' });
      return;
    }

    // Get additional calculated stats
    const [
      totalVotesReceived,
      totalSolutionsAccepted,
      threadViewsTotal,
      recentActivity
    ] = await Promise.all([
      // Total upvotes received on user's content (using polymorphic votes)
      prisma.vote.count({
        where: {
          type: 'UPVOTE',
          OR: [
            {
              targetType: 'thread',
              targetId: {
                in: await prisma.thread.findMany({
                  where: { authorId: id },
                  select: { id: true }
                }).then(threads => threads.map(t => t.id))
              }
            },
            {
              targetType: 'solution',
              targetId: {
                in: await prisma.solution.findMany({
                  where: { authorId: id },
                  select: { id: true }
                }).then(solutions => solutions.map(s => s.id))
              }
            },
            {
              targetType: 'comment',
              targetId: {
                in: await prisma.comment.findMany({
                  where: { authorId: id },
                  select: { id: true }
                }).then(comments => comments.map(c => c.id))
              }
            }
          ]
        }
      }),
      
      // Solutions accepted by the user's threads
      prisma.solution.count({
        where: {
          thread: { authorId: id },
          isAccepted: true
        }
      }),

      // Total views on user's threads
      prisma.thread.aggregate({
        where: { authorId: id },
        _sum: {
          views: true
        }
      }),

      // Recent activity (last 30 days)
      prisma.threadActivity.findMany({
        where: {
          userId: id,
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          type: true,
          timestamp: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      })
    ]);

    const stats = {
      ...userStats,
      totalVotesReceived,
      totalSolutionsAccepted,
      threadViewsTotal: threadViewsTotal._sum.views || 0,
      recentActivityCount: recentActivity.length,
      recentActivity,
    };

    res.json({ stats });
  } catch (error) {
    logStructured.error('Get user stats failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user bookmarks (requires authentication)
router.get('/:id/bookmarks', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { type = 'all' } = req.query; // 'threads', 'users', or 'all'

    // Get user's bookmarks based on type
    const whereClause: any = { userId: id };
    
    if (type !== 'all') {
      whereClause.targetType = type === 'threads' ? 'thread' : type === 'users' ? 'user' : type;
    }

    const bookmarks = await prisma.bookmark.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch the actual bookmarked items
    const threadIds = bookmarks.filter(b => b.targetType === 'thread').map(b => b.targetId);
    const userIds = bookmarks.filter(b => b.targetType === 'user').map(b => b.targetId);
    const solutionIds = bookmarks.filter(b => b.targetType === 'solution').map(b => b.targetId);

    const [threads, users, solutions] = await Promise.all([
      threadIds.length > 0 ? prisma.thread.findMany({
        where: { id: { in: threadIds } },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          upvotes: true,
          solutionCount: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              color: true,
            }
          }
        }
      }) : [],
      
      userIds.length > 0 ? prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
          role: true,
          expertise: true,
          stats: true,
        }
      }) : [],
      
      solutionIds.length > 0 ? prisma.solution.findMany({
        where: { id: { in: solutionIds } },
        select: {
          id: true,
          title: true,
          content: true,
          upvotes: true,
          isAccepted: true,
          createdAt: true,
          thread: {
            select: {
              id: true,
              title: true,
            }
          },
          author: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            }
          }
        }
      }) : []
    ]);

    res.json({
      bookmarks: {
        threads,
        users,
        solutions,
        count: {
          threads: threads.length,
          users: users.length,
          solutions: solutions.length,
          total: bookmarks.length,
        }
      }
    });
  } catch (error) {
    logStructured.error('Get user bookmarks failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow/unfollow user (requires authentication)
router.post('/:id/follow', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id: targetUserId } = req.params;
    const followerId = req.user!.id;

    if (targetUserId === followerId) {
      res.status(400).json({ error: 'Cannot follow yourself' });
      return;
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id }
      });

      res.json({ 
        message: 'User unfollowed successfully',
        isFollowing: false
      });
    } else {
      // Follow
      await Promise.all([
        prisma.follow.create({
          data: {
            followerId,
            followingId: targetUserId
          }
        }),
        
        // Create notification for the followed user
        prisma.notification.create({
          data: {
            userId: targetUserId,
            type: 'MENTION', // Using existing enum value
            title: 'New Follower',
            message: `${req.user!.username} started following you`,
            data: {
              followerId,
              followerUsername: req.user!.username,
              type: 'follow'
            }
          }
        })
      ]);

      res.json({ 
        message: 'User followed successfully',
        isFollowing: true
      });
    }
  } catch (error) {
    logStructured.error('Follow user failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add bookmark endpoint
router.post('/:id/bookmark', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id: targetId } = req.params;
    const { type } = req.body; // 'thread', 'solution', or 'user'
    const userId = req.user!.id;

    if (!['thread', 'solution', 'user'].includes(type)) {
      res.status(400).json({ error: 'Invalid bookmark type' });
      return;
    }

    // Check if target exists based on type
    let targetExists = false;
    switch (type) {
      case 'thread':
        targetExists = !!(await prisma.thread.findUnique({ where: { id: targetId } }));
        break;
      case 'solution':
        targetExists = !!(await prisma.solution.findUnique({ where: { id: targetId } }));
        break;
      case 'user':
        targetExists = !!(await prisma.user.findUnique({ where: { id: targetId } }));
        break;
    }

    if (!targetExists) {
      res.status(404).json({ error: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
      return;
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId,
          targetType: type
        }
      }
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.bookmark.delete({
        where: { id: existingBookmark.id }
      });

      res.json({ 
        message: 'Bookmark removed successfully',
        isBookmarked: false
      });
    } else {
      // Add bookmark
      await prisma.bookmark.create({
        data: {
          userId,
          targetId,
          targetType: type
        }
      });

      res.json({ 
        message: 'Bookmark added successfully',
        isBookmarked: true
      });
    }
  } catch (error) {
    logStructured.error('Bookmark failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user followers
router.get('/:id/followers', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [followers, totalCount] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: id },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              bio: true,
              role: true,
              expertise: true,
              stats: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.follow.count({
        where: { followingId: id }
      })
    ]);

    res.json({
      followers: followers.map(f => f.follower),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    logStructured.error('Get user followers failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user following
router.get('/:id/following', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [following, totalCount] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: id },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              bio: true,
              role: true,
              expertise: true,
              stats: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.follow.count({
        where: { followerId: id }
      })
    ]);

    res.json({
      following: following.map(f => f.following),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    logStructured.error('Get user following failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user badges/achievements
router.get('/:id/badges', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    // Since we don't have a badges table, we'll calculate achievements based on stats
    const userStats = await prisma.userStats.findUnique({
      where: { userId: id }
    });

    if (!userStats) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const badges = [];

    // Define achievement badges based on stats
    if (userStats.threadsCreated >= 1) {
      badges.push({
        id: 'first-thread',
        name: 'First Thread',
        description: 'Created your first challenge thread',
        icon: '🎯',
        earnedAt: new Date(), // You'd track this properly
      });
    }

    if (userStats.threadsCreated >= 10) {
      badges.push({
        id: 'thread-creator',
        name: 'Thread Creator',
        description: 'Created 10 challenge threads',
        icon: '🏭',
        earnedAt: new Date(),
      });
    }

    if (userStats.solutionsAccepted >= 5) {
      badges.push({
        id: 'problem-solver',
        name: 'Problem Solver',
        description: 'Had 5 solutions accepted',
        icon: '🧠',
        earnedAt: new Date(),
      });
    }

    if (userStats.upvotesReceived >= 50) {
      badges.push({
        id: 'respected',
        name: 'Respected',
        description: 'Received 50 upvotes',
        icon: '⭐',
        earnedAt: new Date(),
      });
    }

    res.json({ badges });
  } catch (error) {
    logStructured.error('Get user badges failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users
router.get('/', async (req, res): Promise<void> => {
  try {
    const { q, role, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {
      isActive: true,
    };

    if (q) {
      whereClause.OR = [
        { username: { contains: q as string, mode: 'insensitive' } },
        { fullName: { contains: q as string, mode: 'insensitive' } },
        { bio: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
          location: true,
          role: true,
          expertise: true,
          joinDate: true,
          stats: true,
        },
        orderBy: { joinDate: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where: whereClause })
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
      }
    });
  } catch (error) {
    logStructured.error('Search users failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user activity feed
router.get('/:id/activities', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get recent activities from ThreadActivity table
    const [activities, totalCount] = await Promise.all([
      prisma.threadActivity.findMany({
        where: { userId: id },
        include: {
          thread: {
            select: {
              id: true,
              title: true,
              status: true,
            }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.threadActivity.count({
        where: { userId: id }
      })
    ]);

    res.json({
      activities,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    logStructured.error('Get user activities failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (requires authentication and ownership)
router.put('/:id/profile', authenticateToken, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Only allow users to update their own profile
    if (id !== userId) {
      res.status(403).json({ error: 'Forbidden: Can only update your own profile' });
      return;
    }

    const updateSchema = z.object({
      fullName: z.string().min(2).max(100).optional(),
      bio: z.string().max(500).optional(),
      location: z.string().max(100).optional(),
      expertise: z.array(z.string()).optional(),
      serviceBranch: z.string().max(50).optional(),
      yearsOfService: z.string().max(20).optional(),
      deploymentHistory: z.string().max(200).optional(),
      securityClearance: z.string().max(50).optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true,
        avatar: true,
        bio: true,
        location: true,
        expertise: true,
        serviceBranch: true,
        yearsOfService: true,
        deploymentHistory: true,
        securityClearance: true,
        joinDate: true,
        lastLoginAt: true,
      },
    });

    logStructured.info('User profile updated', { userId: id, username: req.user!.username });

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    logStructured.error('Update user profile failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 