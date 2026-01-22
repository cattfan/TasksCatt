'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Comment } from '@/lib/services/comment.service';
import TaskCommentItem from './TaskCommentItem';

// Loading skeleton for comments
function CommentSkeleton() {
    return (
        <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            </div>
        </div>
    );
}

interface TaskCommentsProps {
    comments: Comment[];
    isLoading: boolean;
    currentUserId?: string;
    userAvatarUrl?: string;
    userName?: string;
    onAddComment: (content: string) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
}

export default function TaskComments({
    comments,
    isLoading,
    currentUserId,
    userAvatarUrl,
    userName,
    onAddComment,
    onDeleteComment,
}: TaskCommentsProps) {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment(newComment);
            setNewComment('');
        } finally {
            setIsSubmitting(false);
        }
    }, [newComment, isSubmitting, onAddComment]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Bình luận ({comments.length})
            </h3>

            {/* Comment List */}
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                {isLoading ? (
                    <>
                        <CommentSkeleton />
                        <CommentSkeleton />
                    </>
                ) : comments.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">
                        Chưa có bình luận
                    </div>
                ) : (
                    comments.map((comment) => (
                        <TaskCommentItem
                            key={comment.id}
                            comment={comment}
                            currentUserId={currentUserId}
                            onDelete={onDeleteComment}
                        />
                    ))
                )}
            </div>

            {/* Add Comment */}
            <div className="flex gap-3">
                <Image
                    src={userAvatarUrl || `https://api.dicebear.com/9.x/big-ears/svg?seed=${currentUserId}`}
                    alt={userName || 'User'}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Thêm bình luận..."
                        className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onKeyDown={handleKeyDown}
                        disabled={isSubmitting}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || isSubmitting}
                        className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition"
                    >
                        {isSubmitting ? '...' : 'Gửi'}
                    </button>
                </div>
            </div>
        </div>
    );
}
