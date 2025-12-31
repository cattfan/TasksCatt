'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface User {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    isAdmin: boolean;
    isBlocked: boolean;
    createdAt: string;
}

interface Stats {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    totalProjects: number;
}

export default function AdminPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (user?.isAdmin) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/stats'),
            ]);
            setUsers(usersRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to load admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleBlock = async (userId: string, block: boolean) => {
        try {
            await api.patch(`/admin/users/${userId}`, { isBlocked: block });
            loadData();
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
        try {
            await api.patch(`/admin/users/${userId}`, { isAdmin });
            loadData();
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'blocked') return matchesSearch && u.isBlocked;
        if (filter === 'admin') return matchesSearch && u.isAdmin;
        return matchesSearch;
    });

    // Check if current user is admin
    if (!user?.isAdmin) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-gray-500 mt-1">Manage users and system settings</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Users', value: stats.totalUsers, color: 'bg-indigo-500', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                        { label: 'Active Users', value: stats.activeUsers, color: 'bg-green-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { label: 'Blocked Users', value: stats.blockedUsers, color: 'bg-red-500', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
                        { label: 'Total Projects', value: stats.totalProjects, color: 'bg-amber-500', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
                    ].map((stat) => (
                        <div key={stat.label} className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-gray-500 mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                    />
                </div>

                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                >
                    <option value="all">All Users</option>
                    <option value="admin">Admins Only</option>
                    <option value="blocked">Blocked Only</option>
                </select>
            </div>

            {/* Users Table */}
            {isLoading ? (
                <div className="card p-6">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                <div className="flex-1 h-4 bg-gray-200 rounded" />
                                <div className="w-20 h-8 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                                                alt={u.fullName}
                                                className="w-10 h-10 rounded-full bg-gray-200"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{u.fullName}</p>
                                                <p className="text-sm text-gray-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {u.isBlocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${u.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {u.isAdmin ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {u.id !== user?.id && (
                                            <>
                                                <button
                                                    onClick={() => handleToggleAdmin(u.id, !u.isAdmin)}
                                                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                                                >
                                                    {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                </button>
                                                <button
                                                    onClick={() => handleToggleBlock(u.id, !u.isBlocked)}
                                                    className={`text-sm font-medium ${u.isBlocked ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'
                                                        }`}
                                                >
                                                    {u.isBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
