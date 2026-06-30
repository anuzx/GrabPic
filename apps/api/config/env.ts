const _config = {
  port: process.env.PORT ?? "5000",
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  frontendUrl: process.env.FRONTEND_URL!,
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;

const required = [
  "googleClientId",
  "googleClientSecret",
  "googleRedirectUri",
  "jwtSecret",
  "frontendUrl",
] as const satisfies readonly (keyof typeof _config)[];

for (const key of required) {
  if (!_config[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const config = Object.freeze(_config);
