import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the useAuth hook behavior
describe('useAuth Hook', () => {
    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
        avatarUrl: null,
        isActive: true,
    };

    const mockAuthContext = {
        user: mockUser as any,
        isLoading: false,
        isAuthenticated: true,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
    };

    // Create a test component that uses auth
    const TestAuthComponent = ({ authState }: { authState: typeof mockAuthContext }) => {
        return (
            <div>
                {authState.isLoading && <span data-testid="loading">Loading...</span>}
                {authState.isAuthenticated && (
                    <div data-testid="user-info">
                        <span data-testid="user-name">{authState.user?.fullName}</span>
                        <span data-testid="user-email">{authState.user?.email}</span>
                        <button data-testid="logout-btn" onClick={authState.logout}>
                            Logout
                        </button>
                    </div>
                )}
                {!authState.isAuthenticated && !authState.isLoading && (
                    <div data-testid="login-prompt">
                        <button data-testid="login-btn" onClick={() => authState.login({ email: '', password: '' })}>
                            Login
                        </button>
                    </div>
                )}
            </div>
        );
    };

    it('should display user info when authenticated', () => {
        render(<TestAuthComponent authState={mockAuthContext} />);

        expect(screen.getByTestId('user-info')).toBeInTheDocument();
        expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    it('should display loading state', () => {
        const loadingState = { ...mockAuthContext, isLoading: true, isAuthenticated: false, user: null };
        render(<TestAuthComponent authState={loadingState} />);

        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should display login prompt when not authenticated', () => {
        const unauthState = { ...mockAuthContext, isAuthenticated: false, user: null };
        render(<TestAuthComponent authState={unauthState} />);

        expect(screen.getByTestId('login-prompt')).toBeInTheDocument();
    });

    it('should call logout when logout button is clicked', () => {
        render(<TestAuthComponent authState={mockAuthContext} />);

        fireEvent.click(screen.getByTestId('logout-btn'));
        expect(mockAuthContext.logout).toHaveBeenCalled();
    });

    it('should call login when login button is clicked', () => {
        const unauthState = { ...mockAuthContext, isAuthenticated: false, user: null };
        render(<TestAuthComponent authState={unauthState} />);

        fireEvent.click(screen.getByTestId('login-btn'));
        expect(mockAuthContext.login).toHaveBeenCalled();
    });
});

describe('Auth Form Validation', () => {
    const LoginForm = ({ onSubmit }: { onSubmit: (data: { email: string; password: string }) => void }) => {
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');
        const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

        const validate = () => {
            const newErrors: { email?: string; password?: string } = {};

            if (!email) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                newErrors.email = 'Invalid email format';
            }

            if (!password) {
                newErrors.password = 'Password is required';
            } else if (password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (validate()) {
                onSubmit({ email, password });
            }
        };

        return (
            <form onSubmit={handleSubmit} data-testid="login-form">
                <div>
                    <input
                        type="email"
                        data-testid="email-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                    />
                    {errors.email && <span data-testid="email-error">{errors.email}</span>}
                </div>
                <div>
                    <input
                        type="password"
                        data-testid="password-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                    />
                    {errors.password && <span data-testid="password-error">{errors.password}</span>}
                </div>
                <button type="submit" data-testid="submit-btn">Login</button>
            </form>
        );
    };

    it('should show error for empty email', () => {
        const handleSubmit = jest.fn();
        render(<LoginForm onSubmit={handleSubmit} />);

        fireEvent.click(screen.getByTestId('submit-btn'));

        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
        expect(handleSubmit).not.toHaveBeenCalled();
    });

    /*
    it('should show error for invalid email format', async () => {
        const handleSubmit = jest.fn();
        render(<LoginForm onSubmit={handleSubmit} />);

        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'invalid-email' } });
        fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByTestId('submit-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('email-error')).toBeInTheDocument();
        });
        expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email format');
        expect(handleSubmit).not.toHaveBeenCalled();
    });
    */

    it('should show error for short password', () => {
        const handleSubmit = jest.fn();
        render(<LoginForm onSubmit={handleSubmit} />);

        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('password-input'), { target: { value: '123' } });
        fireEvent.click(screen.getByTestId('submit-btn'));

        expect(screen.getByTestId('password-error')).toHaveTextContent('Password must be at least 6 characters');
        expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('should submit form with valid data', () => {
        const handleSubmit = jest.fn();
        render(<LoginForm onSubmit={handleSubmit} />);

        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByTestId('submit-btn'));

        expect(handleSubmit).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        });
    });
});
