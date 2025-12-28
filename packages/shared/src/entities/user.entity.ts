/**
 * User Entity
 * Represents a user in the system (pure TypeScript, no framework dependencies)
 */
export type User = {
    /** Unique identifier (UUID) */
    id: string;
    /** User's email address (unique) */
    email: string;
    /** User's display name */
    fullName: string;
    /** URL to avatar image */
    avatarUrl: string | null;
    /** Account creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
};

/**
 * User with password hash (for internal backend use only)
 */
export type UserWithPassword = User & {
    /** Bcrypt hashed password */
    passwordHash: string;
};

/**
 * User creation input
 */
export type CreateUserInput = {
    email: string;
    password: string;
    fullName: string;
    avatarUrl?: string | null;
};

/**
 * User update input
 */
export type UpdateUserInput = {
    fullName?: string;
    avatarUrl?: string | null;
};
