// Role-based access utility

export type UserRole = 'admin' | 'manager' | 'owner' | 'cashier' | 'waiter' | 'user';

export const canViewStats = (role: UserRole) => ['owner', 'admin'].includes(role);
export const canViewPerformanceReports = (role: UserRole) => role === 'owner';
export const canManageRewards = (role: UserRole) => ['admin', 'manager'].includes(role);
export const canManageUsers = (role: UserRole) => role === 'admin';
export const canManageTransactions = (role: UserRole) => role === 'admin';
export const canManagePoints = (role: UserRole) => ['admin', 'manager'].includes(role);
export const canAddPoints = (role: UserRole) => ['cashier', 'waiter'].includes(role);
export const canViewPromotions = (role: UserRole) => role === 'waiter';
export const canViewOwnRewards = (role: UserRole) => role === 'user';
export const canEditProfile = (role: UserRole) => role === 'user';
export const canViewOwnTransactions = (role: UserRole) => role === 'user';

// Full CRUD for admin
export const isAdmin = (role: UserRole) => role === 'admin'; 