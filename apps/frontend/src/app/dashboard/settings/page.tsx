'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/services/auth.service';
import { attachmentService } from '@/lib/services/attachment.service';
import { API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    User,
    Shield,
    Bell,
    Camera,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
    });

    const [notificationPrefs, setNotificationPrefs] = useState({
        emailNotifications: user?.emailNotifications ?? true,
        taskUpdateNotifications: user?.taskUpdateNotifications ?? true,
        commentReplyNotifications: user?.commentReplyNotifications ?? true,
        projectInviteNotifications: user?.projectInviteNotifications ?? true,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
            });
            setNotificationPrefs({
                emailNotifications: user.emailNotifications,
                taskUpdateNotifications: user.taskUpdateNotifications,
                commentReplyNotifications: user.commentReplyNotifications,
                projectInviteNotifications: user.projectInviteNotifications,
            });
        }
    }, [user]);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);

        try {
            await authService.updateProfile(user.id, { fullName: formData.fullName });
            await refreshUser();
            toast.success('Cập nhật hồ sơ thành công!');
            setIsEditing(false);
        } catch {
            toast.error('Không thể cập nhật hồ sơ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        // Validate file type/size if needed (e.g. only images, max 5MB)
        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh');
            return;
        }

        setIsSaving(true);
        try {
            toast.info('Đang tải ảnh lên...');
            // Upload using attachment service logic
            const attachment = await attachmentService.upload(file);

            // Construct full URL or relative path depending on backend expectation.
            // User entity avatarUrl usually expects full URL if it serves from external, or relative path.
            // But frontend rendering check `user.avatarUrl || dicebear`. 
            // In TaskDetailPanel: `src={${API_URL}${attr.fileUrl}}`.
            // So fileUrl is relative.
            // Let's verify how User avatarUrl is rendered elsewhere. In SideBar/Header?
            // Usually we store whatever backend returns.
            // If attachment.fileUrl is "/uploads/file.png", 
            // We should store "/uploads/file.png" if our UI handles prepending API_URL?
            // OR store full URL ${API_URL}/uploads/file.png.
            // Let's store full URL to be safe for global usage (like email templates etc) OR relative if we consistently use API_URL prefix.
            // Checking Sidebar/Header implementation would be best. But safe bet: store relative path if inconsistent, and handle prefix in UI.
            // Wait, in this Settings Page line 175: `src={user?.avatarUrl || ...`. It does NOT prepend API_URL.
            // So `user.avatarUrl` MUST be a FULL URL (or handled by Avatar component? No default AvatarImage src).
            // So we should store FULL URL.

            const fullAvatarUrl = `${API_URL}${attachment.fileUrl}`;

            await authService.updateProfile(user.id, { avatarUrl: fullAvatarUrl });
            await refreshUser();
            toast.success('Đã cập nhật ảnh đại diện');
        } catch (error) {
            console.error('Avatar upload error:', error);
            toast.error('Không thể tải ảnh lên');
        } finally {
            setIsSaving(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleUpdateNotificationPref = async (id: string, value: boolean) => {
        if (!user) return;

        const newPrefs = { ...notificationPrefs, [id]: value };
        setNotificationPrefs(newPrefs);

        try {
            await authService.updateProfile(user.id, { [id]: value });
            await refreshUser();
            toast.success('Đã cập nhật tùy chọn thông báo');
        } catch {
            toast.error('Không thể cập nhật tùy chọn thông báo');
            // Revert on error
            setNotificationPrefs(notificationPrefs);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }

        setIsSaving(true);

        try {
            await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
            toast.success('Đổi mật khẩu thành công!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch {
            toast.error('Không thể đổi mật khẩu. Kiểm tra mật khẩu hiện tại.');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Hồ sơ', icon: User },
        { id: 'security', label: 'Bảo mật', icon: Shield },
        { id: 'notifications', label: 'Thông báo', icon: Bell },
    ];

    const notificationSettings = [
        // { id: 'emailNotifications', label: 'Thông báo email', description: 'Nhận email khi có người nhắc đến bạn' }, // REMOVED as per request
        { id: 'taskUpdateNotifications', label: 'Cập nhật công việc', description: 'Nhận thông báo khi công việc được cập nhật' },
        { id: 'commentReplyNotifications', label: 'Trả lời bình luận', description: 'Nhận thông báo khi có phản hồi bình luận' },
        { id: 'projectInviteNotifications', label: 'Lời mời dự án', description: 'Nhận thông báo khi được mời tham gia dự án' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* ... (Header and Tabs code remains same) ... */}
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
                <p className="text-muted-foreground mt-1">
                    Quản lý tài khoản và tùy chọn của bạn
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/9.x/big-ears/svg?seed=${user?.email}`} />
                                    <AvatarFallback className="text-2xl">{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full"
                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                    disabled={isSaving}
                                >
                                    <Camera className="w-4 h-4" />
                                </Button>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">{user?.fullName}</h3>
                                <p className="text-muted-foreground">{user?.email}</p>
                                {user?.isAdmin && (
                                    <Badge className="mt-2">Admin</Badge>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Profile Form */}
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                                        Họ và tên
                                    </label>
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        disabled={!isEditing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                {isEditing ? (
                                    <>
                                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                            Hủy
                                        </Button>
                                        <Button type="submit" disabled={isSaving}>
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    Đang lưu...
                                                </>
                                            ) : (
                                                'Lưu thay đổi'
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <Button type="button" onClick={() => setIsEditing(true)}>
                                        Chỉnh sửa hồ sơ
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle>Đổi mật khẩu</CardTitle>
                        <CardDescription>
                            Cập nhật mật khẩu để bảo mật tài khoản
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                            <div className="space-y-2">
                                <label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
                                    Mật khẩu hiện tại
                                </label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    required
                                    placeholder="Nhập mật khẩu hiện tại"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                                    Mật khẩu mới
                                </label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    required
                                    minLength={8}
                                    placeholder="Tối thiểu 8 ký tự"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                    Xác nhận mật khẩu mới
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    required
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                            </div>
                            <Button type="submit" disabled={isSaving} className="mt-4">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Đang đổi...
                                    </>
                                ) : (
                                    'Đổi mật khẩu'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle>Tùy chọn thông báo</CardTitle>
                        <CardDescription>
                            Quản lý cách bạn nhận thông báo
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        {notificationSettings.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between py-4 border-b last:border-0"
                            >
                                <div>
                                    <p className="font-medium text-foreground">{item.label}</p>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!(notificationPrefs as any)[item.id]}
                                        onChange={(e) => handleUpdateNotificationPref(item.id, e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                                </label>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
