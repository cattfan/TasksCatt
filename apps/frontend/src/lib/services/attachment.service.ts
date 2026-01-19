import api from '@/lib/api';

export interface Attachment {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    taskId?: string;
    commentId?: string;
    createdAt: string;
}


export const attachmentService = {
    async upload(file: File, taskId?: string, commentId?: string): Promise<Attachment> {
        const formData = new FormData();
        formData.append('file', file);

        const params = new URLSearchParams();
        if (taskId) params.append('taskId', taskId);
        if (commentId) params.append('commentId', commentId);

        const { data } = await api.post<Attachment>(`/attachments/upload?${params}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    async getByTask(taskId: string): Promise<Attachment[]> {
        const { data } = await api.get<Attachment[]>(`/attachments/task/${taskId}`);
        return data;
    },

    async getByComment(commentId: string): Promise<Attachment[]> {
        const { data } = await api.get<Attachment[]>(`/attachments/comment/${commentId}`);
        return data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/attachments/${id}`);
    },

    async link(id: string, dto: { taskId?: string; commentId?: string }): Promise<Attachment> {
        const { data } = await api.patch<Attachment>(`/attachments/${id}/link`, dto);
        return data;
    },
};


export default attachmentService;
