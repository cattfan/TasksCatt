import * as Joi from 'joi';

/**
 * Environment validation schema
 * Validates required and optional environment variables
 */
export const validationSchema = Joi.object({
    // Database
    DATABASE_URL: Joi.string().required(),

    // JWT Security - Minimum 32 characters (256-bit)
    JWT_SECRET: Joi.string().min(32).required().error(
        new Error('JWT_SECRET must be at least 32 characters long for security')
    ),
    JWT_EXPIRES_IN: Joi.string().default('7d'),

    // Server
    BACKEND_PORT: Joi.number().default(5001),
    FRONTEND_URL: Joi.string().default('http://localhost:1005'),

    // Node environment
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
});
