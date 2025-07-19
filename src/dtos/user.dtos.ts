export interface UserDTO {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  hash: string;
  profilePic?: string;
  birthDate?: Date;
  isEmailVerified: boolean;
  passwordResetTokenExpires?: Date;
  passwordResetToken?: string;
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