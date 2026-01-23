import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
    test: {
        globals: true,
        root: './',
        environment: 'node',
        include: ['**/*.spec.ts', '**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            exclude: ['node_modules/', 'dist/', '**/*.spec.ts', '**/*.test.ts', '**/*.d.ts'],
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 70,
                statements: 70,
            },
        },
        setupFiles: ['./test/setup.ts'],
    },
    plugins: [swc.vite()],
});
