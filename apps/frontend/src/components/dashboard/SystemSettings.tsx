'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface SystemConfig {
    key: string;
    value: string;
    description: string | null;
}

export function SystemSettings() {
    const [configs, setConfigs] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Default configs to ensure UI works even if DB is empty
    const defaultConfigs = {
        'MAINTENANCE_MODE': 'false',
        'ALLOW_REGISTRATION': 'true',
        'GLOBAL_BANNER': '',
    };

    const loadConfigs = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/system-config');
            const configMap: Record<string, string> = { ...defaultConfigs };
            res.data.forEach((c: SystemConfig) => {
                configMap[c.key] = c.value;
            });
            setConfigs(configMap);
        } catch (error) {
            console.error('Failed to load system config:', error);
            toast.error('Không thể tải cấu hình hệ thống');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadConfigs();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const configArray = Object.entries(configs).map(([key, value]) => ({
                key,
                value: String(value),
            }));
            await api.patch('/admin/system-config', configArray);
            toast.success('Đã lưu cấu hình hệ thống');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Lỗi khi lưu cấu hình');
        } finally {
            setIsSaving(false);
        }
    };

    const updateConfig = (key: string, value: string) => {
        setConfigs(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return <Skeleton className="h-[300px] w-full rounded-2xl" />;
    }

    return (
        <Card className="border-border/40 shadow-sm rounded-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Cấu hình hệ thống
                </CardTitle>
                <CardDescription>Quan lý các thiết lập toàn cục của ứng dụng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
                    <div className="space-y-0.5">
                        <Label className="text-base font-medium">Chế độ bảo trì</Label>
                        <p className="text-sm text-muted-foreground">
                            Chặn người dùng thường truy cập, chỉ Admin mới có thể đăng nhập.
                        </p>
                    </div>
                    <Switch
                        checked={configs['MAINTENANCE_MODE'] === 'true'}
                        onCheckedChange={(checked: boolean) => updateConfig('MAINTENANCE_MODE', String(checked))}
                    />
                </div>

                {/* Registration */}
                <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
                    <div className="space-y-0.5">
                        <Label className="text-base font-medium">Đăng ký thành viên</Label>
                        <p className="text-sm text-muted-foreground">
                            Cho phép người dùng mới tự đăng ký tài khoản.
                        </p>
                    </div>
                    <Switch
                        checked={configs['ALLOW_REGISTRATION'] === 'true'}
                        onCheckedChange={(checked: boolean) => updateConfig('ALLOW_REGISTRATION', String(checked))}
                    />
                </div>

                {/* Global Banner */}
                <div className="space-y-2">
                    <Label>Thông báo hệ thống (Banner)</Label>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Nhập nội dung thông báo hiển thị đầu trang..."
                            value={configs['GLOBAL_BANNER'] || ''}
                            onChange={(e) => updateConfig('GLOBAL_BANNER', e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Để trống để ẩn thông báo.
                    </p>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
                        {isSaving ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Lưu thay đổi
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
