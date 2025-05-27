const requiredEnvVars = [
  'PORT',
  'JWT_SECRET',
  'DATABASE_URL',
  'NODE_ENV'
];

export const validateEnv = () => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}; 