import dotenv from "dotenv";
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  accessTokenSecret: string;
  accessTokenExpires: string;
  refreshTokenExpires: string;
  brevoApiKey: string;
  brevoSenderEmail: string;
  brevoSenderName: string;
  frontendUrl: string;
  emailVerificationExpiresHours: number;
  passwordResetExpiresMinutes: number;
}

const config: Config = {
  port: process.env.PORT ? Number(process.env.PORT) : 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "change_me_esia_jwt_secret_2026",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptRounds: process.env.BCRYPT_ROUNDS ? Number(process.env.BCRYPT_ROUNDS) : 12,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "change_me_esia_access_secret_2026_very_long_random_key_32chars",
  accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || process.env.JWT_EXPIRES_IN || "7d",
  brevoApiKey: process.env.BREVO_API_KEY || "",
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || "no-reply@esia.shop",
  brevoSenderName: process.env.BREVO_SENDER_NAME || "ESIA",
  frontendUrl: (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim(),
  emailVerificationExpiresHours: process.env.EMAIL_VERIFICATION_EXPIRES_HOURS
    ? Number(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS)
    : 24,
  passwordResetExpiresMinutes: process.env.PASSWORD_RESET_EXPIRES_MINUTES
    ? Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES)
    : 60,
};

export default config;