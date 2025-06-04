export interface ActivityData {
    userId: string;
    threadId?: string;
    type: string;
    description: string;
    metadata?: any;
}
export interface StatsUpdate {
    userId: string;
    field: 'threadsCreated' | 'solutionsPosted' | 'commentsPosted' | 'upvotesReceived' | 'solutionsAccepted';
    increment?: number;
    decrement?: number;
}
export declare class ActivityTracker {
    static trackActivity(data: ActivityData): Promise<void>;
    static updateUserStats(updates: StatsUpdate[]): Promise<void>;
    static trackActivityAndStats(activity: ActivityData, statsUpdates: StatsUpdate[]): Promise<void>;
    static updateVoteStats(targetUserId: string, voteType: 'UPVOTE' | 'DOWNVOTE', isNew: boolean, wasOpposite?: boolean): Promise<void>;
    static updateSolutionAcceptanceStats(solutionAuthorId: string, threadAuthorId: string, isAccepted: boolean): Promise<void>;
}
export declare const trackThreadCreated: (userId: string, threadId: string, threadTitle: string) => Promise<void>;
export declare const trackSolutionCreated: (userId: string, threadId: string, solutionTitle: string) => Promise<void>;
export declare const trackCommentCreated: (userId: string, threadId: string, commentContent: string) => Promise<void>;
export declare const trackVoteCreated: (voterId: string, targetUserId: string, threadId: string | undefined, targetType: string, voteType: "UPVOTE" | "DOWNVOTE", isNew: boolean, wasOpposite?: boolean) => Promise<void>;
