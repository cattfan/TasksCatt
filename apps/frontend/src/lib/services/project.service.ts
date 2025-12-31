import api from '@/lib/api';

export interface Project {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    ownerId: string;
    createdAt: string;
    owner?: {
        id: string;
        fullName: string;
    };
    members?: ProjectMember[];
    columns?: Column[];
    _count?: {
        members: number;
        columns: number;
    };
}

export interface ProjectMember {
    id: string;
    projectId: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
    joinedAt: string;
    user?: {
        id: string;
        email: string;
        fullName: string;
        avatarUrl: string | null;
    };
}

export interface Column {
    id: string;
    projectId: string;
    name: string;
    color: string;
    position: number;
    tasks?: Task[];
}

export interface Task {
    id: string;
    columnId: string;
    title: string;
    description: string | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    position: number;
    dueDate: string | null;
    assignee?: {
        id: string;
        fullName: string;
        avatarUrl: string | null;
    };
    creator?: {
        id: string;
        fullName: string;
    };
    column?: Column & {
        project?: {
            name: string;
            slug: string;
        };
    };
}

export interface CreateProjectDto {
    name: string;
    description?: string;
    slug?: string;
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    priority?: Task['priority'];
    columnId: string;
    assigneeId?: string;
    dueDate?: string;
}

export const projectService = {
    // Projects
    async getAll(): Promise<Project[]> {
        const { data } = await api.get<Project[]>('/projects');
        return data;
    },

    async getBySlug(slug: string): Promise<Project> {
        const { data } = await api.get<Project>(`/projects/${slug}`);
        return data;
    },

    async create(dto: CreateProjectDto): Promise<Project> {
        const { data } = await api.post<Project>('/projects', dto);
        return data;
    },

    async update(id: string, dto: Partial<CreateProjectDto>): Promise<Project> {
        const { data } = await api.patch<Project>(`/projects/${id}`, dto);
        return data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/projects/${id}`);
    },

    // Members
    async addMember(projectId: string, email: string, role: string): Promise<ProjectMember> {
        const { data } = await api.post<ProjectMember>(`/projects/${projectId}/members`, { email, role });
        return data;
    },

    async updateMemberRole(projectId: string, memberId: string, role: string): Promise<ProjectMember> {
        const { data } = await api.patch<ProjectMember>(`/projects/${projectId}/members/${memberId}`, { role });
        return data;
    },

    async removeMember(projectId: string, memberId: string): Promise<void> {
        await api.delete(`/projects/${projectId}/members/${memberId}`);
    },

    // Columns
    async addColumn(projectId: string, name: string, color?: string): Promise<Column> {
        const { data } = await api.post<Column>(`/projects/${projectId}/columns`, { name, color });
        return data;
    },

    async updateColumn(projectId: string, columnId: string, dto: { name?: string; color?: string }): Promise<Column> {
        const { data } = await api.patch<Column>(`/projects/${projectId}/columns/${columnId}`, dto);
        return data;
    },

    async deleteColumn(projectId: string, columnId: string): Promise<void> {
        await api.delete(`/projects/${projectId}/columns/${columnId}`);
    },

    async reorderColumns(projectId: string, columnIds: string[]): Promise<void> {
        await api.post(`/projects/${projectId}/columns/reorder`, { columnIds });
    },
};

export const taskService = {
    async getById(id: string): Promise<Task> {
        const { data } = await api.get<Task>(`/tasks/${id}`);
        return data;
    },

    async create(dto: CreateTaskDto): Promise<Task> {
        const { data } = await api.post<Task>('/tasks', dto);
        return data;
    },

    async update(id: string, dto: Partial<CreateTaskDto>): Promise<Task> {
        const { data } = await api.patch<Task>(`/tasks/${id}`, dto);
        return data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/tasks/${id}`);
    },

    async move(id: string, targetColumnId: string, newPosition: number): Promise<Task> {
        const { data } = await api.post<Task>(`/tasks/${id}/move`, { targetColumnId, newPosition });
        return data;
    },

    async search(projectId: string, filters: Record<string, string>): Promise<Task[]> {
        const params = new URLSearchParams(filters);
        const { data } = await api.get<Task[]>(`/tasks/search/${projectId}?${params}`);
        return data;
    },

    async getMyTasks(): Promise<Task[]> {
        const { data } = await api.get<Task[]>('/tasks/my-tasks');
        return data;
    },
};

export default { projectService, taskService };
