import { UserDTO, LoginDTO, ForgotPasswordDTO, ResetPasswordDTO } from '@dtos';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UsePipes,
} from '@nestjs/common';
import { handleError } from '@utils';
import { forgotPasswordValidator, resetPasswordValidator, userValidator } from '@validators';
import { Response } from 'express';
import { YupValidationPipe } from 'src/comman/pipe';
import { AuthService } from './auth.service';
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/register')
  @UsePipes(new YupValidationPipe(userValidator))
  async registerUser(@Body() userData: UserDTO, @Res() res: Response) {
    try {
      const user = await this.authService.registerUser(userData);
      res.status(HttpStatus.CREATED).json(user);
    } catch (error) {
      await handleError(res, error);
    }
  }

  @Post('/login')
  async loginUser(@Body() loginData: LoginDTO, @Res() res: Response) {
    try {
      const loginInfo = await this.authService.loginUser(loginData);
      res.status(HttpStatus.OK).json(loginInfo);
    } catch (error) {
      await handleError(res, error);
    }
  }

  @Get('/verification-link/:token')
  // @Redirect()
  async VerifyUser(@Param('token') token: string, @Res() res: Response) {
    try {
      const link = await this.authService.verifyUser(token);
      res.redirect(link?.data);
    } catch (error) {
      handleError(res, error);
    }
  }


  @Post('forgot-password')
  @UsePipes(new YupValidationPipe(forgotPasswordValidator))
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDTO) {
    const { email } = body;
    const result = await this.authService.forgotPassword(email);
    return {
      status: true,
      message: result.message,
    };
  }

  @Post('reset-password')
  @UsePipes(new YupValidationPipe(resetPasswordValidator))
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDTO) {
    const { token, password } = body;
    const result = await this.authService.resetPassword(token, password);
    return result;
  }
}
