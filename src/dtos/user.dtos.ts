export interface UserDTO {
  userName: string;
  coins: number;
  email: string;
  hash: string;
  isEmailVerified: boolean;
  passwordResetTokenExpires?: Date;
  passwordResetToken?: string;
  isDeleted?: boolean;
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
