/**
 * Environment-specific constants
 */

export const ENVIRONMENT = {
  development: 'development',
  staging: 'staging',
  production: 'production',
} as const;

export const CURRENT_ENV = process.env.NODE_ENV || 'development';

export const IS_DEVELOPMENT = CURRENT_ENV === 'development';
export const IS_PRODUCTION = CURRENT_ENV === 'production';
