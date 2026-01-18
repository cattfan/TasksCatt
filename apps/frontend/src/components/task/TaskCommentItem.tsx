'use client';

import { memo } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Comment } from '@/lib/services/comment.service';

interface TaskCommentItemProps {
    comment: Comment;
    currentUserId?: string;
    onDelete: (commentId: string) => void;
}

function TaskCommentItem({ comment, currentUserId, onDelete }: TaskCommentItemProps) {
    const handleDelete = () => {
        if (confirm('Xóa bình luận này?')) {
            onDelete(comment.id);
        }
    };

    return (
        <div className="flex gap-3">
            <Image
                src={comment.author?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.id}`}
                alt={comment.author?.fullName || 'User'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                        {comment.author?.fullName}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {comment.author?.id === currentUserId && (
                            <button
                                onClick={handleDelete}
                                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                aria-label="Xóa bình luận"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
            </div>
        </div>
    );
}

export default memo(TaskCommentItem);

