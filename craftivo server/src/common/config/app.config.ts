export interface DatabaseConfig {
  url: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfig {
  port: number;
  environment: string;
  frontendUrl: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
}
// Function to get the application configuration from environment variables
export const getConfig = (): AppConfig => {
  return {
    port: parseInt(process.env.PORT || '3000'),
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    database: {
      url: process.env.DATABASE_URL || '',
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
  };
};
