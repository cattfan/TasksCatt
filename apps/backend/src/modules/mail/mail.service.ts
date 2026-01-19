import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    async sendMentionEmail(to: string, mentionedBy: string, taskTitle: string, commentContent: string) {
        this.logger.log(`[MOCK EMAIL SENT] To: ${to}`);
        this.logger.log(`Subject: Bạn đã được nhắc đến trong task "${taskTitle}"`);
        this.logger.log(`Content: ${mentionedBy} đã nhắc đến bạn: "${commentContent}"`);

        // In a real application, you would use Nodemailer, Resend, or SES here.
        return true;
    }

    async sendTaskUpdateEmail(to: string, taskTitle: string, updatedBy: string) {
        this.logger.log(`[MOCK EMAIL SENT] To: ${to}`);
        this.logger.log(`Subject: Task "${taskTitle}" đã được cập nhật bởi ${updatedBy}`);
        return true;
    }

    async sendProjectInviteEmail(to: string, projectName: string, invitedBy: string) {
        this.logger.log(`[MOCK EMAIL SENT] To: ${to}`);
        this.logger.log(`Subject: Bạn được mời tham gia dự án "${projectName}" bởi ${invitedBy}`);
        return true;
    }
}
