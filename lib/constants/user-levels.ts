/**
 * SUNBUGGY USER HIERARCHY
 * Single Source of Truth for Permissions & Access Control
 */

export const USER_LEVELS = {
  GUEST: 0,      // Virtual Level: Not logged in (Public Website)
  CUSTOMER: 100, // Logged In: Can see "My Account", Bookings, Waivers
  STAFF: 300,    // Internal: Standard entry for Drivers, Front Desk, Mechanics
  MANAGER: 500,  // Operations: Can edit daily schedules, assign fleets
  ADMIN: 900,    // System: Can edit user roles and system configs
  HR: 925,       // Sensitive: Payroll/SSN access
  DEV: 950       // Superuser: Root access / Developer tools
} as const;

export const ROLE_LABELS: Record<number, string> = {
  [USER_LEVELS.GUEST]: "Guest (Visitor)",
  [USER_LEVELS.CUSTOMER]: "Customer",
  [USER_LEVELS.STAFF]: "Staff (Standard)",
  [USER_LEVELS.MANAGER]: "Manager (Ops)",
  [USER_LEVELS.ADMIN]: "Admin (System)",
  [USER_LEVELS.HR]: "Human Resources",
  [USER_LEVELS.DEV]: "Developer",
};

/**
 * UTILITY FUNCTIONS
 * Use these for clean, readable permission checks in your UI.
 */

// Safe Access Check: Handles 'null' user automatically
// Usage: if (hasCustomerAccess(currentUser?.user_level)) { ... }
export const hasCustomerAccess = (level: number = USER_LEVELS.GUEST) => level >= USER_LEVELS.CUSTOMER;
export const hasStaffAccess = (level: number = USER_LEVELS.GUEST) => level >= USER_LEVELS.STAFF;
export const hasManagerAccess = (level: number = USER_LEVELS.GUEST) => level >= USER_LEVELS.MANAGER;
export const hasAdminAccess = (level: number = USER_LEVELS.GUEST) => level >= USER_LEVELS.ADMIN;