// Global test setup
import { vi } from 'vitest';

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';

// Reset all mocks after each test
afterEach(() => {
    vi.clearAllMocks();
});
