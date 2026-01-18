import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitization configuration
 * Strips all HTML tags by default for security
 */
const sanitizeConfig: sanitizeHtml.IOptions = {
    allowedTags: [], // No HTML allowed
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
};

/**
 * Sanitize Pipe
 * Sanitizes string inputs to prevent XSS attacks
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (metadata.type === 'body' && typeof value === 'object') {
            return this.sanitizeObject(value);
        }
        return value;
    }

    private sanitizeObject(obj: any): any {
        if (obj === null || obj === undefined) return obj;

        if (typeof obj === 'string') {
            return sanitizeHtml(obj, sanitizeConfig).trim();
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        if (typeof obj === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = this.sanitizeObject(value);
            }
            return sanitized;
        }

        return obj;
    }
}

