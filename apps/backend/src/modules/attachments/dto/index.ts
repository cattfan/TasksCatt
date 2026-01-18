import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttachmentResponseDto {
    @ApiProperty({ example: 'uuid-attachment-id' })
    id: string;

    @ApiProperty({ example: 'mockup-design.png' })
    fileName: string;

    @ApiProperty({ example: '/uploads/2026/01/mockup-design.png' })
    fileUrl: string;

    @ApiProperty({ example: 102400, description: 'File size in bytes' })
    fileSize: number;

    @ApiProperty({ example: 'image/png' })
    mimeType: string;

    @ApiProperty({ example: '2026-01-15T12:00:00Z' })
    createdAt: Date;
}

export class UploadAttachmentDto {
    @ApiPropertyOptional({ example: 'uuid-task-id', description: 'Gắn file vào Task' })
    taskId?: string;

    @ApiPropertyOptional({ example: 'uuid-comment-id', description: 'Gắn file vào Comment' })
    commentId?: string;
}
