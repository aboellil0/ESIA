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
};

export default config;