'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/services/auth.service';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            // API call would go here
            await refreshUser();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch {
            setMessage({ type: 'error', text: 'Failed to change password. Check your current password.' });
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
        { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                        </svg>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-xl text-sm ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="card p-6 space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <img
                                src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                                alt={user?.fullName}
                                className="w-24 h-24 rounded-full bg-gray-200"
                            />
                            <button className="absolute bottom-0 right-0 p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{user?.fullName}</h3>
                            <p className="text-gray-500">{user?.email}</p>
                            {user?.isAdmin && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-2">
                                    Admin
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    disabled={!isEditing}
                                    className="input-field disabled:bg-gray-50 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="input-field bg-gray-50 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            {isEditing ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSaving} className="btn-primary">
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="btn-primary"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                                className="input-field"
                                placeholder="Enter current password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                minLength={8}
                                className="input-field"
                                placeholder="Minimum 8 characters"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                                className="input-field"
                                placeholder="Re-enter new password"
                            />
                        </div>
                        <button type="submit" disabled={isSaving} className="btn-primary mt-4">
                            {isSaving ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="card p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>

                    {[
                        { label: 'Email notifications', description: 'Receive email when someone mentions you' },
                        { label: 'Task updates', description: 'Get notified when tasks are updated' },
                        { label: 'Comment replies', description: 'Receive notifications for comment replies' },
                        { label: 'Project invites', description: 'Get notified when invited to projects' },
                    ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div>
                                <p className="font-medium text-gray-900">{item.label}</p>
                                <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                            </label>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
