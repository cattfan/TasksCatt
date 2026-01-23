import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters';
import { SanitizePipe } from './common/pipes';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: ['error', 'warn', 'log', 'debug'],
    });

    // Serve static files from uploads directory
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });

    // API Versioning - Routes will be /api/v1/*
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
        prefix: 'api/v',
    });

    // Note: Don't use setGlobalPrefix with enableVersioning as it causes route conflicts

    // Security headers (Helmet)
    app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === 'production',
        crossOriginEmbedderPolicy: false, // Needed for file uploads
    }));

    // CORS - Strict origin policy
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:1005',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Global Exception Filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global Pipes: Validation + Sanitization
    app.useGlobalPipes(
        new SanitizePipe(),
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Swagger & Scalar Configuration
    const config = new DocumentBuilder()
        .setTitle('TasksCatt API Reference')
        .setDescription('Tài liệu API chi tiết cho hệ thống quản lý dự án TasksCatt')
        .setVersion('1.0')
        .addBearerAuth()
        .addServer('/api/v1', 'API Version 1')
        .build();

    const document = SwaggerModule.createDocument(app, config);

    app.use(
        '/docs',
        apiReference({
            spec: {
                content: document,
            },
        }),
    );

    const port = process.env.BACKEND_PORT || 5001;
    await app.listen(port);

    logger.log(`🚀 Backend is running on: http://localhost:${port}`);
    logger.log(`📚 API v1 endpoint: http://localhost:${port}/api/v1`);
    logger.log(`🏥 Health check: http://localhost:${port}/api/health`);
    logger.log(`📖 API Docs: http://localhost:${port}/docs`);
}

bootstrap();

