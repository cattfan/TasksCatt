import { Module, Global } from '@nestjs/common';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';

const logDir = path.join(process.cwd(), 'logs');

@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
            transports: [
                // Console transport with colorization for development
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                        winston.format.ms(),
                        nestWinstonModuleUtilities.format.nestLike('TasksCatt', {
                            colors: true,
                            prettyPrint: true,
                        }),
                    ),
                }),
                // Error log file
                new winston.transports.File({
                    filename: path.join(logDir, 'error.log'),
                    level: 'error',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json(),
                    ),
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5,
                }),
                // Combined log file (all levels)
                new winston.transports.File({
                    filename: path.join(logDir, 'combined.log'),
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json(),
                    ),
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 10,
                }),
                // Access log file (info and above)
                new winston.transports.File({
                    filename: path.join(logDir, 'access.log'),
                    level: 'info',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json(),
                    ),
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5,
                }),
            ],
            // Exception and rejection handling
            exceptionHandlers: [
                new winston.transports.File({
                    filename: path.join(logDir, 'exceptions.log'),
                }),
            ],
            rejectionHandlers: [
                new winston.transports.File({
                    filename: path.join(logDir, 'rejections.log'),
                }),
            ],
        }),
    ],
    exports: [WinstonModule],
})
export class LoggerModule { }
