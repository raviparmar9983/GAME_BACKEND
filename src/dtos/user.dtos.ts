export interface UserDTO {
  userName: string;
  coins: number;
  email?: string;
  hash?: string;
  isEmailVerified?: boolean;
  crazyGamesId?: string;
  avatar?: string;
  passwordResetTokenExpires?: Date;
  passwordResetToken?: string;
  isDeleted?: boolean;
  loginStreak: number;
  lastLoginRewardAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginDTO {
  email: string;
  hash: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export class ResetPasswordDTO {
  token: string;
  password: string;
}

export interface CrazyGamesAuthDTO {
  token: string;
}

export interface CrazyGamesTokenPayloadDTO {
  userId: string;
  gameId?: string;
  username: string;
  profilePictureUrl: string;
  iat: number;
  exp: number;
}
