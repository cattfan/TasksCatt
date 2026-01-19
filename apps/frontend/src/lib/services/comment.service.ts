import api from '@/lib/api';
import { Attachment } from './attachment.service';


export interface Comment {
    id: string;
    taskId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        fullName: string;
        avatarUrl: string | null;
    };
    attachments?: Attachment[];
}



export interface CreateCommentDto {
    taskId: string;
    content: string;
}

export const commentService = {
    async getByTask(taskId: string): Promise<Comment[]> {
        const { data } = await api.get<Comment[]>(`/comments/task/${taskId}`);
        return data;
    },

    async create(dto: CreateCommentDto): Promise<Comment> {
        const { data } = await api.post<Comment>('/comments', dto);
        return data;
    },

    async update(id: string, content: string): Promise<Comment> {
        const { data } = await api.patch<Comment>(`/comments/${id}`, { content });
        return data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/comments/${id}`);
    },
};

export default commentService;
