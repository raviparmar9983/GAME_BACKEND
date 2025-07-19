import { Global, Module } from '@nestjs/common';
import { CryptoService, JwtService } from '@utils';
import { AuthModule } from '@v1';
import { EmailService } from 'src/utils/nodemailer';

@Global()
@Module({
  imports: [AuthModule],
  providers: [JwtService, CryptoService, EmailService],
  exports: [JwtService, CryptoService, EmailService],
})
export class Modules {}
