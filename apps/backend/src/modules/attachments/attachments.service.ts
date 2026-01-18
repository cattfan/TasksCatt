import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

// Allowed file types
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class AttachmentsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Upload và lưu thông tin file
     */
    async upload(
        file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
        uploaderId: string,
        taskId?: string,
        commentId?: string,
    ) {
        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Loại file không được hỗ trợ. Chỉ chấp nhận: images, pdf, doc, xlsx`,
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException('File không được vượt quá 10MB');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;

        // Create uploads directory if not exists
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Save file to disk
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, file.buffer);

        // Save to database
        const attachment = await this.prisma.attachment.create({
            data: {
                fileName: file.originalname,
                fileUrl: `/uploads/${fileName}`,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploaderId,
                taskId: taskId || null,
                commentId: commentId || null,
            },
        });

        return attachment;
    }

    /**
     * Lấy thông tin attachment theo ID
     */
    async findById(id: string) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id },
            include: {
                uploader: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
        });

        if (!attachment) {
            throw new NotFoundException('Attachment không tồn tại');
        }

        return attachment;
    }

    /**
     * Lấy danh sách attachments của một Task
     */
    async findByTask(taskId: string) {
        return this.prisma.attachment.findMany({
            where: { taskId },
            include: {
                uploader: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Lấy danh sách attachments của một Comment
     */
    async findByComment(commentId: string) {
        return this.prisma.attachment.findMany({
            where: { commentId },
            include: {
                uploader: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Xóa attachment
     */
    async delete(id: string, userId: string) {
        const attachment = await this.findById(id);

        // Chỉ người upload mới được xóa
        if (attachment.uploaderId !== userId) {
            throw new ForbiddenException('Bạn không có quyền xóa file này');
        }

        // Delete file from disk
        const filePath = path.join(process.cwd(), attachment.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await this.prisma.attachment.delete({
            where: { id },
        });

        return { message: 'Đã xóa file thành công' };
    }

    /**
     * Gắn attachment vào Task hoặc Comment
     */
    async linkToTarget(attachmentId: string, taskId?: string, commentId?: string) {
        return this.prisma.attachment.update({
            where: { id: attachmentId },
            data: {
                taskId: taskId || null,
                commentId: commentId || null,
            },
        });
    }
}
