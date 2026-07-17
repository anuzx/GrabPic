const _config = {
  port: process.env.PORT ?? "5000",
  databaseUrl: process.env.DATABASE_URL!,
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI!,
  githubClientId: process.env.GITHUB_CLIENT_ID!,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET!,
  githubRedirectUri: process.env.GITHUB_REDIRECT_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  frontendUrl: process.env.FRONTEND_URL!,
  nodeEnv: process.env.NODE_ENV ?? "development",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY!,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET!,
  redis_url: process.env.REDIS_URL!,
  aiServiceUrl: process.env.AI_SERVICE_URL!,
} as const;

const required = [
  "databaseUrl",
  "googleClientId",
  "googleClientSecret",
  "googleRedirectUri",
  "githubClientId",
  "githubClientSecret",
  "githubRedirectUri",
  "jwtSecret",
  "frontendUrl",
  "cloudinaryCloudName",
  "cloudinaryApiKey",
  "cloudinaryApiSecret",
  "redis_url",
  "aiServiceUrl",
] as const satisfies readonly (keyof typeof _config)[];

for (const key of required) {
  if (!_config[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = Object.freeze(_config);
