import { modelKey, messageKey } from '@constants';
import { UserDTO, LoginDTO } from '@dtos';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import {
  JwtService,
  hashGenerator,
  CustomeError,
  comparePassword,
  CryptoService,
  EmailService,
} from '@utils';
import { Model } from 'mongoose';
import { verificationEmail } from 'src/comman/templates';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(modelKey.users) private userModel: Model<UserDTO>,
    private jwtService: JwtService,
    private cryptoService: CryptoService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async registerUser(userData: UserDTO) {
    try {
      const hash = await hashGenerator(userData.hash);
      const user = await this.userModel.findOneAndUpdate(
        {
          email: userData.email,
        },
        {
          ...userData,
          hash,
          isDeleted: false,
          $setOnInsert: {
            isEmailVerified: false,
          },
        },
        { new: true, upsert: true },
      );
      if (!user) throw new CustomeError(messageKey.recordNotCreated);
      return await this.sendVerticationLink(user._id.toString(), user.email);
    } catch (error) {
      throw error;
    }
  }

  async loginUser(loginData: LoginDTO) {
    try {
      if (!loginData.email && !loginData.hash)
        throw new CustomeError(messageKey.pleaseProvideRequiredFields);
      const { email, hash: password } = loginData;
      const user = await this.userModel.findOne({
        email,
        isDeleted: false,
      });
      if (!user) {
        throw new CustomeError(messageKey.userNotFound, HttpStatus.NOT_FOUND);
      }
      if (!user.isEmailVerified) {
        await this.sendVerticationLink(user._id.toString(), user.email);
        throw new CustomeError(
          messageKey.verificationEmailSent,
          HttpStatus.UNAUTHORIZED,
        );
      }
      const passwordMatch = await comparePassword(password, user.hash);
      if (!passwordMatch) throw new CustomeError(messageKey.invalidCredentials);
      const useData = {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic,
      };
      const token = await this.jwtService.createToken(useData);
      return {
        status: true,
        message: messageKey.loginSuccessMessage,
        data: useData,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  async verifyUser(token: string) {
    try {
      const data = this.cryptoService.decrypt(token);
      const user = await this.userModel.findOne({
        _id: data,
        isDeleted: false,
      });
      if (!user) throw new CustomeError(messageKey.userNotFound);
      user.isEmailVerified = true;
      await user.save();
      const link = `${this.configService.get('DOMAIN_URL')}auth/login`;
      return {
        status: true,
        message: messageKey.requestCompletedSuccessfully,
        data: link,
      };
    } catch (error) {
      throw error;
    }
  }

  async sendVerticationLink(userId: string, userEmail: string) {
    try {
      const token = this.cryptoService.encrypt(userId);
      const link = `${this.configService.get('API_URL')}/v1/auth/verification-link/${token}`;
      this.emailService.sendEmail({
        to: [userEmail],
        content: {
          subject: 'Verify you email',
          html: verificationEmail(link),
        },
      });
      return {
        status: true,
        message: messageKey.verificationEmailSent,
      };
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email, isDeleted: false });
    if (!user) {
      throw new CustomeError(messageKey.userNotFound, HttpStatus.NOT_FOUND);
    }

    const token = this.cryptoService.encrypt(user._id.toString());

    user.passwordResetToken = token;
    user.passwordResetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetLink = `${this.configService.get('DOMAIN_URL')}auth  /reset-password?token=${token}`;

    await this.emailService.sendEmail({
      to: [user.email],
      content: {
        subject: 'Reset Your Password',
        html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
      },
    });

    return {
      message: messageKey.verificationEmailSent,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: new Date() },
      isDeleted: false,
    });

    if (!user) {
      throw new CustomeError(messageKey.tokenError, HttpStatus.BAD_REQUEST);
    }

    user.hash = await hashGenerator(newPassword);
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    user.isEmailVerified = true; // ✅ Optional: verify email here
    await user.save();

    return {
      status: true,
      message: messageKey.successMessage,
    };
  }

  async getUserDetailsByToken(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || user.isDeleted)
      throw new CustomeError(messageKey.userNotFound);
    return {
      status: true,
      message: messageKey.successMessage,
      data: {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePic: user.profilePic,
      },
    };
  }
}
